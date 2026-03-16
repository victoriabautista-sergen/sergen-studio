import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "chart-images";
const FILE_NAME = "dashboard_alerta_actual.png";

/**
 * Generates a chart image by taking a screenshot of the /chart-capture page
 * which renders the real ForecastChart component with current data.
 * Used primarily by the Telegram flow where html2canvas is not available.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isServiceRole = token === serviceRoleKey;

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
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get the app URL for the chart-capture page
    // Use the published URL or fallback to preview URL
    const appUrl = Deno.env.get("APP_URL") || "https://sergen-studio.lovable.app";
    const chartPageUrl = `${appUrl}/chart-capture`;

    console.log(`[CHART] Taking screenshot of: ${chartPageUrl}`);

    // Use microlink.io free API for JS-rendered screenshot
    const microlinkUrl = new URL("https://api.microlink.io/");
    microlinkUrl.searchParams.set("url", chartPageUrl);
    microlinkUrl.searchParams.set("screenshot", "true");
    microlinkUrl.searchParams.set("meta", "false");
    microlinkUrl.searchParams.set("waitForTimeout", "5000");
    microlinkUrl.searchParams.set("element", "#chart-container");
    microlinkUrl.searchParams.set("screenshot.type", "png");

    const microlinkRes = await fetch(microlinkUrl.toString());
    
    if (!microlinkRes.ok) {
      const errText = await microlinkRes.text();
      console.error("[CHART] Microlink error:", errText);
      return new Response(JSON.stringify({ error: "Error generando screenshot del gráfico" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const microlinkData = await microlinkRes.json();
    
    if (microlinkData.status !== "success" || !microlinkData.data?.screenshot?.url) {
      console.error("[CHART] Microlink response:", JSON.stringify(microlinkData));
      return new Response(JSON.stringify({ error: "No se pudo generar la captura del gráfico" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the screenshot image
    const screenshotUrl = microlinkData.data.screenshot.url;
    console.log(`[CHART] Downloading screenshot from: ${screenshotUrl}`);
    
    const imageRes = await fetch(screenshotUrl);
    if (!imageRes.ok) {
      console.error("[CHART] Failed to download screenshot");
      return new Response(JSON.stringify({ error: "Error descargando la imagen del gráfico" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBlob = await imageRes.arrayBuffer();
    console.log(`[CHART] Screenshot downloaded: ${imageBlob.byteLength} bytes`);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(FILE_NAME, new Uint8Array(imageBlob), {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[CHART] Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Error subiendo imagen al almacenamiento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(FILE_NAME);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    console.log(`[CHART] Uploaded successfully: ${publicUrl}`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[CHART] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
