import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;
const PERU_TZ = "America/Lima";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ─── Telegram helpers ───────────────────────────────────────────
async function sendMessage(
  chatId: number,
  text: string,
  buttons: { text: string; callback_data: string }[][] | undefined,
  lovableKey: string,
  telegramKey: string
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (buttons) {
    body.reply_markup = { inline_keyboard: buttons };
  }
  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("sendMessage failed:", err);
  }
}

async function answerCallbackQuery(
  callbackQueryId: string,
  lovableKey: string,
  telegramKey: string
) {
  await fetch(`${GATEWAY_URL}/answerCallbackQuery`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  });
}

// ─── Time range validation ──────────────────────────────────────
const TIME_12H_RANGE_REGEX =
  /^(\d{1,2}):(\d{2})\s?(AM|PM)\s?-\s?(\d{1,2}):(\d{2})\s?(AM|PM)$/i;

function parseTimeTo24h(hour: number, minute: number, period: string): number {
  let h = hour;
  const p = period.toUpperCase();
  if (p === "AM" && h === 12) h = 0;
  if (p === "PM" && h !== 12) h += 12;
  return h * 60 + minute;
}

function validateTimeRange(input: string): { valid: boolean; error?: string } {
  const match = input.match(TIME_12H_RANGE_REGEX);
  if (!match) {
    return { valid: false, error: "Formato incorrecto.\n\nIngrese el rango en formato:\n<code>6:00 PM - 8:00 PM</code>" };
  }

  const startH = parseInt(match[1]);
  const startM = parseInt(match[2]);
  const startP = match[3];
  const endH = parseInt(match[4]);
  const endM = parseInt(match[5]);
  const endP = match[6];

  if (startH < 1 || startH > 12 || endH < 1 || endH > 12 || startM > 59 || endM > 59) {
    return { valid: false, error: "Formato incorrecto.\n\nIngrese el rango en formato:\n<code>6:00 PM - 8:00 PM</code>" };
  }

  const startMinutes = parseTimeTo24h(startH, startM, startP);
  const endMinutes = parseTimeTo24h(endH, endM, endP);

  let diff = endMinutes - startMinutes;
  if (diff < 0) diff += 24 * 60; // crosses midnight

  if (diff !== 120) {
    return { valid: false, error: "El rango horario debe ser de exactamente <b>2 horas</b>.\n\nEjemplo: <code>6:00 PM - 8:00 PM</code>" };
  }

  return { valid: true };
}

// ─── Risk helpers ───────────────────────────────────────────────
function getRiskColor(level: string) {
  switch (level) {
    case "ALTO": return "#C00000";
    case "MEDIO": return "#D4A017";
    case "BAJO": return "#196B24";
    default: return "#D4A017";
  }
}

function getRiskLabel(level: string) {
  switch (level) {
    case "ALTO": return "Alto";
    case "BAJO": return "Bajo";
    default: return level;
  }
}

// ─── Date helpers (Peru TZ) ─────────────────────────────────────
function peruNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: PERU_TZ })
  );
}

