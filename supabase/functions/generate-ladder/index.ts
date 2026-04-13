import { corsHeaders } from "@supabase/supabase-js/cors";

const MAX_LENGTH = 5000;

interface Rung {
  output: string;
  elements: string[];
}

function parseSTToLadder(stCode: string): { ladder: string; error?: string } {
  const lines = stCode
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("(*"));

  if (lines.length === 0) {
    return { ladder: "", error: "No se encontraron instrucciones válidas." };
  }

  // Reject complex constructs
  const forbidden = /\b(IF|THEN|ELSE|ELSIF|END_IF|FOR|TO|DO|END_FOR|WHILE|END_WHILE|REPEAT|UNTIL|END_REPEAT|CASE|END_CASE|FUNCTION|FUNCTION_BLOCK|PROGRAM)\b/i;
  for (const line of lines) {
    if (forbidden.test(line)) {
      return {
        ladder: "",
        error: `Estructura no soportada detectada: "${line}". Solo se permite lógica booleana simple (AND, OR, NOT).`,
      };
    }
  }

  const rungs: Rung[] = [];

  for (const line of lines) {
    // Match: Output := Expression ;
    const match = line.match(/^(\w+)\s*:=\s*(.+?)\s*;?\s*$/i);
    if (!match) {
      return { ladder: "", error: `Línea no reconocida: "${line}"` };
    }

    const output = match[1];
    const expr = match[2].trim();

    const elements = parseExpression(expr);
    rungs.push({ output, elements });
  }

  // Render ladder text
  const ladderLines: string[] = [];
  rungs.forEach((rung, i) => {
    ladderLines.push(`RUNG ${i + 1}:`);
    ladderLines.push(`|                                                    |`);

    const contacts = rung.elements.join("--");
    const pad = Math.max(0, 50 - contacts.length - rung.output.length - 6);
    ladderLines.push(
      `|--${contacts}${"-".repeat(pad)}--( ${rung.output} )--|`
    );

    ladderLines.push(`|                                                    |`);
    ladderLines.push("");
  });

  return { ladder: ladderLines.join("\n") };
}

function parseExpression(expr: string): string[] {
  // Split by OR first (parallel branches shown sequentially for text format)
  const orParts = expr.split(/\bOR\b/i).map((p) => p.trim());

  const elements: string[] = [];

  orParts.forEach((part, i) => {
    if (i > 0) elements.push("+OR+");

    // Split by AND
    const andParts = part.split(/\bAND\b/i).map((p) => p.trim());

    andParts.forEach((ap, j) => {
      if (j > 0) elements.push("--");

      const notMatch = ap.match(/^NOT\s+(\w+)$/i);
      if (notMatch) {
        elements.push(`[/  ${notMatch[1]}  /]`);
      } else {
        const clean = ap.replace(/[()]/g, "").trim();
        elements.push(`[ ${clean} ]`);
      }
    });
  });

  return elements;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const stCode = body?.st_code;

    if (!stCode || typeof stCode !== "string") {
      return new Response(
        JSON.stringify({ error: "El campo 'st_code' es requerido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (stCode.length > MAX_LENGTH) {
      return new Response(
        JSON.stringify({ error: `El código no debe exceder ${MAX_LENGTH} caracteres.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = parseSTToLadder(stCode);

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ladder: result.ladder }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error interno del servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
