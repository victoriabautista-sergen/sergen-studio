import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "chart-images";
const FILE_NAME = "dashboard_alerta_actual.png";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CHART] ========================================");
    console.log("[CHART] Iniciando generación de imagen de pronóstico");
    console.log("[CHART] Timestamp:", new Date().toISOString());

    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[CHART] No se recibió header Authorization");
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isServiceRole = token === serviceRoleKey;
    console.log("[CHART] Autenticación: isServiceRole =", isServiceRole);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey
    );

    if (!isServiceRole) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { error: authError } = await userClient.auth.getUser();
      if (authError) {
        console.error("[CHART] Error de autenticación de usuario:", authError.message);
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("[CHART] Usuario autenticado correctamente");
    }

    // --- Domain detection ---
    const FIXED_LOVABLE_URL = "https://sergen-studio.lovable.app";
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    console.log("[CHART] Detección de dominio - origin:", origin);
    console.log("[CHART] Detección de dominio - referer:", referer);

    let appUrl: string;
    const rawOrigin = origin || referer;

    if (rawOrigin) {
      try {
        const parsed = new URL(rawOrigin);
        const host = parsed.host.toLowerCase();
        const isLovable = host.includes("lovable");
        console.log("[CHART] Host detectado:", host);
        console.log("[CHART] ¿Entorno Lovable?:", isLovable);
        appUrl = isLovable ? FIXED_LOVABLE_URL : `${parsed.protocol}//${parsed.host}`;
      } catch {
        console.warn("[CHART] No se pudo parsear origin/referer, usando URL fija Lovable");
        appUrl = FIXED_LOVABLE_URL;
      }
    } else {
      console.log("[CHART] No se detectó origin ni referer, usando URL fija Lovable");
      appUrl = FIXED_LOVABLE_URL;
    }

    // --- Build capture URL ---
    const chartPageUrl = `${appUrl}/render/pronostico`;
    console.log("[CHART] URL base de la app:", appUrl);
    console.log("[CHART] URL de captura (captureUrl):", chartPageUrl);

    // --- Microlink screenshot ---
    console.log("[CHART] Intentando abrir la página /render/pronostico vía Microlink...");

    const microlinkUrl = new URL("https://api.microlink.io/");
    microlinkUrl.searchParams.set("url", chartPageUrl);
    microlinkUrl.searchParams.set("screenshot", "true");
    microlinkUrl.searchParams.set("meta", "false");
    microlinkUrl.searchParams.set("waitForTimeout", "5000");
    microlinkUrl.searchParams.set("element", "#chart-container");
    microlinkUrl.searchParams.set("screenshot.type", "png");

    console.log("[CHART] Microlink request URL:", microlinkUrl.toString());

    const microlinkRes = await fetch(microlinkUrl.toString());
    console.log("[CHART] Microlink HTTP status:", microlinkRes.status, microlinkRes.statusText);

    if (!microlinkRes.ok) {
      const errText = await microlinkRes.text();
      console.error("[CHART] Microlink error body:", errText);
      return new Response(JSON.stringify({ error: "Error generando screenshot del gráfico" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const microlinkData = await microlinkRes.json();
    console.log("[CHART] Microlink response status:", microlinkData.status);
    console.log("[CHART] Microlink screenshot URL:", microlinkData.data?.screenshot?.url ?? "NO DISPONIBLE");

    if (microlinkData.status !== "success" || !microlinkData.data?.screenshot?.url) {
      console.error("[CHART] Microlink no generó screenshot. Response:", JSON.stringify(microlinkData).substring(0, 500));
      return new Response(JSON.stringify({ error: "No se pudo generar la captura del gráfico" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Download screenshot ---
    const screenshotUrl = microlinkData.data.screenshot.url;
    console.log("[CHART] Iniciando descarga de la captura desde:", screenshotUrl);

    const imageRes = await fetch(screenshotUrl);
    console.log("[CHART] Descarga HTTP status:", imageRes.status);

    if (!imageRes.ok) {
      console.error("[CHART] Error descargando screenshot, status:", imageRes.status);
      return new Response(JSON.stringify({ error: "Error descargando la imagen del gráfico" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBlob = await imageRes.arrayBuffer();
    console.log("[CHART] Captura descargada correctamente:", imageBlob.byteLength, "bytes");

    // --- Upload to storage ---
    console.log("[CHART] Iniciando subida al bucket:", BUCKET, "archivo:", FILE_NAME);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(FILE_NAME, new Uint8Array(imageBlob), {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[CHART] Error subiendo imagen:", uploadError);
      return new Response(JSON.stringify({ error: "Error subiendo imagen al almacenamiento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(FILE_NAME);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    console.log("[CHART] Imagen subida exitosamente:", publicUrl);
    console.log("[CHART] Archivo generado:", FILE_NAME);
    console.log("[CHART] ========================================");

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[CHART] Error fatal en el proceso:", err);
    console.error("[CHART] Stack:", err instanceof Error ? err.stack : "N/A");
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
