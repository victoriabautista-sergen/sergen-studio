import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;
const PERU_TZ = "America/Lima";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

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
  /^(\d{1,2}):(\d{2})\s?(am|pm)\s?-\s?(\d{1,2}):(\d{2})\s?(am|pm)$/i;

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
    return {
      valid: false,
      error: "Formato inválido. Ingrese el rango en formato:\n<code>2:00 pm - 4:00 pm</code>",
    };
  }

  const startH = parseInt(match[1]);
  const startM = parseInt(match[2]);
  const startP = match[3];
  const endH = parseInt(match[4]);
  const endM = parseInt(match[5]);
  const endP = match[6];

  if (startH < 1 || startH > 12 || endH < 1 || endH > 12 || startM > 59 || endM > 59) {
    return {
      valid: false,
      error: "Formato inválido. Ingrese el rango en formato:\n<code>2:00 pm - 4:00 pm</code>",
    };
  }

  const startMinutes = parseTimeTo24h(startH, startM, startP);
  const endMinutes = parseTimeTo24h(endH, endM, endP);

  let diff = endMinutes - startMinutes;
  if (diff < 0) diff += 24 * 60;

  if (diff < 120) {
    return {
      valid: false,
      error: "El rango horario debe tener una diferencia mínima de <b>2 horas</b>.\n\nEjemplo: <code>2:00 pm - 4:00 pm</code>",
    };
  }

  return { valid: true };
}

// ─── Risk / date helpers ────────────────────────────────────────
function getRiskColor(level: string) {
  switch (level) {
    case "ALTO": return "#C00000";
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

function peruNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: PERU_TZ }));
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
  fecha: string; riskColor: string; riskLabel: string;
  timeRange: string; demandaEstimada: string; mensaje: string;
  estatus: string; graficoUrl?: string;
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
  return (Date.now() - new Date(state.last_interaction).getTime()) > INACTIVITY_TIMEOUT_MS;
}

// ─── Lock helpers ───────────────────────────────────────────────
async function isLockExpired(supabase: any): Promise<boolean> {
  // Check ALL rows for an active lock
  const { data: lockedRows } = await supabase
    .from("telegram_bot_state")
    .select("chat_id, actualizacion_en_proceso, timestamp_actualizacion")
    .eq("actualizacion_en_proceso", true);

  if (!lockedRows || lockedRows.length === 0) return false;

  for (const row of lockedRows) {
    if (row.timestamp_actualizacion) {
      const elapsed = Date.now() - new Date(row.timestamp_actualizacion).getTime();
      if (elapsed > LOCK_TIMEOUT_MS) {
        // Auto-release expired lock
        console.log(`[LOCK] Auto-releasing expired lock for chat_id ${row.chat_id} (${Math.round(elapsed / 1000)}s)`);
        await supabase
          .from("telegram_bot_state")
          .update({
            actualizacion_en_proceso: false,
            usuario_actualizando: null,
            timestamp_actualizacion: null,
            estado_conversacion: "idle",
            riesgo_actual: null,
            rango_actual: null,
            updated_at: new Date().toISOString(),
          })
          .eq("chat_id", row.chat_id);
      }
    }
  }

  return false; // After cleanup, caller should re-check
}

