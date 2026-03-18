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

    // Use Peru timezone (UTC-5) for date calculations
    const peruNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    const twoDaysAgo = new Date(peruNow.getTime() - 2 * 24 * 60 * 60 * 1000);
    twoDaysAgo.setHours(0, 0, 0, 0);

    // Query all data from 2 days ago onwards (no upper limit to avoid cutting off recent data)
    const { data, error } = await supabase
      .from("coes_forecast")
      .select("fecha, reprogramado, pronostico, rango_inferior, rango_superior, ejecutado")
      .gte("fecha", twoDaysAgo.toISOString())
      .order("fecha", { ascending: true });

    if (error) {
      console.error("Error fetching forecast data:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: data || [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
