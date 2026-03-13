import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function buildEmailHtml(d: {
  fecha: string;
  riskLevel: string;
  riskColor: string;
  riskLabel: string;
  timeRange: string;
  demandaEstimada: string;
  mensaje: string;
  estatus: string;
}) {
  const isLow = d.riskLevel === "BAJO";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pronóstico de potencia máxima</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
<tr><td align="center" style="padding:30px 10px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Logo / Header -->
  <tr>
    <td align="center" style="padding:36px 24px 12px;">
      <div style="width:64px;height:64px;border-radius:50%;border:4px solid #60a5fa;display:inline-flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">⚡</span>
      </div>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:0 24px 8px;">
      <h1 style="margin:0;font-size:22px;color:#111827;font-weight:700;">Pronóstico de potencia máxima</h1>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:0 24px 24px;">
      <p style="margin:0;font-size:17px;color:#111827;font-weight:700;text-transform:capitalize;">${d.fecha}</p>
    </td>
  </tr>

  <!-- Risk Badge -->
  <tr>
    <td align="center" style="padding:0 24px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color:${d.riskColor};color:#ffffff;font-size:14px;font-weight:700;padding:8px 28px;border-radius:20px;letter-spacing:0.5px;">
            RIESGO ${d.riskLabel.toUpperCase()}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Divider -->
  <tr><td style="padding:0 24px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"></td></tr>

  <!-- Data Table -->
  <tr>
    <td style="padding:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;font-weight:700;color:#374151;padding-bottom:12px;border-bottom:2px solid #d1d5db;" width="50%">Rango horario</td>
          <td style="font-size:13px;font-weight:700;color:#374151;padding-bottom:12px;border-bottom:2px solid #d1d5db;text-align:right;" width="50%">Demanda estimada</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#4b5563;padding:16px 0;border-bottom:1px solid #e5e7eb;">${d.timeRange}</td>
          <td style="font-size:14px;color:#4b5563;padding:16px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${d.demandaEstimada} MW</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Recuerde + Estatus -->
  <tr>
    <td style="padding:8px 24px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="top" width="58%" style="padding-right:20px;border-right:1px solid #e5e7eb;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151;">Recuerde:</p>
            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">${d.mensaje}</p>
          </td>
          <td valign="top" width="42%" style="padding-left:20px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151;">Estatus:</p>
            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">${d.estatus}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer Banner -->
  <tr>
    <td align="center" style="background-color:#e8920d;padding:20px 24px;">
      <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;letter-spacing:2px;">USUARIO ACTIVO</p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td align="center" style="padding:20px 24px;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Este correo fue enviado por <strong style="color:#374151;">SERGEN</strong></p>
      <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">info@sergen.pe</p>
    </td>
  </tr>

</table>

</td></tr>
</table>
</body>
</html>`;
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { emails, templateData } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: "No se proporcionaron correos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const htmlContent = buildEmailHtml(templateData);
    const results = [];

    for (const email of emails) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "SERGEN", email: "info@sergen.pe" },
          to: [{ email }],
          subject: "⚡ Pronóstico de potencia máxima",
          htmlContent,
        }),
      });

      const data = await res.json();
      results.push({ email, status: res.status, data });
    }

    const allOk = results.every((r) => r.status >= 200 && r.status < 300);

    return new Response(JSON.stringify({ success: allOk, results }), {
      status: allOk ? 200 : 207,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error en send-email-alert:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
