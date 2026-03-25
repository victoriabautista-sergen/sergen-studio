import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHART_BUCKET = "chart-images";
const CHART_FILE = "email_alert_chart.png";

function buildEmailHtml({
  fecha,
  riskColor,
  riskLabel,
  timeRange,
  demandaEstimada,
  mensaje,
  estatus,
  chartPublicUrl,
}: {
  fecha: string;
  riskColor: string;
  riskLabel: string;
  timeRange: string;
  demandaEstimada: string;
  mensaje: string;
  estatus: string;
  chartPublicUrl: string;
}): string {
  // Use public URL for maximum email client compatibility (Gmail, Outlook, etc.)
  const chartRow = `<tr><td style="padding:12px 0 0"><p style="margin:0 0 8px;padding:0 24px;font-size:13px;font-weight:700;color:#374151">Pronóstico de Demanda</p><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="padding:0"><div style="width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#ffffff"><img src="${chartPublicUrl}" alt="Gráfico de pronóstico" width="600" style="display:block;width:100%;height:auto;border:0;outline:none;text-decoration:none" /></div></td></tr></table></td></tr>`;

  return `<!DOCTYPE html>
<html lang="es" xml:lang="es" xmlns="http://www.w3.org/1999/xhtml" dir="ltr">
<head><meta charset="UTF-8"><meta http-equiv="Content-Language" content="es"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Pronóstico de potencia</title></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif">
<div style="display:none;font-size:1px;color:#f4f4f7;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">Alerta diaria de potencia&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7">
<tr><td align="center" style="padding:32px 10px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
<tr><td align="center" style="padding:40px 24px 12px">
<table cellpadding="0" cellspacing="0"><tr><td align="center" width="56" height="56" style="width:56px;height:56px;border-radius:50%;border:4px solid #60a5fa;text-align:center;font-size:28px;line-height:56px">&#9889;</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:8px 24px 6px"><h1 style="margin:0;font-size:20px;color:#111827;font-weight:700">Pronóstico de potencia máxima</h1></td></tr>
<tr><td align="center" style="padding:4px 24px 20px"><p style="margin:0;font-size:16px;color:#111827;font-weight:700">${fecha}</p></td></tr>
<tr><td align="center" style="padding:0 24px 24px">
<table cellpadding="0" cellspacing="0"><tr><td style="background:${riskColor};color:#fff;font-size:13px;font-weight:700;padding:8px 28px;border-radius:20px;letter-spacing:.5px">RIESGO ${riskLabel.toUpperCase()}</td></tr></table>
</td></tr>
${chartRow}
<tr><td style="padding:24px 24px 20px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td width="50%" style="font-size:13px;font-weight:700;color:#374151;padding-bottom:12px;border-bottom:2px solid #d1d5db">Rango horario</td><td width="50%" style="font-size:13px;font-weight:700;color:#374151;padding-bottom:12px;border-bottom:2px solid #d1d5db;text-align:right">Demanda estimada</td></tr>
<tr><td style="font-size:14px;color:#4b5563;padding:14px 0;border-bottom:1px solid #e5e7eb">${timeRange}</td><td style="font-size:14px;color:#4b5563;padding:14px 0;border-bottom:1px solid #e5e7eb;text-align:right">${demandaEstimada} MW</td></tr>
</table>
</td></tr>
<tr><td style="padding:12px 24px 28px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td valign="top" width="58%" style="padding-right:16px"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151">Recuerde:</p><p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6">${mensaje}</p></td><td valign="top" width="42%" style="padding-left:16px"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151">Estatus:</p><p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6">${estatus}</p></td></tr>
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

async function captureChartAsBase64(): Promise<string | null> {
  const captureUrl = `https://sergen-studio.lovable.app/render/pronostico?t=${Date.now()}&nocache=${Math.random()}`;
  console.log("[CHART] URL de captura:", captureUrl);

  const microlinkUrl = new URL("https://api.microlink.io/");
  microlinkUrl.searchParams.set("url", captureUrl);
  microlinkUrl.searchParams.set("screenshot", "true");
  microlinkUrl.searchParams.set("meta", "false");
  microlinkUrl.searchParams.set("waitForSelector", "#chart-ready");
  microlinkUrl.searchParams.set("waitForTimeout", "15000");
  microlinkUrl.searchParams.set("element", "#chart-container");
  microlinkUrl.searchParams.set("viewport.width", "800");
  microlinkUrl.searchParams.set("viewport.height", "420");
  microlinkUrl.searchParams.set("screenshot.width", "800");
  microlinkUrl.searchParams.set("screenshot.height", "420");
  microlinkUrl.searchParams.set("screenshot.type", "png");
  microlinkUrl.searchParams.set("force", "true");
  microlinkUrl.searchParams.set("cache", "false");

  const microlinkRes = await fetch(microlinkUrl.toString());
  if (!microlinkRes.ok) {
    console.error("[CHART] Microlink HTTP error:", microlinkRes.status);
    return null;
  }

  const microlinkData = await microlinkRes.json();
  if (microlinkData.status !== "success" || !microlinkData.data?.screenshot?.url) {
    console.error("[CHART] Microlink no generó screenshot:", JSON.stringify(microlinkData.status));
    return null;
  }

  const screenshotUrl = microlinkData.data.screenshot.url;
  console.log("[CHART] Screenshot URL:", screenshotUrl);

  const imageRes = await fetch(screenshotUrl);
  if (!imageRes.ok) {
    console.error("[CHART] Error descargando screenshot:", imageRes.status);
    return null;
  }

  const imageBuffer = await imageRes.arrayBuffer();
  const imageSize = imageBuffer.byteLength;
  console.log("[CHART] Tamaño de imagen:", imageSize, "bytes");

  if (imageSize < 5000) {
    console.error("[CHART] Imagen demasiado pequeña (probablemente vacía):", imageSize, "bytes");
    return null;
  }

  const uint8 = new Uint8Array(imageBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);
  console.log("[CHART] Imagen convertida a base64, longitud:", base64.length);

  return base64;
}

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

    if (!isServiceRole) {
      const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
        global: { headers: { Authorization: authHeader } },
      });
      const { error: authError } = await supabaseClient.auth.getUser();
      if (authError) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const { emails, bccEmails, fecha, riskLevel, riskLabel, riskColor, timeRange, demandaEstimada: demandaFromRequest, mensaje, estatus, htmlContent: prebuiltHtml, skipSentCheck, allRecipients } =
      body;

    console.log(`[EMAIL] Destinatarios TO: ${emails?.length}, BCC: ${bccEmails?.length ?? 0}`);
    console.log(`[EMAIL] Flujo: ${prebuiltHtml ? "Telegram (HTML pre-construido)" : "Web (construir HTML)"}`);

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: "No se proporcionaron correos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── CHECK: Alert already sent today? ──
    if (!skipSentCheck) {
      const supabaseCheck = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: settings } = await supabaseCheck
        .from("forecast_settings")
        .select("alert_sent_at")
        .order("last_update", { ascending: false })
        .limit(1)
        .single();

      if (settings?.alert_sent_at) {
        const sentDate = new Date(settings.alert_sent_at);
        const peruNowDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
        const sentDay = `${sentDate.getFullYear()}-${sentDate.getMonth()}-${sentDate.getDate()}`;
        const todayDay = `${peruNowDate.getFullYear()}-${peruNowDate.getMonth()}-${peruNowDate.getDate()}`;

        if (sentDay === todayDay) {
          console.log(`[EMAIL] ❌ BLOQUEADO: Alerta ya enviada hoy a las ${settings.alert_sent_at}`);
          return new Response(JSON.stringify({
            success: false,
            error: "La alerta de hoy ya fue enviada. No se puede enviar nuevamente.",
            alreadySent: true,
            sentAt: settings.alert_sent_at,
          }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let finalHtmlContent: string;

    if (prebuiltHtml) {
      // ── Flujo Telegram: usar HTML pre-construido (ya tiene chart, riesgo y rango correctos) ──
      console.log(`[EMAIL] Usando HTML pre-construido desde Telegram (${prebuiltHtml.length} chars)`);
      finalHtmlContent = prebuiltHtml;
    } else {
      // ── Flujo Web (Admin Panel): construir HTML internamente ──

      // Resolver demandaEstimada: prioridad al request, fallback a coes_forecast
      let demandaEstimada = demandaFromRequest;
      let demandaSource = "request";

      if (!demandaEstimada || demandaEstimada === "—" || demandaEstimada === "") {
        console.log("[EMAIL] demandaEstimada no viene en el request, consultando coes_forecast...");
        try {
          const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
          );

          // Replicar la misma lógica que ForecastChart + useForecastData:
          // Obtener datos de los últimos 2 días y buscar el máximo reprogramado en hora punta (18:00-22:59 UTC)
          const now = new Date();
          const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
          const startDate = new Date(Date.UTC(
            twoDaysAgo.getUTCFullYear(), twoDaysAgo.getUTCMonth(), twoDaysAgo.getUTCDate(), 0, 0, 0
          )).toISOString();
          const endDate = new Date(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59
          )).toISOString();

          console.log(`[EMAIL] Consultando coes_forecast desde ${startDate} hasta ${endDate}`);

          const { data: forecastData, error: forecastError } = await supabaseAdmin
            .from("coes_forecast")
            .select("fecha, reprogramado")
            .gte("fecha", startDate)
            .lte("fecha", endDate)
            .order("fecha", { ascending: true });

          if (forecastError) {
            console.error("[EMAIL] Error consultando coes_forecast:", forecastError.message);
          } else if (forecastData && forecastData.length > 0) {
            console.log(`[EMAIL] Registros obtenidos: ${forecastData.length}`);

            // Filtrar hora punta: horas 18-22 UTC (PEAK_START=18, PEAK_END=23, < 23)
            // Esto replica exactamente la lógica de ForecastChart líneas 120-125
            let maxValue = 0;
            let maxFecha = "";
            forecastData.forEach((record: any) => {
              if (record.reprogramado && record.fecha) {
                const hora = new Date(record.fecha).getUTCHours();
                if (hora >= 18 && hora < 23 && record.reprogramado > maxValue) {
                  maxValue = record.reprogramado;
                  maxFecha = record.fecha;
                }
              }
            });

            if (maxValue > 0) {
              demandaEstimada = maxValue.toFixed(2);
              demandaSource = `coes_forecast pico hora punta (${maxFecha})`;
              console.log(`[EMAIL] ✅ Demanda estimada: ${demandaEstimada} MW en ${maxFecha}`);
            } else {
              console.error("[EMAIL] ⚠️ No se encontraron datos en hora punta (18:00-23:00) en los últimos 2 días");
            }
          } else {
            console.error("[EMAIL] ⚠️ No hay registros en coes_forecast para los últimos 2 días");
          }
        } catch (dbErr) {
          console.error("[EMAIL] Error al consultar demanda estimada:", dbErr);
        }
      }

      console.log(`[EMAIL] Demanda estimada final: ${demandaEstimada ?? "—"} MW (fuente: ${demandaSource})`);

      // Generar imagen del gráfico en tiempo real
      console.log("[EMAIL] Generando imagen del dashboard en tiempo real...");
      let chartBase64: string | null = null;
      try {
        chartBase64 = await captureChartAsBase64();
      } catch (chartErr) {
        console.error("[EMAIL] Error generando imagen:", chartErr);
      }

      if (!chartBase64) {
        console.error("[EMAIL] ❌ ENVÍO BLOQUEADO: No hay imagen válida del gráfico.");
        return new Response(JSON.stringify({
          success: false,
          error: "No hay datos disponibles para generar el gráfico. El correo no fue enviado.",
          blocked: true,
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("[EMAIL] ✅ Imagen válida generada, subiendo a storage...");

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const chartBytes = Uint8Array.from(atob(chartBase64), c => c.charCodeAt(0));
      const { error: uploadError } = await supabase.storage
        .from(CHART_BUCKET)
        .upload(CHART_FILE, chartBytes, { contentType: "image/png", upsert: true });

      if (uploadError) {
        console.error("[EMAIL] Error subiendo imagen a storage:", uploadError.message);
      }

      const { data: urlData } = supabase.storage.from(CHART_BUCKET).getPublicUrl(CHART_FILE);
      const chartPublicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      console.log("[EMAIL] Chart public URL:", chartPublicUrl);

      finalHtmlContent = buildEmailHtml({
        fecha: fecha || "",
        riskColor: riskColor || "#D4A017",
        riskLabel: riskLabel || riskLevel || "MEDIO",
        timeRange: timeRange || "",
        demandaEstimada: demandaEstimada || "—",
        mensaje: mensaje || "",
        estatus: estatus || "",
        chartPublicUrl,
      });
    }

    // Enviar correo via Brevo
    const peruNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    const dd = String(peruNow.getDate()).padStart(2, "0");
    const mm = String(peruNow.getMonth() + 1).padStart(2, "0");
    const yy = String(peruNow.getFullYear()).slice(-2);
    const subject = `⚡ Pronóstico de potencia | ${dd}/${mm}/${yy} ⚡`;

    const emailPayload: Record<string, unknown> = {
      sender: { name: "SERGEN", email: "info@sergen.pe" },
      to: emails.map((email: string) => ({ email })),
      subject,
      htmlContent: finalHtmlContent,
    };

    if (bccEmails && Array.isArray(bccEmails) && bccEmails.length > 0) {
      emailPayload.bcc = bccEmails.map((email: string) => ({ email }));
    }

    console.log(`[BREVO] Enviando a ${emails.length} TO + ${bccEmails?.length ?? 0} BCC`);

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await res.json();
    const success = res.status >= 200 && res.status < 300;

    console.log(`[BREVO] Response: ${res.status}, success: ${success}`);
    if (!success) {
      console.error(`[BREVO] Error:`, JSON.stringify(data));
    }

    // ── Mark alert as sent today ──
    if (success) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: latestSettings } = await supabaseAdmin
        .from("forecast_settings")
        .select("id")
        .order("last_update", { ascending: false })
        .limit(1)
        .single();

      if (latestSettings) {
        await supabaseAdmin
          .from("forecast_settings")
          .update({ alert_sent_at: new Date().toISOString() })
          .eq("id", latestSettings.id);
        console.log(`[EMAIL] ✅ alert_sent_at marcado para hoy`);
      }

      // Also update all telegram_bot_state rows
      await supabaseAdmin
        .from("telegram_bot_state")
        .update({
          correo_enviado: true,
          alerta_enviada_hoy: true,
          updated_at: new Date().toISOString(),
        })
        .gte("chat_id", -999999999999);
      console.log(`[EMAIL] ✅ telegram_bot_state actualizado: correo_enviado=true`);
    }

    return new Response(JSON.stringify({ success, data, hasChart: true }), {
      status: success ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[FATAL] Error en send-email-alert:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
