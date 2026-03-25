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
      // Reset all bot states for the new day
      const resetFields = {
        alerta_enviada_hoy: false,
        correo_enviado: false,
        estado_conversacion: "idle",
        riesgo_actual: null,
        rango_actual: null,
        modo_conversacion: null,
        actualizacion_en_proceso: false,
        usuario_actualizando: null,
        timestamp_actualizacion: null,
        last_interaction: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from("telegram_bot_state")
        .update(resetFields)
        .gte("chat_id", 0);

      await supabase
        .from("telegram_bot_state")
        .update(resetFields)
        .lt("chat_id", 0);

      return new Response(
        JSON.stringify({ ok: true, action: "daily_reset" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── REMINDERS (3:00 PM, 4:00 PM, 5:00 PM) ──
    const peruNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
    );
    const hour = peruNow.getHours();

    // ── Check if alert was already sent today (global check) ──
    const { data: fSettings } = await supabase
      .from("forecast_settings")
      .select("alert_sent_at")
      .order("last_update", { ascending: false })
      .limit(1)
      .single();

    if (fSettings?.alert_sent_at) {
      const sentDate = new Date(fSettings.alert_sent_at);
      const sentDay = `${sentDate.getFullYear()}-${sentDate.getMonth()}-${sentDate.getDate()}`;
      const todayDay = `${peruNow.getFullYear()}-${peruNow.getMonth()}-${peruNow.getDate()}`;
      if (sentDay === todayDay) {
        console.log(`[REMINDER] Alerta ya enviada hoy (${fSettings.alert_sent_at}). Omitiendo recordatorios.`);
        return new Response(
          JSON.stringify({ ok: true, message: "Alert already sent today, skipping reminders" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get authorized users from profiles table
    const { data: authorizedProfiles } = await supabase
      .from("profiles")
      .select("telegram_chat_id")
      .not("telegram_chat_id", "is", null)
      .eq("is_active", true);

    const authorizedChatIds = (authorizedProfiles || [])
      .map((p: any) => parseInt(p.telegram_chat_id, 10))
      .filter((id: number) => !isNaN(id));

    if (authorizedChatIds.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "No authorized users with Telegram" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    for (const chatId of authorizedChatIds) {
      // Check if correo already sent today (per-chat backup check)
      const { data: state } = await supabase
        .from("telegram_bot_state")
        .select("correo_enviado, alerta_enviada_hoy")
        .eq("chat_id", chatId)
        .single();

      // If correo already sent, skip
      if (state?.correo_enviado) continue;

      // Determine message based on hour
      let text = "";

      if (hour >= 17) {
        text =
          "⚠️ <b>SERGEN ALERTA – Último aviso</b>\n\nDebe registrar ahora la alerta de potencia coincidente.";
      } else if (hour >= 16) {
        text =
          "⚡ <b>SERGEN ALERTA</b>\n\nEl sistema sigue sin registrar la actualización de la alerta de potencia coincidente.";
      } else if (hour >= 15) {
        text =
          "⚡ <b>SERGEN ALERTA</b>\n\nAún no se ha registrado la actualización de la alerta de potencia coincidente para hoy.";
      }

      if (!text) continue;

      // Automatic mode: show both buttons
      const buttons = [
        [{ text: "🔧 Actualizar información", callback_data: "actualizar" }],
        [{ text: "⏳ Posponer", callback_data: "posponer" }],
      ];

      // Set mode to "automatico" so the poll function knows
      await supabase
        .from("telegram_bot_state")
        .upsert({
          chat_id: chatId,
          modo_conversacion: "automatico",
          last_interaction: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "chat_id" });

      const body: Record<string, unknown> = {
        chat_id: chatId,
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