async function tryAcquireLock(chatId: number, supabase: any): Promise<{ acquired: boolean; blockedBy?: string }> {
  // First clean up expired locks
  await isLockExpired(supabase);

  // Check if anyone else has the lock
  const { data: lockedRows } = await supabase
    .from("telegram_bot_state")
    .select("chat_id, actualizacion_en_proceso, usuario_actualizando")
    .eq("actualizacion_en_proceso", true)
    .neq("chat_id", chatId);

  if (lockedRows && lockedRows.length > 0) {
    return { acquired: false, blockedBy: lockedRows[0].usuario_actualizando || "otro usuario" };
  }

  // Acquire lock
  await supabase
    .from("telegram_bot_state")
    .update({
      actualizacion_en_proceso: true,
      usuario_actualizando: String(chatId),
      timestamp_actualizacion: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("chat_id", chatId);

  console.log(`[LOCK] Acquired by chat_id ${chatId}`);
  return { acquired: true };
}

async function releaseLock(chatId: number, supabase: any) {
  await supabase
    .from("telegram_bot_state")
    .update({
      actualizacion_en_proceso: false,
      usuario_actualizando: null,
      timestamp_actualizacion: null,
      updated_at: new Date().toISOString(),
    })
    .eq("chat_id", chatId);
  console.log(`[LOCK] Released by chat_id ${chatId}`);
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

  // Load authorized users from profiles
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

      const authorizedUser = authorizedMap.get(chatId);
      console.log(`[AUTH] chat_id: ${chatId}`);

      if (!authorizedUser) {
        console.log(`[AUTH] DENIED`);
        if (chatId) {
          await sendMessage(
            chatId,
            "⚠️ Tu Telegram no está autorizado en la plataforma SERGEN.\n\nSolicita al administrador que registre tu Chat ID en el módulo Usuarios.",
            undefined, LOVABLE_API_KEY, TELEGRAM_API_KEY
          );
        }
        continue;
      }

      console.log(`[AUTH] OK - ${authorizedUser.email}`);

      if (callbackQueryId) {
        await answerCallbackQuery(callbackQueryId, LOVABLE_API_KEY, TELEGRAM_API_KEY);
      }

      // Get or create bot state
      let { data: state } = await supabase
        .from("telegram_bot_state")
        .select("*")
        .eq("chat_id", chatId)
        .single();

      if (!state) {
        await supabase.from("telegram_bot_state").insert({
          chat_id: chatId,
          estado_conversacion: "idle",
        });
        const { data: newState } = await supabase
          .from("telegram_bot_state")
          .select("*")
          .eq("chat_id", chatId)
          .single();
        state = newState;
      }

      // Inactivity timeout — also release lock if this user had it
      if (state && state.estado_conversacion !== "idle" && isSessionExpired(state)) {
        if (state.actualizacion_en_proceso) {
          await releaseLock(chatId, supabase);
        }
        await supabase
          .from("telegram_bot_state")
          .update({
            estado_conversacion: "idle",
            riesgo_actual: null,
            rango_actual: null,
            modo_conversacion: null,
            last_interaction: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("chat_id", chatId);

        await sendMessage(
          chatId,
          "⏰ La sesión anterior fue reiniciada por inactividad.",
          undefined, LOVABLE_API_KEY, TELEGRAM_API_KEY
        );

        const { data: resetState } = await supabase
          .from("telegram_bot_state")
          .select("*")
          .eq("chat_id", chatId)
          .single();
        state = resetState;
      }

      const input = callbackData || text.trim();

      await processConversation(
        chatId, input, state, supabase, LOVABLE_API_KEY, TELEGRAM_API_KEY
      );

      totalProcessed++;
    }

    globalOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;

    await supabase
      .from("telegram_bot_state")
      .update({ update_offset: globalOffset })
      .gte("update_offset", 0);
  }

  return new Response(
    JSON.stringify({ ok: true, processed: totalProcessed, offset: globalOffset })
  );
});

// ─── State machine ─────────────────────────────────────────────
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

  const estado = state?.estado_conversacion || "idle";

  // ════════════════════════════════════════════════════════════════
  // /start or /actualizar — MANUAL conversation
  // ════════════════════════════════════════════════════════════════
  if (input === "/start" || input === "/actualizar") {
    console.log(`[FLOW] Manual conversation started`);

    if (state?.correo_enviado) {
      await updateState({ estado_conversacion: "idle" });
      await send("✅ La alerta de potencia del día ya fue enviada.");
      return;
    }

    await updateState({ estado_conversacion: "idle", modo_conversacion: "manual" });
    await send("⚡ <b>SERGEN – Control de Demanda</b>\n\n¿Desea actualizar la información de alerta?", [
      [{ text: "🔧 Actualizar información", callback_data: "actualizar" }],
    ]);
    return;
  }

  // ════════════════════════════════════════════════════════════════
  // "posponer" — only valid from idle/automatic
  // ════════════════════════════════════════════════════════════════
  if (input === "posponer" && (estado === "idle" || estado === "inicio")) {
    await updateState({ estado_conversacion: "idle" });
    await send("⏳ De acuerdo, se pospondrá. Recibirás otro recordatorio más tarde.");
    return;
  }

  // ════════════════════════════════════════════════════════════════
  // "actualizar" — acquire lock, start risk question
  // ════════════════════════════════════════════════════════════════
  if (input === "actualizar" && (estado === "idle" || estado === "inicio")) {
    if (state?.correo_enviado) {
      await updateState({ estado_conversacion: "idle" });
      await send("✅ La alerta de potencia del día ya fue enviada.");
      return;
    }

    // Try to acquire the update lock
    const lockResult = await tryAcquireLock(chatId, supabase);
    if (!lockResult.acquired) {
      await send("⚠️ Otro usuario de SERGEN está actualizando la alerta en este momento.\n\nEspere unos segundos e intente nuevamente.");
      return;
    }

    console.log(`[FLOW] Update flow started, lock acquired`);
    await updateState({ estado_conversacion: "esperando_riesgo" });
    await send("¿Existe riesgo de potencia coincidente?", [
      [
        { text: "🔴 Alto", callback_data: "riesgo_ALTO" },
        { text: "🟢 Bajo", callback_data: "riesgo_BAJO" },
      ],
    ]);
    return;
  }

  // ════════════════════════════════════════════════════════════════
  // ESPERANDO_RIESGO — STRICT: only accept riesgo_BAJO or riesgo_ALTO
  // ════════════════════════════════════════════════════════════════
  if (estado === "esperando_riesgo") {
    if (input === "riesgo_BAJO") {
      console.log(`[FLOW] Risk: BAJO`);
      await updateState({
        riesgo_actual: "BAJO",
        rango_actual: "Libre",
        estado_conversacion: "procesando_envio",
      });
      await executeGuardarYEnviar(chatId, "BAJO", "Libre", supabase, send);
      return;
    }
    if (input === "riesgo_ALTO") {
      console.log(`[FLOW] Risk: ALTO`);
      await updateState({
        riesgo_actual: "ALTO",
        estado_conversacion: "esperando_rango",
      });
      await send(
        "📝 Ingrese el rango horario para evitar coincidencia.\n\n<b>Formato requerido:</b>\n<code>2:00 pm - 4:00 pm</code>\n\nDiferencia mínima de 2 horas."
      );
      return;
    }

    // STRICT: reject any other input
    await send("Seleccione una opción utilizando los botones.", [
      [
        { text: "🔴 Alto", callback_data: "riesgo_ALTO" },
        { text: "🟢 Bajo", callback_data: "riesgo_BAJO" },
      ],
    ]);
    return;
  }

  // ════════════════════════════════════════════════════════════════
  // ESPERANDO_RANGO — STRICT: only accept valid time range
  // ════════════════════════════════════════════════════════════════
  if (estado === "esperando_rango") {
    // Reject callback buttons that aren't time ranges
    if (input.startsWith("riesgo_") || input === "actualizar" || input === "posponer") {
      await send("📝 Ingrese el rango horario.\n\n<code>2:00 pm - 4:00 pm</code>");
      return;
    }

    const validation = validateTimeRange(input);
    if (!validation.valid) {
      await send(`❌ ${validation.error}`);
      return;
    }

    console.log(`[FLOW] Time range accepted: ${input}`);
    await updateState({
      rango_actual: input,
      estado_conversacion: "procesando_envio",
    });
    await executeGuardarYEnviar(chatId, "ALTO", input, supabase, send);
    return;
  }

  // ════════════════════════════════════════════════════════════════
  // Default — show menu or status
  // ════════════════════════════════════════════════════════════════
  if (state?.correo_enviado) {
    await send("✅ La alerta de potencia del día ya fue enviada.");
  } else {
    await updateState({ estado_conversacion: "idle" });
    await send("⚡ <b>SERGEN – Control de Demanda</b>\n\nEscriba /start para comenzar.", [
      [{ text: "🔧 Actualizar información", callback_data: "actualizar" }],
    ]);
  }
}

