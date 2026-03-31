import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image_url, nombre_hp, nombre_hfp } = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: "image_url is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const prompt = `Analiza esta factura de energía eléctrica y extrae los siguientes datos en formato JSON.

IMPORTANTE: 
- El concepto de energía en hora punta puede aparecer como: "${nombre_hp || "ENERGÍA ACTIVA EN HORA PUNTA"}" o similar.
- El concepto de energía fuera de hora punta puede aparecer como: "${nombre_hfp || "ENERGÍA ACTIVA EN HORA FUERA DE PUNTA"}" o similar.
- Para precio_hp y precio_hfp, extrae el VALOR UNITARIO (no el valor de venta total) de esos conceptos.

Extrae este JSON:
{
  "numero_factura": "número de la factura",
  "fecha_factura": "fecha en formato YYYY-MM-DD",
  "ruc": "RUC del emisor",
  "razon_social": "razón social del emisor",
  "precio_hp": (valor unitario de energía HP como número decimal),
  "precio_hfp": (valor unitario de energía HFP como número decimal),
  "items": [
    {
      "descripcion": "nombre del concepto",
      "unidad": "unidad de medida",
      "cantidad": (número),
      "valor_unitario": (número),
      "valor_venta": (número)
    }
  ],
  "subtotal": (número),
  "igv": (número),
  "importe_total": (número),
  "otros_cargos": 0
}

Responde SOLO con el JSON, sin markdown ni explicaciones.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle possible markdown wrapping)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify({ data: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
