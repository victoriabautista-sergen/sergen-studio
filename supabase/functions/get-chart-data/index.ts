import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
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

    // Calculate Peru timezone dates
    const peruNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    const year = peruNow.getFullYear();
    const month = String(peruNow.getMonth() + 1).padStart(2, "0");
    const day = String(peruNow.getDate()).padStart(2, "0");
    const peruDateStr = `${year}-${month}-${day}`;

    // Start of today in Peru = midnight Peru time = 05:00 UTC
    const todayStartUTC = `${year}-${month}-${day}T05:00:00.000Z`;

    console.log(`[DATA] Fecha Peru: ${peruDateStr}, hora Peru: ${peruNow.toTimeString()}`);
    console.log(`[DATA] Consultando desde: ${todayStartUTC}`);

    // 1. Try today's data first
    let { data, error } = await supabase
      .from("coes_forecast")
      .select("fecha, reprogramado, pronostico, rango_inferior, rango_superior, ejecutado")
      .gte("fecha", todayStartUTC)
      .order("fecha", { ascending: true });

    if (error) {
      console.error("[DATA] Error en query:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const todayCount = data?.length ?? 0;
    console.log(`[DATA] Registros de hoy: ${todayCount}`);

    // 2. If no data for today, fallback to last 2 days (same as useForecastData in admin panel)
    if (todayCount === 0) {
      console.log("[DATA] No hay datos de hoy, consultando últimos 2 días como fallback...");

      // 2 days ago at midnight Peru time
      const twoDaysAgo = new Date(peruNow);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const fbYear = twoDaysAgo.getFullYear();
      const fbMonth = String(twoDaysAgo.getMonth() + 1).padStart(2, "0");
      const fbDay = String(twoDaysAgo.getDate()).padStart(2, "0");
      const fallbackStartUTC = `${fbYear}-${fbMonth}-${fbDay}T05:00:00.000Z`;

      console.log(`[DATA] Fallback desde: ${fallbackStartUTC}`);

      const { data: fbData, error: fbError } = await supabase
        .from("coes_forecast")
        .select("fecha, reprogramado, pronostico, rango_inferior, rango_superior, ejecutado")
        .gte("fecha", fallbackStartUTC)
        .order("fecha", { ascending: true });

      if (fbError) {
        console.error("[DATA] Error en fallback query:", fbError);
      } else {
        data = fbData;
        console.log(`[DATA] Registros fallback: ${data?.length ?? 0}`);
      }
    }

    // 3. Also fetch latest forecast_settings for context
    const { data: settings } = await supabase
      .from("forecast_settings")
      .select("risk_level, modulation_time, last_update")
      .order("last_update", { ascending: false })
      .limit(1)
      .single();

    const records = data || [];
    const count = records.length;

    if (count > 0) {
      console.log(`[DATA] Rango: ${records[0].fecha} → ${records[count - 1].fecha}`);
    } else {
      console.warn(`[DATA] ⚠️ No hay datos disponibles`);
    }

    console.log(`[RENDER] Estado final: ${count > 0 ? "con datos" : "vacío"} (${count} registros)`);

    return new Response(JSON.stringify({
      data: records,
      date: peruDateStr,
      count,
      settings: settings || null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[DATA] Error fatal:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
