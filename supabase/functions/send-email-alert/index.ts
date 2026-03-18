import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildEmailHtml({
  fecha,
  riskColor,
  riskLabel,
  timeRange,
  demandaEstimada,
  mensaje,
  estatus,
  hasChart,
}: {
  fecha: string;
  riskColor: string;
  riskLabel: string;
  timeRange: string;
  demandaEstimada: string;
  mensaje: string;
  estatus: string;
  hasChart: boolean;
}): string {
  // Use CID reference for inline image - Brevo uses filename as CID
  const chartRow = hasChart
    ? `<tr><td style="padding:12px 24px"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151">Pronóstico de Demanda</p><img src="cid:chart.png" alt="Gráfico de pronóstico" width="520" style="display:block;width:100%;max-width:520px;height:auto;border-radius:8px;border:1px solid #e5e7eb" /></td></tr>`
    : "";

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
  // Add cache-busting timestamp to force fresh data load
  const timestamp = Date.now();
  const captureUrl = `https://sergen-studio.lovable.app/render/pronostico?t=${timestamp}`;
  console.log("[CHART] Capturando gráfico desde:", captureUrl);

  const microlinkUrl = new URL("https://api.microlink.io/");
  microlinkUrl.searchParams.set("url", captureUrl);
  microlinkUrl.searchParams.set("screenshot", "true");
  microlinkUrl.searchParams.set("meta", "false");
  microlinkUrl.searchParams.set("waitForTimeout", "8000");
  microlinkUrl.searchParams.set("element", "#chart-container");
  microlinkUrl.searchParams.set("screenshot.type", "png");
  microlinkUrl.searchParams.set("force", "true");

  const microlinkRes = await fetch(microlinkUrl.toString());
  if (!microlinkRes.ok) {
    console.error("[CHART] Microlink HTTP error:", microlinkRes.status);
    return null;
  }

  const microlinkData = await microlinkRes.json();
  if (microlinkData.status !== "success" || !microlinkData.data?.screenshot?.url) {
    console.error("[CHART] Microlink no generó screenshot:", JSON.stringify(microlinkData));
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
  console.log("[CHART] Imagen descargada:", imageSize, "bytes");

  if (imageSize < 5000) {
    console.error("[CHART] Imagen demasiado pequeña:", imageSize, "bytes");
    return null;
  }

  const uint8 = new Uint8Array(imageBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);
  console.log("[CHART] Base64 generado, longitud:", base64.length);

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
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { error: authError } = await supabaseClient.auth.getUser();
      if (authError) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const { emails, bccEmails, fecha, riskLevel, riskLabel, riskColor, timeRange, demandaEstimada, mensaje, estatus } = body;

    console.log(`[EMAIL] Destinatarios TO: ${emails?.length}, BCC: ${bccEmails?.length ?? 0}`);

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: "No se proporcionaron correos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "BREVO_API_KEY no configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Generate chart image in real-time
    console.log("[EMAIL] Generando imagen del dashboard...");
    let chartBase64: string | null = null;
    try {
      chartBase64 = await captureChartAsBase64();
      if (chartBase64) {
        console.log("[EMAIL] ✅ Imagen generada:", chartBase64.length, "chars base64");
      } else {
        console.warn("[EMAIL] ⚠️ No se pudo generar imagen");
      }
    } catch (chartErr) {
      console.error("[EMAIL] Error generando imagen:", chartErr);
    }

    // 2. Build HTML with CID reference (not base64 inline)
    const htmlContent = buildEmailHtml({
      fecha: fecha || "",
      riskColor: riskColor || "#D4A017",
      riskLabel: riskLabel || riskLevel || "MEDIO",
      timeRange: timeRange || "",
      demandaEstimada: demandaEstimada || "—",
      mensaje: mensaje || "",
      estatus: estatus || "",
      hasChart: !!chartBase64,
    });

    // 3. Build subject with Peru date
    const peruNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    const dd = String(peruNow.getDate()).padStart(2, "0");
    const mm = String(peruNow.getMonth() + 1).padStart(2, "0");
    const yy = String(peruNow.getFullYear()).slice(-2);
    const subject = `⚡ Pronóstico de potencia | ${dd}/${mm}/${yy} ⚡`;

    // 4. Build Brevo payload with CID attachment
    const emailPayload: Record<string, unknown> = {
      sender: { name: "SERGEN", email: "info@sergen.pe" },
      to: emails.map((email: string) => ({ email })),
      subject,
      htmlContent,
    };

    // Add chart as inline attachment (CID = filename)
    if (chartBase64) {
      emailPayload.attachment = [
        {
          content: chartBase64,
          name: "chart.png",
        },
      ];
      console.log("[EMAIL] ✅ Imagen adjunta como CID attachment (chart.png)");
    }

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

    return new Response(JSON.stringify({ success, data, hasChart: !!chartBase64 }), {
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
