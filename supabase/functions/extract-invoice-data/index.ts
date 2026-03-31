import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractJsonFromResponse(text: string): unknown {
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.search(/[\{\[]/);
  const end = cleaned.lastIndexOf(start !== -1 && cleaned[start] === "[" ? "]" : "}");
  if (start === -1 || end === -1) throw new Error("No JSON found in AI response");
  cleaned = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

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

    // Download the file and convert to base64 data URL
    console.log("Downloading file from:", image_url);
    const fileResponse = await fetch(image_url);
    if (!fileResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Could not download the file" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    
    // Convert to base64
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    // Detect mime type from URL
    const lowerUrl = image_url.toLowerCase();
    let mimeType = "image/png";
    if (lowerUrl.endsWith(".pdf")) mimeType = "application/pdf";
    else if (lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg")) mimeType = "image/jpeg";
    else if (lowerUrl.endsWith(".png")) mimeType = "image/png";
    else if (lowerUrl.endsWith(".webp")) mimeType = "image/webp";

    const dataUrl = `data:${mimeType};base64,${base64}`;
    console.log("File downloaded, mime:", mimeType, "size:", fileBuffer.byteLength);

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
  "op_gravadas": (número),
  "op_inafectas": (número o 0),
  "op_exonerada": (número o 0),
  "op_gratuita": (número o 0),
  "otros_cargos": (número o 0),
  "otros_descuentos": (número o 0),
  "subtotal": (número),
  "isc": (número o 0),
  "igv": (número),
  "importe_total": (número)
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
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes, intenta en unos segundos" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos AI agotados" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";
    console.log("AI response received, length:", content.length);

    // Robust JSON extraction
    const parsed = extractJsonFromResponse(content);

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
