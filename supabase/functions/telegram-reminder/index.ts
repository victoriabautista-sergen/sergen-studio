import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY missing");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse body to determine action
    let action = "reminders";
    try {
      const body = await req.json();
      action = body.action || "reminders";
    } catch {
      // default to reminders
    }

    // ── DAILY RESET ──
    if (action === "daily_reset") {
      await supabase
        .from("telegram_bot_state")
        .update({
          alerta_enviada_hoy: false,
          estado_conversacion: "inicio",
          riesgo_actual: null,
          rango_actual: null,
          updated_at: new Date().toISOString(),
        })
        .gte("chat_id", 0); // update all

      // Also update where chat_id < 0 (group chats)
      await supabase
        .from("telegram_bot_state")
        .update({
          alerta_enviada_hoy: false,
          estado_conversacion: "inicio",
          riesgo_actual: null,
          rango_actual: null,
          updated_at: new Date().toISOString(),
        })
        .lt("chat_id", 0);

      return new Response(
        JSON.stringify({ ok: true, action: "daily_reset" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── REMINDERS ──
    // Get Peru time hour
    const peruNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
    );
    const hour = peruNow.getHours();

    // Get all authorized chats
    const { data: authChats } = await supabase
      .from("telegram_authorized_chats")
      .select("chat_id");

    if (!authChats || authChats.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "No authorized chats" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    for (const chat of authChats) {
      // Check if alert already sent today
      const { data: state } = await supabase
        .from("telegram_bot_state")
        .select("alerta_enviada_hoy")
        .eq("chat_id", chat.chat_id)
        .single();

      if (state?.alerta_enviada_hoy) continue;

      let text = "";
      let buttons: { text: string; callback_data: string }[][] = [];

      if (hour >= 17) {
        text =
          "⚠️ <b>SERGEN ALERTA – Último aviso</b>\n\nDebe registrar ahora la alerta de potencia coincidente.";
        buttons = [[{ text: "📋 Actualizar", callback_data: "actualizar" }]];
      } else if (hour >= 16) {
        text =
          "⚡ <b>SERGEN ALERTA</b>\n\nEl sistema sigue sin registrar la actualización de la alerta de potencia coincidente.";
        buttons = [
          [{ text: "📋 Actualizar", callback_data: "actualizar" }],
          [{ text: "⏳ Posponer", callback_data: "posponer" }],
        ];
      } else if (hour >= 15) {
        text =
          "⚡ <b>SERGEN ALERTA</b>\n\nAún no se ha registrado la actualización de la alerta de potencia coincidente para hoy.";
        buttons = [
          [{ text: "📋 Actualizar", callback_data: "actualizar" }],
          [{ text: "⏳ Posponer", callback_data: "posponer" }],
        ];
      }

      if (!text) continue;

      const body: Record<string, unknown> = {
        chat_id: chat.chat_id,
        text,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      };

      await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      sent++;
    }

    return new Response(
      JSON.stringify({ ok: true, sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in telegram-reminder:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
