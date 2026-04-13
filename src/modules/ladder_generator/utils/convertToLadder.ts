/**
 * Converts simplified Structured Text (ST) to structured Ladder data
 * for visual rendering. Supports: AND, OR, NOT, basic latching.
 */

export interface LadderContact {
  name: string;
  negated: boolean;
}

export interface LadderBranch {
  contacts: LadderContact[];
}

export interface LadderRung {
  output: string;
  branches: LadderBranch[];
  comment?: string;
}

export interface LadderResult {
  rungs: LadderRung[];
  errors: string[];
}

interface ParsedLine {
  output: string;
  expression: string;
}

function parseLine(line: string): ParsedLine {
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
    if (word.toUpperCase() === 'AND') tokens.push({ type: 'AND' });
    else if (word.toUpperCase() === 'OR') tokens.push({ type: 'OR' });
    else if (word.toUpperCase() === 'NOT') tokens.push({ type: 'NOT' });
    else tokens.push({ type: 'VAR', value: word });
  }
  return tokens;
}

interface VarNode { kind: 'var'; name: string; negated: boolean; }
interface AndNode { kind: 'and'; children: ASTNode[]; }
interface OrNode  { kind: 'or';  children: ASTNode[]; }
type ASTNode = VarNode | AndNode | OrNode;

function parseExpr(tokens: Token[], pos: { i: number }): ASTNode {
  let left = parseAndExpr(tokens, pos);
  const children: ASTNode[] = [left];
  while (pos.i < tokens.length && tokens[pos.i]?.type === 'OR') {
    pos.i++;
    children.push(parseAndExpr(tokens, pos));
  }
  return children.length === 1 ? children[0] : { kind: 'or', children };
}

function parseAndExpr(tokens: Token[], pos: { i: number }): ASTNode {
  let left = parseUnary(tokens, pos);
  const children: ASTNode[] = [left];
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
    throw new Error('Expresión no soportada en MVP');
  }
  return node;
}

function parseAtom(tokens: Token[], pos: { i: number }): ASTNode {
  const t = tokens[pos.i];
  if (!t) throw new Error('Expresión no soportada en MVP');
  if (t.type === 'VAR') { pos.i++; return { kind: 'var', name: t.value!, negated: false }; }
  if (t.type === 'LPAREN') {
    pos.i++;
    const node = parseExpr(tokens, pos);
    if (pos.i >= tokens.length || tokens[pos.i]?.type !== 'RPAREN') throw new Error('Paréntesis no balanceados');
    pos.i++;
    return node;
  }
  throw new Error('Expresión no soportada en MVP');
}

function buildAST(expression: string): ASTNode {
  const tokens = tokenize(expression);
  if (tokens.length === 0) throw new Error('Expresión vacía');
  const pos = { i: 0 };
  const ast = parseExpr(tokens, pos);
  if (pos.i < tokens.length) throw new Error('Expresión no soportada en MVP');
  return ast;
}

function allVars(nodes: ASTNode[]): boolean {
  return nodes.every(n => n.kind === 'var');
}

function nodeToContacts(node: ASTNode): LadderContact[] {
  if (node.kind === 'var') return [{ name: node.name, negated: node.negated }];
  if (node.kind === 'and' && allVars(node.children)) {
    return (node.children as VarNode[]).map(v => ({ name: v.name, negated: v.negated }));
  }
  throw new Error('Expresión no soportada en MVP');
}

function astToRung(ast: ASTNode, output: string): LadderRung {
  // Single variable
  if (ast.kind === 'var') {
    return { output, branches: [{ contacts: [{ name: ast.name, negated: ast.negated }] }] };
  }

  // Pure AND
  if (ast.kind === 'and') {
    if (allVars(ast.children)) {
      return { output, branches: [{ contacts: (ast.children as VarNode[]).map(v => ({ name: v.name, negated: v.negated })) }] };
    }

    // Pattern: OR(...) AND vars — e.g. (Start OR Motor) AND NOT Stop
    const orChild = ast.children.find(c => c.kind === 'or');
    const andVars = ast.children.filter(c => c.kind === 'var') as VarNode[];

    if (orChild && orChild.kind === 'or' && ast.children.filter(c => c.kind === 'or').length === 1) {
      if (!allVars(orChild.children)) throw new Error('Expresión no soportada en MVP');
      const orNodes = orChild.children as VarNode[];
      const sharedContacts: LadderContact[] = andVars.map(v => ({ name: v.name, negated: v.negated }));

      const branches: LadderBranch[] = orNodes.map(v => ({
        contacts: [{ name: v.name, negated: v.negated }, ...sharedContacts],
      }));

      return { output, branches };
    }
    throw new Error('Expresión no soportada en MVP');
  }

  // Pure OR (parallel)
  if (ast.kind === 'or') {
    const branches: LadderBranch[] = ast.children.map(child => ({
      contacts: nodeToContacts(child),
    }));
    return { output, branches };
  }

  throw new Error('Expresión no soportada en MVP');
}

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
      rungs.push(astToRung(ast, output));
    } catch (e: any) {
      errors.push(`${line}: ${e.message}`);
    }
  }

  return { rungs, errors };
}