// ─── Execute "Guardar cambios" + Send email ─────────────────────
async function executeGuardarYEnviar(
  chatId: number,
  riesgo: string,
  rango: string,
  supabase: any,
  send: (text: string, buttons?: any[][]) => Promise<void>
) {
  await send("⏳ Guardando cambios y preparando envío de correo...");

  try {
    // ── STEP 1: Save forecast_settings ("Guardar cambios") ──
    console.log(`[SAVE] riesgo=${riesgo}, rango=${rango}`);

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

    // Mark correo_enviado = false (saved but not yet sent)
    await supabase
      .from("telegram_bot_state")
      .update({
        correo_enviado: false,
        last_interaction: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("chat_id", chatId);

    console.log(`[SAVE] Done. correo_enviado=false`);

    // ── STEP 2: Get chart image ──
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

    // ── STEP 3: Get demand estimate ──
    const { data: forecastData } = await supabase
      .from("coes_forecast")
      .select("pronostico")
      .order("fecha", { ascending: false })
      .limit(1)
      .single();

    const demandaEstimada = forecastData?.pronostico
      ? Number(forecastData.pronostico).toFixed(2)
      : "—";

    // ── STEP 4: Generate email HTML ──
    const isLowRisk = riesgo === "BAJO";
    const htmlContent = generarHTMLCorreo({
      fecha: peruDateFormatted(),
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

    // ── STEP 5: Get recipients ──
    const { data: recipients } = await supabase
      .from("alert_recipients")
      .select("email");
    const emails = (recipients || []).map((r: any) => r.email);

    const { data: botState } = await supabase
      .from("telegram_bot_state")
      .select("bcc_emails")
      .eq("chat_id", chatId)
      .single();
    const bccEmails: string[] = botState?.bcc_emails || [];

    if (emails.length === 0) {
      await send("❌ No hay correos de destino configurados.\n\nAgregue correos desde el panel de administración.");
      await releaseLock(chatId, supabase);
      await supabase
        .from("telegram_bot_state")
        .update({
          estado_conversacion: "idle",
          riesgo_actual: null,
          rango_actual: null,
          last_interaction: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("chat_id", chatId);
      return;
    }

    // ── STEP 6: Send email ──
    console.log(`[EMAIL] Sending to ${emails.length} + ${bccEmails.length} BCC`);

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
      throw new Error(`Email failed: ${JSON.stringify(emailData)}`);
    }

    // ── STEP 7: Mark as sent + release lock ──
    await supabase
      .from("telegram_bot_state")
      .update({
        correo_enviado: true,
        alerta_enviada_hoy: true,
        estado_conversacion: "correo_enviado",
        riesgo_actual: null,
        rango_actual: null,
        modo_conversacion: null,
        actualizacion_en_proceso: false,
        usuario_actualizando: null,
        timestamp_actualizacion: null,
        last_interaction: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("chat_id", chatId);

    console.log(`[EMAIL] Sent. correo_enviado=true, lock released.`);

    const riesgoEmoji = riesgo === "ALTO" ? "🔴" : "🟢";
    await send(
      `✅ <b>Alerta enviada correctamente.</b>\n\n${riesgoEmoji} Riesgo: <b>${getRiskLabel(riesgo)}</b>\n🕐 Horario: <b>${isLowRisk ? "Libre" : rango}</b>\n📧 Enviada a ${emails.length} destinatario(s)\n\n<i>Los cambios fueron guardados en el sistema antes del envío.</i>`
    );
  } catch (err) {
    console.error("[ERROR] executeGuardarYEnviar:", err);

    // Release lock on error
    await releaseLock(chatId, supabase);

    await supabase
      .from("telegram_bot_state")
      .update({
        estado_conversacion: "idle",
        riesgo_actual: null,
        rango_actual: null,
        modo_conversacion: null,
        last_interaction: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("chat_id", chatId);

    await send("❌ Error al procesar la alerta. Intente nuevamente o use la interfaz web.");
  }
}
