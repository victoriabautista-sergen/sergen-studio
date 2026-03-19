import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // --- Always use published URL for Microlink (stable, publicly accessible) ---
    const captureBaseUrl = "https://sergen-studio.lovable.app";
    const chartPageUrl = `${captureBaseUrl}/render/pronostico`;
    console.log("[CHART] URL de captura:", chartPageUrl);

    // --- Microlink screenshot: wait for #chart-ready DOM marker ---
    console.log("[CAPTURE] cargando URL:", chartPageUrl);
    console.log("[CAPTURE] esperando render (waitForSelector=#chart-ready)");

    const microlinkUrl = new URL("https://api.microlink.io/");
    microlinkUrl.searchParams.set("url", chartPageUrl);
    microlinkUrl.searchParams.set("screenshot", "true");
    microlinkUrl.searchParams.set("meta", "false");
    // Wait for the hidden #chart-ready element (added by React after 500ms post-render)
    microlinkUrl.searchParams.set("waitForSelector", "#chart-ready");
    microlinkUrl.searchParams.set("waitForTimeout", "15000");
    microlinkUrl.searchParams.set("element", "#chart-container");
    microlinkUrl.searchParams.set("screenshot.type", "png");
    microlinkUrl.searchParams.set("force", "true");

    console.log("[CAPTURE] Microlink request URL:", microlinkUrl.toString());

    const microlinkRes = await fetch(microlinkUrl.toString());
    console.log("[CAPTURE] Microlink HTTP status:", microlinkRes.status, microlinkRes.statusText);

    if (!microlinkRes.ok) {
      const errText = await microlinkRes.text();
      console.error("[CHART] Microlink error body:", errText);
      return new Response(JSON.stringify({ error: "Error generando screenshot del gráfico", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const microlinkData = await microlinkRes.json();
    console.log("[CHART] Microlink response status:", microlinkData.status);

    if (microlinkData.status !== "success" || !microlinkData.data?.screenshot?.url) {
      console.error("[CHART] Microlink no generó screenshot. Response:", JSON.stringify(microlinkData).substring(0, 500));
      return new Response(JSON.stringify({ error: "No se pudo generar la captura del gráfico" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Download screenshot ---
    const screenshotUrl = microlinkData.data.screenshot.url;
    console.log("[CHART] Screenshot URL:", screenshotUrl);

    const imageRes = await fetch(screenshotUrl);
    if (!imageRes.ok) {
      console.error("[CHART] Error descargando screenshot, status:", imageRes.status);
      return new Response(JSON.stringify({ error: "Error descargando la imagen del gráfico" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBlob = await imageRes.arrayBuffer();
    const imageSize = imageBlob.byteLength;
    console.log("[CHART] Imagen descargada:", imageSize, "bytes");

    // --- Validate image is not empty/too small (blank captures are ~30KB or less) ---
    if (imageSize < 5000) {
      console.error("[CHART] Imagen demasiado pequeña, probablemente vacía:", imageSize, "bytes");
      return new Response(JSON.stringify({ 
        error: "La captura del gráfico está vacía. Es posible que los datos no se hayan cargado a tiempo.",
        imageSize 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Upload to storage (upsert to always overwrite) ---
    console.log("[CHART] Subiendo al bucket:", BUCKET, "archivo:", FILE_NAME);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(FILE_NAME, new Uint8Array(imageBlob), {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[CHART] Error subiendo imagen:", JSON.stringify(uploadError));
      return new Response(JSON.stringify({ error: "Error subiendo imagen al almacenamiento", details: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Verify file exists after upload ---
    const { data: fileList, error: listError } = await supabase.storage
      .from(BUCKET)
      .list("", { search: FILE_NAME });

    if (listError || !fileList?.some(f => f.name === FILE_NAME)) {
      console.error("[CHART] Verificación post-upload falló. El archivo no existe en storage.");
      return new Response(JSON.stringify({ error: "El archivo se subió pero no se encontró en storage" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[CHART] Verificación post-upload exitosa: archivo confirmado en storage");

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(FILE_NAME);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    console.log("[CHART] Imagen subida exitosamente:", publicUrl);
    console.log("[CHART] Tamaño:", imageSize, "bytes");
    console.log("[CHART] ========================================");

    return new Response(
      JSON.stringify({ success: true, url: publicUrl, imageSize }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[CHART] Error fatal:", err);
    console.error("[CHART] Stack:", err instanceof Error ? err.stack : "N/A");
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
