/**
 * Converts simplified Structured Text (ST) to structured Ladder data
 * for visual rendering. Supports: AND, OR, NOT, basic latching.
 *
 * Key: preserves expression structure without expanding (no distribution).
 */

export interface LadderContact {
  name: string;
  negated: boolean;
}

/** A segment is either a single contact or a parallel group of contact sequences */
export interface LadderContactSegment {
  type: 'contact';
  contact: LadderContact;
}

export interface LadderParallelSegment {
  type: 'parallel';
  branches: LadderContact[][];
}

export type LadderSegment = LadderContactSegment | LadderParallelSegment;

export interface LadderRung {
  output: string;
  segments: LadderSegment[];
  comment?: string;
}

export interface LadderResult {
  rungs: LadderRung[];
  errors: string[];
}

// ── Tokenizer ──

interface Token {
  type: 'AND' | 'OR' | 'NOT' | 'VAR' | 'LPAREN' | 'RPAREN';
  value?: string;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    if (expr[i] === ' ' || expr[i] === '\t') { i++; continue; }
    if (expr[i] === '(') { tokens.push({ type: 'LPAREN' }); i++; continue; }
    if (expr[i] === ')') { tokens.push({ type: 'RPAREN' }); i++; continue; }
    let word = '';
    while (i < expr.length && expr[i] !== ' ' && expr[i] !== '\t' && expr[i] !== '(' && expr[i] !== ')') {
      word += expr[i]; i++;
    }
    const upper = word.toUpperCase();
    if (upper === 'AND') tokens.push({ type: 'AND' });
    else if (upper === 'OR') tokens.push({ type: 'OR' });
    else if (upper === 'NOT') tokens.push({ type: 'NOT' });
    else tokens.push({ type: 'VAR', value: word });
  }
  return tokens;
}

// ── AST ──

interface VarNode { kind: 'var'; name: string; negated: boolean; }
interface AndNode { kind: 'and'; children: ASTNode[]; }
interface OrNode  { kind: 'or';  children: ASTNode[]; }
type ASTNode = VarNode | AndNode | OrNode;

function parseExpr(tokens: Token[], pos: { i: number }): ASTNode {
  const children: ASTNode[] = [parseAndExpr(tokens, pos)];
  while (pos.i < tokens.length && tokens[pos.i]?.type === 'OR') {
    pos.i++;
    children.push(parseAndExpr(tokens, pos));
  }
  return children.length === 1 ? children[0] : { kind: 'or', children };
}

function parseAndExpr(tokens: Token[], pos: { i: number }): ASTNode {
  const children: ASTNode[] = [parseUnary(tokens, pos)];
  while (pos.i < tokens.length && tokens[pos.i]?.type === 'AND') {
    pos.i++;
    children.push(parseUnary(tokens, pos));
  }
  return children.length === 1 ? children[0] : { kind: 'and', children };
}

function parseUnary(tokens: Token[], pos: { i: number }): ASTNode {
  let negated = false;
  if (pos.i < tokens.length && tokens[pos.i]?.type === 'NOT') {
    negated = true;
    pos.i++;
  }
  const node = parseAtom(tokens, pos);
  if (negated) {
    if (node.kind === 'var') return { ...node, negated: true };
    throw new Error('NOT aplicado a expresión compleja no soportado en MVP');
  }
  return node;
}

function parseAtom(tokens: Token[], pos: { i: number }): ASTNode {
  const t = tokens[pos.i];
  if (!t) throw new Error('Expresión incompleta');
  if (t.type === 'VAR') { pos.i++; return { kind: 'var', name: t.value!, negated: false }; }
  if (t.type === 'LPAREN') {
    pos.i++;
    const node = parseExpr(tokens, pos);
    if (pos.i >= tokens.length || tokens[pos.i]?.type !== 'RPAREN') throw new Error('Paréntesis no balanceados');
    pos.i++;
    return node;
  }
  throw new Error('Expresión no soportada en esta versión');
}

function buildAST(expression: string): ASTNode {
  const tokens = tokenize(expression);
  if (tokens.length === 0) throw new Error('Expresión vacía');
  const pos = { i: 0 };
  const ast = parseExpr(tokens, pos);
  if (pos.i < tokens.length) throw new Error('Expresión no soportada en esta versión');
  return ast;
}

// ── AST → Segments (preserves structure) ──

function astToSegments(ast: ASTNode): LadderSegment[] {
  if (ast.kind === 'var') {
    return [{ type: 'contact', contact: { name: ast.name, negated: ast.negated } }];
  }

  if (ast.kind === 'and') {
    // Each AND child becomes segments in series.
    // If a child is OR, it becomes a parallel segment.
    // If a child is var, it becomes a contact segment.
    // If a child is AND, flatten its segments.
    const segments: LadderSegment[] = [];
    for (const child of ast.children) {
      if (child.kind === 'var') {
        segments.push({ type: 'contact', contact: { name: child.name, negated: child.negated } });
      } else if (child.kind === 'or') {
        // Convert OR children to parallel branches
        const branches: LadderContact[][] = child.children.map(orChild => orChildToContacts(orChild));
        segments.push({ type: 'parallel', branches });
      } else if (child.kind === 'and') {
        // Flatten nested AND
        segments.push(...astToSegments(child));
      }
    }
    return segments;
  }

  if (ast.kind === 'or') {
    // Top-level OR → single parallel segment
    const branches: LadderContact[][] = ast.children.map(child => orChildToContacts(child));
    return [{ type: 'parallel', branches }];
  }

  throw new Error('Expresión no soportada en esta versión');
}

/** Convert an OR-branch child into a flat contact list (series within the branch) */
function orChildToContacts(node: ASTNode): LadderContact[] {
  if (node.kind === 'var') {
    return [{ name: node.name, negated: node.negated }];
  }
  if (node.kind === 'and') {
    // All children must be vars for a flat branch
    const contacts: LadderContact[] = [];
    for (const child of node.children) {
      if (child.kind === 'var') {
        contacts.push({ name: child.name, negated: child.negated });
      } else {
        throw new Error('Expresión no soportada en esta versión');
      }
    }
    return contacts;
  }
  throw new Error('Expresión no soportada en esta versión');
}

// ── Line parsing ──

function parseLine(line: string): { output: string; expression: string } {
  const trimmed = line.trim().replace(/;$/, '').trim();
  const idx = trimmed.indexOf(':=');
  if (idx === -1) throw new Error(`Línea inválida (falta ":="): ${line.trim()}`);
  return {
    output: trimmed.slice(0, idx).trim(),
    expression: trimmed.slice(idx + 2).trim(),
  };
}

function stripOuterParens(expr: string): string {
  const s = expr.trim();
  if (!s.startsWith('(')) return s;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    if (depth === 0 && i < s.length - 1) return s;
  }
  return s.slice(1, -1).trim();
}

// ── Public API ──

export function convertToLadder(inputText: string): LadderResult {
  const trimmed = inputText.trim();
  if (!trimmed) throw new Error('El campo de código ST no puede estar vacío.');
  if (trimmed.length > 5000) throw new Error('El código no debe exceder 5000 caracteres.');

  const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  if (lines.length === 0) throw new Error('No se encontraron líneas válidas.');

  const rungs: LadderRung[] = [];
  const errors: string[] = [];

  for (const line of lines) {
    try {
      const { output, expression } = parseLine(line);
      const cleaned = stripOuterParens(expression);
      const ast = buildAST(cleaned);
      const segments = astToSegments(ast);
      rungs.push({ output, segments });
    } catch (e: any) {
      errors.push(`${line}: ${e.message}`);
    }
  }

  return { rungs, errors };
}
