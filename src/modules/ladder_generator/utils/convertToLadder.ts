/**
 * Converts simplified Structured Text (ST) to structured Ladder data
 * for visual rendering. Supports: AND, OR, NOT, basic latching.
 *
 * Key: identifies the principal operator respecting parentheses so the
 * Ladder topology follows the original grouping without expanding logic.
 */

export interface LadderContact {
  name: string;
  negated: boolean;
}

export interface LadderContactBlock {
  type: "contact";
  contact: LadderContact;
}

export interface LadderSeriesBlock {
  type: "series";
  children: LadderBlock[];
}

export interface LadderParallelBlock {
  type: "parallel";
  branches: LadderBlock[];
}

export type LadderBlock = LadderContactBlock | LadderSeriesBlock | LadderParallelBlock;

export type CoilType = "normal" | "set" | "reset";

export interface LadderRung {
  output: string;
  block: LadderBlock;
  coilType: CoilType;
  comment?: string;
}

export interface LadderResult {
  rungs: LadderRung[];
  errors: string[];
}

interface Token {
  type: "AND" | "OR" | "NOT" | "VAR" | "LPAREN" | "RPAREN";
  value?: string;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    if (expr[i] === " " || expr[i] === "\t") {
      i++;
      continue;
    }

    if (expr[i] === "(") {
      tokens.push({ type: "LPAREN" });
      i++;
      continue;
    }

    if (expr[i] === ")") {
      tokens.push({ type: "RPAREN" });
      i++;
      continue;
    }

    let word = "";
    while (
      i < expr.length &&
      expr[i] !== " " &&
      expr[i] !== "\t" &&
      expr[i] !== "(" &&
      expr[i] !== ")"
    ) {
      word += expr[i];
      i++;
    }

    const upper = word.toUpperCase();
    if (upper === "AND") tokens.push({ type: "AND" });
    else if (upper === "OR") tokens.push({ type: "OR" });
    else if (upper === "NOT") tokens.push({ type: "NOT" });
    else tokens.push({ type: "VAR", value: word });
  }

  return tokens;
}

interface VarNode {
  kind: "var";
  name: string;
  negated: boolean;
}

interface AndNode {
  kind: "and";
  children: ASTNode[];
}

interface OrNode {
  kind: "or";
  children: ASTNode[];
}

type ASTNode = VarNode | AndNode | OrNode;

function isWrappedBySingleParenPair(tokens: Token[]): boolean {
  if (tokens.length < 2) return false;
  if (tokens[0]?.type !== "LPAREN" || tokens[tokens.length - 1]?.type !== "RPAREN") return false;

  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i]?.type === "LPAREN") depth++;
    else if (tokens[i]?.type === "RPAREN") depth--;

    if (depth === 0 && i < tokens.length - 1) return false;
    if (depth < 0) throw new Error("Paréntesis no balanceados");
  }

  if (depth !== 0) throw new Error("Paréntesis no balanceados");
  return true;
}

function stripOuterParens(tokens: Token[]): Token[] {
  let current = tokens;
  while (isWrappedBySingleParenPair(current)) {
    current = current.slice(1, -1);
  }
  return current;
}

function splitTopLevelByOperator(tokens: Token[], operator: "AND" | "OR"): Token[][] {
  const parts: Token[][] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token?.type === "LPAREN") {
      depth++;
      continue;
    }

    if (token?.type === "RPAREN") {
      depth--;
      if (depth < 0) throw new Error("Paréntesis no balanceados");
      continue;
    }

    if (depth === 0 && token?.type === operator) {
      parts.push(tokens.slice(start, i));
      start = i + 1;
    }
  }

  if (depth !== 0) throw new Error("Paréntesis no balanceados");
  parts.push(tokens.slice(start));
  return parts;
}

function buildASTFromTokens(tokens: Token[]): ASTNode {
  const cleaned = stripOuterParens(tokens);
  if (cleaned.length === 0) throw new Error("Expresión incompleta");

  const orParts = splitTopLevelByOperator(cleaned, "OR");
  if (orParts.length > 1) {
    return { kind: "or", children: orParts.map(buildASTFromTokens) };
  }

  const andParts = splitTopLevelByOperator(cleaned, "AND");
  if (andParts.length > 1) {
    return { kind: "and", children: andParts.map(buildASTFromTokens) };
  }

  if (cleaned[0]?.type === "NOT") {
    const node = buildASTFromTokens(cleaned.slice(1));
    if (node.kind !== "var") {
      throw new Error("NOT aplicado a expresión compleja no soportado en MVP");
    }

    return {
      ...node,
      negated: !node.negated,
    };
  }

  if (cleaned.length === 1 && cleaned[0]?.type === "VAR") {
    return {
      kind: "var",
      name: cleaned[0].value!,
      negated: false,
    };
  }

  throw new Error("Expresión no soportada en esta versión");
}

function buildAST(expression: string): ASTNode {
  const tokens = tokenize(expression);
  if (tokens.length === 0) throw new Error("Expresión vacía");
  return buildASTFromTokens(tokens);
}

function astToBlock(ast: ASTNode): LadderBlock {
  if (ast.kind === "var") {
    return {
      type: "contact",
      contact: {
        name: ast.name,
        negated: ast.negated,
      },
    };
  }

  if (ast.kind === "and") {
    const children = ast.children.flatMap((child) => {
      const block = astToBlock(child);
      return block.type === "series" ? block.children : [block];
    });

    return children.length === 1 ? children[0] : { type: "series", children };
  }

  const branches = ast.children.flatMap((child) => {
    const block = astToBlock(child);
    return block.type === "parallel" ? block.branches : [block];
  });

  return branches.length === 1 ? branches[0] : { type: "parallel", branches };
}

function parseLine(line: string): { output: string; expression: string; coilType: CoilType } {
  const trimmed = line.trim().replace(/;$/, "").trim();
  const idx = trimmed.indexOf(":=");
  if (idx === -1) throw new Error(`Línea inválida (falta ":="): ${line.trim()}`);

  let leftSide = trimmed.slice(0, idx).trim();
  let coilType: CoilType = "normal";

  const upperLeft = leftSide.toUpperCase();
  if (upperLeft.startsWith("SET ")) {
    coilType = "set";
    leftSide = leftSide.slice(4).trim();
  } else if (upperLeft.startsWith("RESET ")) {
    coilType = "reset";
    leftSide = leftSide.slice(6).trim();
  }

  return {
    output: leftSide,
    expression: trimmed.slice(idx + 2).trim(),
    coilType,
  };
}

export function convertToLadder(inputText: string): LadderResult {
  const trimmed = inputText.trim();
  if (!trimmed) throw new Error("El campo de código ST no puede estar vacío.");
  if (trimmed.length > 5000) throw new Error("El código no debe exceder 5000 caracteres.");

  const lines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"));

  if (lines.length === 0) throw new Error("No se encontraron líneas válidas.");

  const rungs: LadderRung[] = [];
  const errors: string[] = [];

  for (const line of lines) {
    try {
      const { output, expression, coilType } = parseLine(line);
      const ast = buildAST(expression);
      const block = astToBlock(ast);
      rungs.push({ output, block, coilType });
    } catch (error: any) {
      errors.push(`${line}: ${error.message}`);
    }
  }

  return { rungs, errors };
}