function peruDateFormatted() {
  const now = peruNow();
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${now.getDate()} de ${months[now.getMonth()]} del ${now.getFullYear()}`;
}

function lastDayOfMonth() {
  const now = peruNow();
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `Activo hasta el ${last.getDate()} de ${months[last.getMonth()]}`;
}

// ─── Email HTML generator ───────────────────────────────────────
function generarHTMLCorreo(d: {
  fecha: string;
  riskColor: string;
  riskLabel: string;
  timeRange: string;
  demandaEstimada: string;
  mensaje: string;
  estatus: string;
  graficoUrl?: string;
}) {
  const chartRow = d.graficoUrl
    ? `<tr><td style="padding:12px 24px"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151">Pronóstico de Demanda</p><img src="${d.graficoUrl}" alt="Gráfico" width="520" style="display:block;width:100%;max-width:520px;height:auto;border-radius:8px;border:1px solid #e5e7eb" /></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Pronóstico</title></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7">
<tr><td align="center" style="padding:32px 10px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
<tr><td align="center" style="padding:40px 24px 12px">
<table cellpadding="0" cellspacing="0"><tr><td align="center" width="56" height="56" style="width:56px;height:56px;border-radius:50%;border:4px solid #60a5fa;text-align:center;font-size:28px;line-height:56px">&#9889;</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:8px 24px 6px"><h1 style="margin:0;font-size:20px;color:#111827;font-weight:700">Pronóstico de potencia máxima</h1></td></tr>
<tr><td align="center" style="padding:4px 24px 20px"><p style="margin:0;font-size:16px;color:#111827;font-weight:700">${d.fecha}</p></td></tr>
<tr><td align="center" style="padding:0 24px 24px">
<table cellpadding="0" cellspacing="0"><tr><td style="background:${d.riskColor};color:#fff;font-size:13px;font-weight:700;padding:8px 28px;border-radius:20px;letter-spacing:.5px">RIESGO ${d.riskLabel.toUpperCase()}</td></tr></table>
</td></tr>
${chartRow}
<tr><td style="padding:24px 24px 20px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td width="50%" style="font-size:13px;font-weight:700;color:#374151;padding-bottom:12px;border-bottom:2px solid #d1d5db">Rango horario</td><td width="50%" style="font-size:13px;font-weight:700;color:#374151;padding-bottom:12px;border-bottom:2px solid #d1d5db;text-align:right">Demanda estimada</td></tr>
<tr><td style="font-size:14px;color:#4b5563;padding:14px 0;border-bottom:1px solid #e5e7eb">${d.timeRange}</td><td style="font-size:14px;color:#4b5563;padding:14px 0;border-bottom:1px solid #e5e7eb;text-align:right">${d.demandaEstimada} MW</td></tr>
</table>
</td></tr>
<tr><td style="padding:12px 24px 28px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td valign="top" width="58%" style="padding-right:16px"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151">Recuerde:</p><p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6">${d.mensaje}</p></td><td valign="top" width="42%" style="padding-left:16px"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151">Estatus:</p><p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6">${d.estatus}</p></td></tr>
</table>
</td></tr>
<tr><td align="center" style="background:#e8920d;padding:20px 24px"><p style="margin:0;color:#fff;font-size:15px;font-weight:700;letter-spacing:2px">USUARIO ACTIVO</p></td></tr>
<tr><td align="center" style="padding:24px 24px"><p style="margin:0;font-size:12px;color:#9ca3af">Este correo fue enviado automáticamente por <strong style="color:#374151">SERGEN</strong></p><p style="margin:6px 0 0;font-size:12px;color:#9ca3af">info@sergen.pe</p></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Inactivity check ───────────────────────────────────────────
function isSessionExpired(state: any): boolean {
  if (!state?.last_interaction) return false;
  const lastInteraction = new Date(state.last_interaction).getTime();
  const now = Date.now();
  return (now - lastInteraction) > INACTIVITY_TIMEOUT_MS;
}

// ─── Main handler ───────────────────────────────────────────────
Deno.serve(async () => {
  const startTime = Date.now();

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return new Response("LOVABLE_API_KEY missing", { status: 500 });

  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  if (!TELEGRAM_API_KEY) return new Response("TELEGRAM_API_KEY missing", { status: 500 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Load authorized users from profiles table (telegram_chat_id field)
  const { data: authorizedProfiles } = await supabase
    .from("profiles")
    .select("telegram_chat_id, email, full_name, is_active")
    .not("telegram_chat_id", "is", null)
    .eq("is_active", true);
  
  const authorizedMap = new Map<number, { email: string | null; full_name: string | null }>();
  for (const p of (authorizedProfiles || [])) {
    const chatIdNum = parseInt(p.telegram_chat_id, 10);
    if (!isNaN(chatIdNum)) {
      authorizedMap.set(chatIdNum, { email: p.email, full_name: p.full_name });
    }
  }

  // Get global offset
  const { data: allStates } = await supabase
    .from("telegram_bot_state")
    .select("update_offset")
    .order("update_offset", { ascending: false })
    .limit(1);

  let globalOffset = allStates?.[0]?.update_offset ?? 0;
  let totalProcessed = 0;

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offset: globalOffset,
        timeout,
        allowed_updates: ["message", "callback_query"],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("getUpdates error:", data);
      break;
    }

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    for (const update of updates) {
      const chatId =
        update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
      const text = update.message?.text ?? "";
      const callbackData = update.callback_query?.data ?? "";
      const callbackQueryId = update.callback_query?.id;

      if (!chatId || !authorizedIds.has(chatId)) {
        if (chatId) {
          await sendMessage(
            chatId,
            "⛔ No estás autorizado para usar este bot.",
            undefined,
            LOVABLE_API_KEY,
            TELEGRAM_API_KEY
          );
        }
        continue;
      }

      // Answer callback query to remove loading state
      if (callbackQueryId) {
        await answerCallbackQuery(callbackQueryId, LOVABLE_API_KEY, TELEGRAM_API_KEY);
      }

      // Get or create bot state for this chat
      let { data: state } = await supabase
        .from("telegram_bot_state")
        .select("*")
        .eq("chat_id", chatId)
        .single();

      if (!state) {
        await supabase.from("telegram_bot_state").insert({ chat_id: chatId });
        const { data: newState } = await supabase
          .from("telegram_bot_state")
          .select("*")
          .eq("chat_id", chatId)
          .single();
        state = newState;
      }

      // ── Inactivity timeout check ──
      if (state && state.estado_conversacion !== "inicio" && isSessionExpired(state)) {
        await supabase
          .from("telegram_bot_state")
          .update({
            estado_conversacion: "inicio",
            riesgo_actual: null,
            rango_actual: null,
            last_interaction: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("chat_id", chatId);

        await sendMessage(
          chatId,
          "⏰ La sesión anterior fue reiniciada por inactividad.\n\nPuede comenzar nuevamente.",
          [
            [{ text: "📋 Actualizar alerta", callback_data: "actualizar" }],
            [{ text: "📊 Estado del día", callback_data: "estado" }],
          ],
          LOVABLE_API_KEY,
          TELEGRAM_API_KEY
        );

        // Re-fetch state after reset
        const { data: resetState } = await supabase
          .from("telegram_bot_state")
          .select("*")
          .eq("chat_id", chatId)
          .single();
        state = resetState;
      }

      const input = callbackData || text.trim();

      await processConversation(
        chatId,
        input,
        state,
        supabase,
        LOVABLE_API_KEY,
        TELEGRAM_API_KEY
      );

      totalProcessed++;
    }

    globalOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;

    // Update offset on all states
    await supabase
      .from("telegram_bot_state")
      .update({ update_offset: globalOffset })
      .gte("update_offset", 0);
  }

  return new Response(
    JSON.stringify({ ok: true, processed: totalProcessed, offset: globalOffset })
  );
});

// ─── Conversation state machine ────────────────────────────────
async function processConversation(
  chatId: number,
  input: string,
  state: any,
  supabase: any,
  lovableKey: string,
  telegramKey: string
) {
  const send = (text: string, buttons?: { text: string; callback_data: string }[][]) =>
    sendMessage(chatId, text, buttons, lovableKey, telegramKey);

  const updateState = (fields: Record<string, unknown>) =>
    supabase
      .from("telegram_bot_state")
      .update({
        ...fields,
        last_interaction: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("chat_id", chatId);

  const estado = state.estado_conversacion || "inicio";

  // ── Handle /start or /actualizar commands ──
  if (input === "/start" || input === "/actualizar") {
    await updateState({ estado_conversacion: "inicio" });
    await send("⚡ <b>SERGEN – Control de Demanda</b>\n\n¿Qué deseas hacer?", [
      [{ text: "📋 Actualizar alerta", callback_data: "actualizar" }],
      [{ text: "📊 Estado del día", callback_data: "estado" }],
    ]);
    return;
  }

  // ── Handle "estado" ──
  if (input === "estado") {
    await updateState({});
    const alertaHoy = state.alerta_enviada_hoy ? "✅ Sí" : "❌ No";
    await send(
      `📊 <b>Estado del día</b>\n\nAlerta enviada hoy: ${alertaHoy}\nEstado: ${estado}`
    );
    return;
  }

  // ── Handle "posponer" ──
  if (input === "posponer") {
    await updateState({});
    await send("⏳ De acuerdo, se pospondrá. Recibirás otro recordatorio más tarde.");
    return;
  }

  // ── Handle "actualizar" → start flow ──
  if (input === "actualizar") {
    // Check double-send before starting
    if (state.alerta_enviada_hoy) {
      await updateState({});
      await send("⚠️ La alerta de potencia coincidente ya fue enviada hoy.\n\nNo es posible enviar otra alerta hasta mañana.");
      return;
    }
    await updateState({ estado_conversacion: "esperando_riesgo" });
    await send("¿El riesgo de potencia coincidente es?", [
      [
        { text: "🟢 Bajo", callback_data: "riesgo_BAJO" },
        { text: "🔴 Alto", callback_data: "riesgo_ALTO" },
      ],
    ]);
    return;
  }

  // ── ESPERANDO RIESGO ──
  if (estado === "esperando_riesgo") {
    if (input === "riesgo_BAJO") {
      await updateState({
        riesgo_actual: "BAJO",
        rango_actual: "Libre",
        estado_conversacion: "confirmando_correos",
      });
      await showRecipients(chatId, "principales", supabase, send);
      return;
    }
    if (input === "riesgo_ALTO") {
      await updateState({
        riesgo_actual: "ALTO",
        estado_conversacion: "esperando_rango",
      });
      await send(
        "📝 Ingrese el rango horario de riesgo.\n\n<b>Formato requerido:</b>\n<code>6:00 PM - 8:00 PM</code>\n\nDebe ser un rango de exactamente 2 horas en formato 12h AM/PM."
      );
      return;
    }
    await send("Por favor seleccione una opción:", [
      [
        { text: "🟢 Bajo", callback_data: "riesgo_BAJO" },
        { text: "🔴 Alto", callback_data: "riesgo_ALTO" },
      ],
    ]);
    return;
  }

  // ── ESPERANDO RANGO ──
  if (estado === "esperando_rango") {
    const validation = validateTimeRange(input);
    if (!validation.valid) {
      await updateState({});
      await send(`❌ ${validation.error}`);
      return;
    }
    await updateState({
      rango_actual: input,
      estado_conversacion: "confirmando_correos",
    });
    await showRecipients(chatId, "principales", supabase, send);
    return;
  }

  // ── CONFIRMANDO CORREOS PRINCIPALES ──
  if (estado === "confirmando_correos") {
    if (input === "confirmar_correos") {
      await updateState({ estado_conversacion: "confirmando_bcc" });
      await showBccRecipients(chatId, supabase, send);
      return;
    }
    if (input === "agregar_correo") {
      await updateState({ estado_conversacion: "agregando_correo" });
      await send("📧 Escriba el correo electrónico a agregar:");
      return;
    }
    if (input.startsWith("eliminar_correo_")) {
      const id = input.replace("eliminar_correo_", "");
      await supabase.from("alert_recipients").delete().eq("id", id);
      await updateState({});
      await send("✅ Correo eliminado.");
      await showRecipients(chatId, "principales", supabase, send);
      return;
    }
    await showRecipients(chatId, "principales", supabase, send);
    return;
  }

  // ── AGREGANDO CORREO ──
  if (estado === "agregando_correo") {
    const email = input.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await updateState({});
      await send("❌ Formato de correo inválido. Intente de nuevo:");
      return;
    }
    const { data: anyAdmin } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin")
      .limit(1)
      .single();

    await supabase
      .from("alert_recipients")
      .insert({ email, added_by: anyAdmin?.user_id || "00000000-0000-0000-0000-000000000000" });
    await send(`✅ Correo <b>${email}</b> agregado.`);
    await updateState({ estado_conversacion: "confirmando_correos" });
    await showRecipients(chatId, "principales", supabase, send);
    return;
  }

  // ── CONFIRMANDO BCC ──
  if (estado === "confirmando_bcc") {
    if (input === "confirmar_bcc") {
      const { data: freshState } = await supabase
        .from("telegram_bot_state")
        .select("*")
        .eq("chat_id", chatId)
        .single();
      await updateState({ estado_conversacion: "confirmacion_final" });
      await showFinalSummary(chatId, freshState, supabase, send);
      return;
    }
    if (input === "agregar_bcc") {
      await updateState({ estado_conversacion: "agregando_bcc" });
      await send("📧 Escriba el correo BCC a agregar:");
      return;
    }
    if (input.startsWith("eliminar_bcc_")) {
      const email = input.replace("eliminar_bcc_", "");
      const currentBcc: string[] = state.bcc_emails || [];
      const updated = currentBcc.filter((e: string) => e !== email);
      await updateState({ bcc_emails: updated });
      await send(`✅ BCC <b>${email}</b> eliminado.`);
      const { data: freshState } = await supabase
        .from("telegram_bot_state")
        .select("*")
        .eq("chat_id", chatId)
        .single();
      await showBccRecipients(chatId, supabase, send, freshState?.bcc_emails);
      return;
    }
    await showBccRecipients(chatId, supabase, send);
    return;
  }

  // ── AGREGANDO BCC ──
  if (estado === "agregando_bcc") {
    const email = input.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await updateState({});
      await send("❌ Formato de correo inválido. Intente de nuevo:");
      return;
    }
    const currentBcc: string[] = state.bcc_emails || [];
    currentBcc.push(email);
    await updateState({
      bcc_emails: currentBcc,
      estado_conversacion: "confirmando_bcc",
    });
    await send(`✅ BCC <b>${email}</b> agregado.`);
    await showBccRecipients(chatId, supabase, send, currentBcc);
    return;
  }

  // ── CONFIRMACIÓN FINAL ──
  if (estado === "confirmacion_final") {
    if (input === "enviar_alerta") {
      // ── Double-send protection ──
      const { data: latestState } = await supabase
        .from("telegram_bot_state")
        .select("alerta_enviada_hoy")
        .eq("chat_id", chatId)
        .single();

      if (latestState?.alerta_enviada_hoy) {
        await updateState({
          estado_conversacion: "inicio",
          riesgo_actual: null,
          rango_actual: null,
        });
        await send("⚠️ La alerta de potencia coincidente ya fue enviada hoy.\n\nNo es posible enviar otra alerta hasta mañana.");
        return;
      }

      await send("⏳ Procesando... Guardando configuración y enviando correo...");

      try {
        // 1. Save forecast settings (like "Guardar cambios")
        const { data: freshState } = await supabase
          .from("telegram_bot_state")
          .select("*")
          .eq("chat_id", chatId)
          .single();

        const riesgo = freshState.riesgo_actual || "BAJO";
        const rango = freshState.rango_actual || "Libre";

        const { data: existing } = await supabase
          .from("forecast_settings")
          .select("id")
          .order("last_update", { ascending: false })
          .limit(1)
          .single();

        if (existing) {
          await supabase
            .from("forecast_settings")
            .update({
              risk_level: riesgo,
              modulation_time: rango,
              last_update: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("forecast_settings").insert({
            risk_level: riesgo,
            modulation_time: rango,
          });
        }

        // 2. Get latest chart image
        const { data: chartFiles } = await supabase.storage
          .from("chart-images")
          .list("", { limit: 1, sortBy: { column: "created_at", order: "desc" } });

        let graficoUrl: string | undefined;
        if (chartFiles && chartFiles.length > 0) {
          const { data: urlData } = supabase.storage
            .from("chart-images")
            .getPublicUrl(chartFiles[0].name);
          graficoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }

        // 3. Get demand estimate
        const { data: forecastData } = await supabase
          .from("coes_forecast")
          .select("pronostico")
          .order("fecha", { ascending: false })
          .limit(1)
          .single();

        const demandaEstimada = forecastData?.pronostico
          ? Number(forecastData.pronostico).toFixed(2)
          : "—";

        // 4. Generate email HTML
        const isLowRisk = riesgo === "BAJO";
        const fecha = peruDateFormatted();
        const htmlContent = generarHTMLCorreo({
          fecha,
          riskColor: getRiskColor(riesgo),
          riskLabel: getRiskLabel(riesgo),
          timeRange: isLowRisk ? "Uso libre de equipos" : rango,
          demandaEstimada,
          mensaje: isLowRisk
            ? "El día de hoy puede usar sus equipos sin rango horario de restricción."
            : "Solo usar equipos indispensables.",
          estatus: lastDayOfMonth(),
          graficoUrl,
        });

        // 5. Get recipients
        const { data: recipients } = await supabase
          .from("alert_recipients")
          .select("email");
        const emails = (recipients || []).map((r: any) => r.email);
        const bccEmails: string[] = freshState.bcc_emails || [];

        if (emails.length === 0) {
          await send("❌ No hay correos de destino configurados. Agregue al menos uno.");
          await updateState({ estado_conversacion: "confirmando_correos" });
          await showRecipients(chatId, "principales", supabase, send);
          return;
        }

        // 6. Send email
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const emailRes = await fetch(
          `${supabaseUrl}/functions/v1/send-email-alert`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ emails, bccEmails, htmlContent }),
          }
        );

        const emailData = await emailRes.json();

        if (!emailRes.ok || !emailData.success) {
          throw new Error("Email send failed");
        }

        // 7. Update state - mark alert as sent
        await updateState({
          alerta_enviada_hoy: true,
          estado_conversacion: "inicio",
          riesgo_actual: null,
          rango_actual: null,
        });

        await send(
          `✅ <b>Alerta enviada correctamente.</b>\n\n📧 Enviada a ${emails.length} destinatario(s)\n📋 Riesgo: ${getRiskLabel(riesgo)}\n🕐 Horario: ${isLowRisk ? "Libre" : rango}`
        );
      } catch (err) {
        console.error("Error sending alert:", err);
        await send(
          "❌ Error al enviar la alerta. Intente nuevamente o use la interfaz web."
        );
        await updateState({ estado_conversacion: "confirmacion_final" });
      }
      return;
    }

    if (input === "cancelar_alerta") {
      await updateState({
        estado_conversacion: "inicio",
        riesgo_actual: null,
        rango_actual: null,
      });
      await send("❌ Actualización de alerta cancelada.");
      return;
    }

    // Show summary again
    const { data: freshState } = await supabase
      .from("telegram_bot_state")
      .select("*")
      .eq("chat_id", chatId)
      .single();
    await showFinalSummary(chatId, freshState, supabase, send);
    return;
  }

  // ── Default: show menu ──
  await updateState({});
  await send("⚡ <b>SERGEN – Control de Demanda</b>\n\nEscriba /actualizar para comenzar.", [
    [{ text: "📋 Actualizar alerta", callback_data: "actualizar" }],
    [{ text: "📊 Estado del día", callback_data: "estado" }],
  ]);
}

// ─── Helper: show recipients list ───────────────────────────────
async function showRecipients(
  chatId: number,
  _type: string,
  supabase: any,
  send: (text: string, buttons?: any[][]) => Promise<void>
) {
  const { data: recipients } = await supabase
    .from("alert_recipients")
    .select("id, email")
    .order("created_at", { ascending: true });

  const list = (recipients || [])
    .map((r: any, i: number) => `${i + 1}. ${r.email}`)
    .join("\n");

  const deleteButtons = (recipients || []).map((r: any) => [
    { text: `❌ ${r.email}`, callback_data: `eliminar_correo_${r.id}` },
  ]);

  await send(
    `📧 <b>Correos principales:</b>\n\n${list || "No hay correos configurados."}\n\nSeleccione una opción:`,
    [
      ...deleteButtons,
      [{ text: "➕ Agregar correo", callback_data: "agregar_correo" }],
      [{ text: "✅ Confirmar correos", callback_data: "confirmar_correos" }],
    ]
  );
}

// ─── Helper: show BCC recipients ────────────────────────────────
async function showBccRecipients(
  chatId: number,
  supabase: any,
  send: (text: string, buttons?: any[][]) => Promise<void>,
  bccOverride?: string[]
) {
  let bccEmails = bccOverride;
  if (!bccEmails) {
    const { data: state } = await supabase
      .from("telegram_bot_state")
      .select("bcc_emails")
      .eq("chat_id", chatId)
      .single();
    bccEmails = state?.bcc_emails || [];
  }

  const list = (bccEmails || [])
    .map((e: string, i: number) => `${i + 1}. ${e}`)
    .join("\n");

  const deleteButtons = (bccEmails || []).map((e: string) => [
    { text: `❌ ${e}`, callback_data: `eliminar_bcc_${e}` },
  ]);

  await send(
    `📧 <b>Destinatarios ocultos (BCC):</b>\n\n${list || "No hay correos BCC configurados."}\n\nSeleccione una opción:`,
    [
      ...deleteButtons,
      [{ text: "➕ Agregar BCC", callback_data: "agregar_bcc" }],
      [{ text: "✅ Confirmar BCC", callback_data: "confirmar_bcc" }],
    ]
  );
}

// ─── Helper: show final summary (improved) ──────────────────────
async function showFinalSummary(
  chatId: number,
  state: any,
  supabase: any,
  send: (text: string, buttons?: any[][]) => Promise<void>
) {
  const { data: recipients } = await supabase
    .from("alert_recipients")
    .select("id");

  const riesgo = state?.riesgo_actual || "—";
  const rango = state?.rango_actual || "—";
  const correoCount = (recipients || []).length;
  const bccCount = (state?.bcc_emails || []).length;
  const isLowRisk = riesgo === "BAJO";

  const riesgoEmoji = riesgo === "ALTO" ? "🔴" : riesgo === "BAJO" ? "🟢" : "🟡";

  await send(
    `⚡ <b>SERGEN – Confirmación de alerta</b>\n\n${riesgoEmoji} Riesgo: <b>${getRiskLabel(riesgo).toUpperCase()}</b>\n🕐 Horario: <b>${isLowRisk ? "Libre" : rango}</b>\n📧 Destinatarios: <b>${correoCount}</b>\n📧 BCC: <b>${bccCount}</b>\n\n¿Desea enviar la alerta a los clientes?`,
    [
      [{ text: "✅ Enviar alerta", callback_data: "enviar_alerta" }],
      [{ text: "❌ Cancelar", callback_data: "cancelar_alerta" }],
    ]
  );
}
