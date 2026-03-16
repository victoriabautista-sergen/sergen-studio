import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const QUICKCHART_URL = "https://quickchart.io/chart";
const BUCKET = "chart-images";
const FILE_NAME = "dashboard_alerta_actual.png";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: accept service role or user JWT
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

    // Fetch forecast data (last 2 days)
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    twoDaysAgo.setHours(0, 0, 0, 0);

    const { data: forecastData, error: fetchError } = await supabase
      .from("coes_forecast")
      .select("fecha, reprogramado, pronostico, rango_inferior, rango_superior, ejecutado")
      .gte("fecha", twoDaysAgo.toISOString())
      .lte("fecha", now.toISOString())
      .order("fecha", { ascending: true });

    if (fetchError) {
      console.error("[CHART] Error fetching forecast data:", fetchError);
      return new Response(JSON.stringify({ error: "Error obteniendo datos de pronóstico" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!forecastData || forecastData.length === 0) {
      console.error("[CHART] No forecast data available");
      return new Response(JSON.stringify({ error: "No hay datos de pronóstico disponibles" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[CHART] Fetched ${forecastData.length} forecast records`);

    // Sort and process data
    const sorted = [...forecastData].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    // Find last executed data point
    let lastExecutedIdx = -1;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].ejecutado && sorted[i].ejecutado > 0) {
        lastExecutedIdx = i;
      }
    }

    const labels: string[] = [];
    const reprogramacion: (number | null)[] = [];
    const pronostico: (number | null)[] = [];
    const rangoInferior: (number | null)[] = [];
    const rangoSuperior: (number | null)[] = [];
    const demandaReal: (number | null)[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      const d = new Date(item.fecha);
      const hh = d.getUTCHours().toString().padStart(2, "0");
      const mm = d.getUTCMinutes().toString().padStart(2, "0");
      labels.push(`${hh}:${mm}`);

      reprogramacion.push(item.reprogramado && item.reprogramado > 0 ? item.reprogramado : null);
      demandaReal.push(item.ejecutado && item.ejecutado > 0 ? item.ejecutado : null);

      const showForecast = i > lastExecutedIdx;
      pronostico.push(showForecast && item.pronostico && item.pronostico > 0 ? item.pronostico : null);
      rangoInferior.push(showForecast && item.rango_inferior && item.rango_inferior > 0 ? item.rango_inferior : null);
      rangoSuperior.push(showForecast && item.rango_superior && item.rango_superior > 0 ? item.rango_superior : null);
    }

    // Find peak hour indices (18:00-23:00)
    const peakStartIndices: number[] = [];
    const peakEndIndices: number[] = [];
    let inPeak = false;
    for (let i = 0; i < sorted.length; i++) {
      const h = new Date(sorted[i].fecha).getUTCHours();
      if (h >= 18 && h < 23) {
        if (!inPeak) {
          peakStartIndices.push(i);
          inPeak = true;
        }
      } else if (inPeak) {
        peakEndIndices.push(i - 1);
        inPeak = false;
      }
    }
    if (inPeak) peakEndIndices.push(sorted.length - 1);

    // Build annotations for peak zones
    const annotations: Record<string, any> = {};
    for (let z = 0; z < peakStartIndices.length; z++) {
      annotations[`peak${z}`] = {
        type: "box",
        xMin: peakStartIndices[z],
        xMax: peakEndIndices[z],
        backgroundColor: "rgba(232,232,232,0.6)",
        borderWidth: 0,
      };
    }

    // Find peak reprogramado value in 18-23 range
    let peakVal = -Infinity;
    let peakIdx = -1;
    for (let i = 0; i < sorted.length; i++) {
      const h = new Date(sorted[i].fecha).getUTCHours();
      if (h >= 18 && h < 23 && reprogramacion[i] !== null && reprogramacion[i]! > peakVal) {
        peakVal = reprogramacion[i]!;
        peakIdx = i;
      }
    }

    if (peakIdx >= 0) {
      annotations["peakPoint"] = {
        type: "point",
        xValue: peakIdx,
        yValue: peakVal,
        radius: 6,
        backgroundColor: "#C00000",
        borderColor: "#fff",
        borderWidth: 2,
      };
      annotations["peakLabel"] = {
        type: "label",
        xValue: peakIdx,
        yValue: peakVal - 150,
        content: [`Pico: ${peakVal.toFixed(2)} MW`, `${labels[peakIdx]}`],
        backgroundColor: "rgba(255,255,255,0.9)",
        borderColor: "#d1d5db",
        borderWidth: 1,
        borderRadius: 4,
        font: { size: 11 },
        padding: 6,
      };
    }

    const chartConfig = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Reprogramación",
            data: reprogramacion,
            borderColor: "#C00000",
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            spanGaps: true,
          },
          {
            label: "Pronóstico Diario",
            data: pronostico,
            borderColor: "#f39200",
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            spanGaps: true,
          },
          {
            label: "Rango Inferior",
            data: rangoInferior,
            borderColor: "#90C418",
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            spanGaps: true,
          },
          {
            label: "Rango Superior",
            data: rangoSuperior,
            borderColor: "#90C418",
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            spanGaps: true,
          },
          {
            label: "Demanda Real",
            data: demandaReal,
            borderColor: "#156082",
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
          annotation: {
            annotations,
          },
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 24,
            },
          },
          y: {
            min: 5500,
            max: 8500,
          },
        },
      },
    };

    // Call QuickChart API to generate PNG
    console.log("[CHART] Calling QuickChart API...");
    const quickchartRes = await fetch(QUICKCHART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chart: chartConfig,
        width: 750,
        height: 400,
        backgroundColor: "#ffffff",
        format: "png",
        version: "4",
      }),
    });

    if (!quickchartRes.ok) {
      const errText = await quickchartRes.text();
      console.error("[CHART] QuickChart error:", errText);
      return new Response(JSON.stringify({ error: "Error generando imagen del gráfico" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBlob = await quickchartRes.arrayBuffer();
    console.log(`[CHART] Image generated: ${imageBlob.byteLength} bytes`);

    // Upload to storage, overwriting the single file
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
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[CHART] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
