/**
 * Converts simplified Structured Text (ST) to text-based Ladder diagram.
 * Supports: AND, OR, NOT, basic latching (output appears in its own expression).
 */

interface ParsedLine {
  output: string;
  expression: string;
}

function parseLine(line: string): ParsedLine {
  const trimmed = line.trim().replace(/;$/, '').trim();
  const parts = trimmed.split(':=');
  if (parts.length !== 2) {
    throw new Error(`Línea inválida (falta ":="): ${line.trim()}`);
  }
  return {
    output: parts[0].trim(),
    expression: parts[1].trim(),
  };
}

/** Remove outer parentheses if they wrap the entire expression */
function stripOuterParens(expr: string): string {
  const s = expr.trim();
  if (!s.startsWith('(')) return s;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    if (depth === 0 && i < s.length - 1) return s; // parens don't wrap everything
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

    // Read a word
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

// AST node types
interface VarNode { kind: 'var'; name: string; negated: boolean; }
interface AndNode { kind: 'and'; children: ASTNode[]; }
interface OrNode  { kind: 'or';  children: ASTNode[]; }
type ASTNode = VarNode | AndNode | OrNode;

/**
 * Simple recursive-descent parser:
 *   expr     -> andExpr (OR andExpr)*
 *   andExpr  -> unary (AND unary)*
 *   unary    -> NOT? atom
 *   atom     -> VAR | '(' expr ')'
 */
function parseExpr(tokens: Token[], pos: { i: number }): ASTNode {
  let left = parseAndExpr(tokens, pos);
  const children: ASTNode[] = [left];
  while (pos.i < tokens.length && tokens[pos.i]?.type === 'OR') {
    pos.i++; // consume OR
    children.push(parseAndExpr(tokens, pos));
  }
  return children.length === 1 ? children[0] : { kind: 'or', children };
}

function parseAndExpr(tokens: Token[], pos: { i: number }): ASTNode {
  let left = parseUnary(tokens, pos);
  const children: ASTNode[] = [left];
  while (pos.i < tokens.length && tokens[pos.i]?.type === 'AND') {
    pos.i++; // consume AND
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
    if (node.kind === 'var') {
      return { ...node, negated: true };
    }
    // NOT applied to a complex expression – not supported in MVP
    throw new Error('Expresión no soportada en MVP');
  }
  return node;
}

function parseAtom(tokens: Token[], pos: { i: number }): ASTNode {
  const t = tokens[pos.i];
  if (!t) throw new Error('Expresión no soportada en MVP');
  if (t.type === 'VAR') {
    pos.i++;
    return { kind: 'var', name: t.value!, negated: false };
  }
  if (t.type === 'LPAREN') {
    pos.i++; // consume (
    const node = parseExpr(tokens, pos);
    if (pos.i >= tokens.length || tokens[pos.i]?.type !== 'RPAREN') {
      throw new Error('Paréntesis no balanceados');
    }
    pos.i++; // consume )
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

/** Format a contact: normal [ X ] or negated [/ X ] */
function contact(name: string, negated: boolean): string {
  return negated ? `[/ ${name} ]` : `[ ${name} ]`;
}

/** Render a flat AND chain (series) as a single rung segment */
function renderSeries(nodes: ASTNode[]): string {
  return nodes.map(n => {
    if (n.kind === 'var') return contact(n.name, n.negated);
    throw new Error('Expresión no soportada en MVP');
  }).join('----');
}

/** Check if all children of an AND/OR are simple vars (no nesting) */
function allVars(nodes: ASTNode[]): boolean {
  return nodes.every(n => n.kind === 'var');
}

/**
 * Flatten an AST into ladder text for one output.
 * Handles:
 *  - Single var
 *  - AND (all vars → series)
 *  - OR (all vars → parallel)
 *  - OR of ANDs (each branch is AND of vars)
 *  - Latching pattern: (A OR Output) AND ... → parallel with output contact
 */
function astToLadder(ast: ASTNode, output: string): string {
  // Single variable
  if (ast.kind === 'var') {
    return `|----${contact(ast.name, ast.negated)}--------( ${output} )----|`;
  }

  // Pure AND
  if (ast.kind === 'and') {
    if (!allVars(ast.children)) {
      // Check for pattern: OR(...) AND var AND var...
      // e.g. (Start OR Motor) AND NOT Stop
      const orChild = ast.children.find(c => c.kind === 'or');
      const andVars = ast.children.filter(c => c.kind === 'var') as VarNode[];

      if (orChild && orChild.kind === 'or' && ast.children.filter(c => c.kind === 'or').length === 1) {
        if (!allVars(orChild.children)) throw new Error('Expresión no soportada en MVP');

        const orNodes = orChild.children as VarNode[];
        const seriesPart = andVars.map(v => contact(v.name, v.negated)).join('----');

        // Find the widest OR branch for alignment
        const branches = orNodes.map(v => contact(v.name, v.negated));
        const maxBranchLen = Math.max(...branches.map(b => b.length));

        const lines: string[] = [];
        const connector = seriesPart ? `----${seriesPart}----` : '----';

        for (let i = 0; i < branches.length; i++) {
          const branch = branches[i];
          const padded = branch + '-'.repeat(Math.max(0, maxBranchLen - branch.length));

          if (i === 0) {
            lines.push(`|----${padded}${connector}+----( ${output} )----|`);
          } else if (i === branches.length - 1) {
            lines.push(`|----${padded}${'-'.repeat(connector.length - 1)}|`);
          } else {
            lines.push(`|----${padded}${'-'.repeat(connector.length - 1)}|`);
          }

          if (i < branches.length - 1) {
            lines.push(`|${' '.repeat(4 + maxBranchLen + connector.length)}|`);
          }
        }
        return lines.join('\n');
      }
      throw new Error('Expresión no soportada en MVP');
    }
    const series = renderSeries(ast.children);
    return `|----${series}--------( ${output} )----|`;
  }

  // Pure OR (parallel branches)
  if (ast.kind === 'or') {
    // Each child can be a var or an AND of vars
    const branches: string[] = [];
    for (const child of ast.children) {
      if (child.kind === 'var') {
        branches.push(contact(child.name, child.negated));
      } else if (child.kind === 'and' && allVars(child.children)) {
        branches.push(renderSeries(child.children));
      } else {
        throw new Error('Expresión no soportada en MVP');
      }
    }

    const maxLen = Math.max(...branches.map(b => b.length));
    const lines: string[] = [];

    for (let i = 0; i < branches.length; i++) {
      const padded = branches[i] + '-'.repeat(Math.max(0, maxLen - branches[i].length));
      if (i === 0) {
        lines.push(`|----${padded}----+--------( ${output} )----|`);
      } else {
        lines.push(`|----${padded}----|`);
      }
      if (i < branches.length - 1) {
        lines.push(`|${' '.repeat(4 + maxLen + 4)}|`);
      }
    }
    return lines.join('\n');
  }

  throw new Error('Expresión no soportada en MVP');
}

export function convertToLadder(inputText: string): string {
  const trimmed = inputText.trim();
  if (!trimmed) throw new Error('El campo de código ST no puede estar vacío.');
  if (trimmed.length > 5000) throw new Error('El código no debe exceder 5000 caracteres.');

  const lines = trimmed
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('//'));

  if (lines.length === 0) throw new Error('No se encontraron líneas válidas.');

  const results: string[] = [];

  for (const line of lines) {
    try {
      const { output, expression } = parseLine(line);
      const cleaned = stripOuterParens(expression);
      const ast = buildAST(cleaned);
      const ladder = astToLadder(ast, output);
      results.push(`// ${output}\n${ladder}`);
    } catch (e: any) {
      results.push(`// Error en: ${line}\n// ${e.message}`);
    }
  }

  return results.join('\n\n');
}
