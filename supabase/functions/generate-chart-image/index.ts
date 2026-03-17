import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "chart-images";
const FILE_NAME = "dashboard_alerta_actual.png";

/**
 * Generates a chart image by taking a screenshot of the /render/pronostico page
 * which renders the real ForecastChart component with current data.
 * 
 * Domain logic:
 * - If the detected domain contains "lovable", uses the fixed published URL
 *   to avoid preview-auth issues.
 * - Otherwise, builds the URL dynamically from the request origin.
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

    // Build the capture URL based on the request origin
    const FIXED_LOVABLE_URL = "https://sergen-studio.lovable.app";
    const origin = req.headers.get("origin") || req.headers.get("referer");
    let appUrl: string;

    if (origin) {
      try {
        const parsed = new URL(origin);
        const host = parsed.host.toLowerCase();
        // If running inside Lovable, always use the fixed published URL
        appUrl = host.includes("lovable") ? FIXED_LOVABLE_URL : `${parsed.protocol}//${parsed.host}`;
      } catch {
        appUrl = FIXED_LOVABLE_URL;
      }
    } else {
      appUrl = FIXED_LOVABLE_URL;
    }

    const chartPageUrl = `${appUrl}/render/pronostico`;

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
