import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate today's date range in Peru timezone (UTC-5)
    const peruNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    const year = peruNow.getFullYear();
    const month = String(peruNow.getMonth() + 1).padStart(2, "0");
    const day = String(peruNow.getDate()).padStart(2, "0");

    // Start of today in Peru = midnight Peru time = 05:00 UTC
    const todayStartUTC = `${year}-${month}-${day}T05:00:00.000Z`;

    console.log(`[CHART-DATA] Peru date: ${year}-${month}-${day}, querying from: ${todayStartUTC}`);
    console.log(`[DATA] Fecha de datos solicitados: ${year}-${month}-${day} (hora Peru: ${peruNow.toISOString()})`);

    // Query today's data only (from midnight Peru time onwards)
    const { data, error } = await supabase
      .from("coes_forecast")
      .select("fecha, reprogramado, pronostico, rango_inferior, rango_superior, ejecutado")
      .gte("fecha", todayStartUTC)
      .order("fecha", { ascending: true });

    if (error) {
      console.error("[CHART-DATA] Error fetching forecast data:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = data?.length ?? 0;
    console.log(`[CHART-DATA] Registros encontrados: ${count}`);

    if (count > 0 && data) {
      const firstDate = data[0].fecha;
      const lastDate = data[count - 1].fecha;
      console.log(`[DATA] Rango de datos: ${firstDate} → ${lastDate}`);
    } else {
      console.warn(`[DATA] ⚠️ No hay datos para la fecha ${year}-${month}-${day}`);
    }

    return new Response(JSON.stringify({ data: data || [], date: `${year}-${month}-${day}` }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[CHART-DATA] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
