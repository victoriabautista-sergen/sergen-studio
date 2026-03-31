export interface FormulaVars {
  PNG: number;
  PNG_o: number;
  TC: number;
  TC_o: number;
  IPP: number;
  IPP_o: number;
}

export interface FormulaStep {
  label: string;
  value: number;
}

export interface FormulaResult {
  factorA: number;
  steps: FormulaStep[];
}

function safeEval(expr: string): number {
  const sanitized = expr.replace(/\s/g, "");
  if (!/^[\d+\-*/().]+$/.test(sanitized)) return 0;
  try {
    const result = new Function(`"use strict"; return (${sanitized})`)() as number;
    return isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

function substituteVars(expr: string, vars: FormulaVars): string {
  let result = expr.replace(/×/g, "*");
  // Replace longer names first to avoid partial matches
  const replacements: [RegExp, number][] = [
    [/PNG_o|PNGo/gi, vars.PNG_o],
    [/TC_o|TCo/gi, vars.TC_o],
    [/IPP_o|IPPo/gi, vars.IPP_o],
    [/PNG/gi, vars.PNG],
    [/TC/gi, vars.TC],
    [/IPP/gi, vars.IPP],
  ];
  for (const [pattern, value] of replacements) {
    result = result.replace(pattern, String(value));
  }
  return result;
}

/** Check if a string contains any of the known variable names */
function hasVariables(expr: string): boolean {
  return /PNG|TC|IPP/i.test(expr);
}

/** Find all balanced parenthesized groups, innermost first */
function findParenGroups(expr: string): { start: number; end: number; content: string }[] {
  const groups: { start: number; end: number; content: string }[] = [];
  const stack: number[] = [];
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === "(") stack.push(i);
    if (expr[i] === ")") {
      const s = stack.pop()!;
      groups.push({ start: s, end: i, content: expr.substring(s + 1, i) });
    }
  }
  // Fix: content extraction
  return groups.map(g => ({
    ...g,
    content: expr.substring(g.start + 1, g.end),
  }));
}

/** Split an expression by top-level + and - into terms */
function getTopLevelTerms(expr: string): string[] {
  const terms: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if ((ch === "+" || ch === "-") && depth === 0 && current.trim()) {
      terms.push(current.trim());
      current = ch === "-" ? "-" : "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) terms.push(current.trim());
  return terms.length > 1 ? terms : [];
}

/** Split by top-level * into factors */
function getTopLevelFactors(expr: string): string[] {
  const factors: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "*" && depth === 0 && current.trim()) {
      factors.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) factors.push(current.trim());
  return factors.length > 1 ? factors : [];
}

function cleanLabel(label: string): string {
  return label.replace(/\*/g, " × ").replace(/\//g, " / ").replace(/\s+/g, " ").trim();
}

export function evaluateFormula(formulaRaw: string, vars: FormulaVars): FormulaResult {
  // Get expression after "="
  let formula = formulaRaw.includes("=")
    ? formulaRaw.split("=").slice(1).join("=").trim()
    : formulaRaw.trim();

  formula = formula.replace(/×/g, "*");

  const numericFull = substituteVars(formula, vars);
  const factorA = safeEval(numericFull);

  const steps: FormulaStep[] = [];
  const seen = new Set<string>();

  const addStep = (label: string, value: number) => {
    const key = label.replace(/\s/g, "");
    if (seen.has(key)) return;
    seen.add(key);
    steps.push({ label: cleanLabel(label), value });
  };

  // 1. Find all parenthesized groups (innermost first by size)
  const groups = findParenGroups(formula);
  groups.sort((a, b) => (a.end - a.start) - (b.end - b.start));

  for (const group of groups) {
    const content = group.content.trim();
    if (!hasVariables(content)) continue;

    const numContent = substituteVars(content, vars);
    const val = safeEval(numContent);

    // Check if this group has top-level terms (addition/subtraction)
    const terms = getTopLevelTerms(content);
    if (terms.length > 0) {
      // First show each term
      for (const term of terms) {
        if (!hasVariables(term)) continue;
        const numTerm = substituteVars(term, vars);
        const termVal = safeEval(numTerm);
        // Check if the term itself has sub-expressions worth showing
        const innerGroups = findParenGroups(term);
        for (const ig of innerGroups) {
          const ic = ig.content.trim();
          if (hasVariables(ic)) {
            addStep(ic, safeEval(substituteVars(ic, vars)));
          }
        }
        addStep(term, termVal);
      }
      // Then show the sum
      addStep(content, val);
    } else {
      addStep(content, val);
    }
  }

  // 2. Check top-level factors of the full expression for any missed groups
  const topFactors = getTopLevelFactors(formula);
  if (topFactors.length > 1) {
    for (const factor of topFactors) {
      const stripped = factor.startsWith("(") && factor.endsWith(")")
        ? factor.substring(1, factor.length - 1)
        : factor;
      if (hasVariables(stripped)) {
        const val = safeEval(substituteVars(stripped, vars));
        addStep(stripped, val);
      }
    }
  }

  return { factorA, steps };
}
