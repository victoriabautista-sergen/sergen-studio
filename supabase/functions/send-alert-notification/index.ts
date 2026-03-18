import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildEmailHtml({
  riskLevel,
  timeRange,
  demandaEstimada,
  mensaje,
  estatus,
  fecha,
}: {
  riskLevel: string;
  timeRange: string;
  demandaEstimada: string;
  mensaje: string;
  estatus: string;
  fecha: string;
}): string {
  const isLowRisk = riskLevel === "BAJO";
  const rangoText = isLowRisk ? "Uso libre de equipos" : timeRange;
  const accentColor = "#E8860C";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pronóstico de potencia máxima</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">Alerta diaria de potencia coincidente&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 20px 20px;">
              <div style="width:64px;height:64px;border-radius:50%;border:4px solid #5BA3C9;display:inline-flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;color:#5BA3C9;">✓</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 20px 10px;">
              <h1 style="margin:0;font-size:24px;font-weight:bold;color:#1a1a1a;">Pronóstico de potencia máxima</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 20px 30px;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:#1a1a1a;">${fecha}</p>
            </td>
          </tr>

          <!-- Rango horario + Demanda -->
          <tr>
            <td style="padding:0 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:2px solid #e5e5e5;">
                    <strong style="font-size:14px;color:#333;">Rango horario</strong>
                  </td>
                  <td align="right" style="padding:10px 0;border-bottom:2px solid #e5e5e5;">
                    <strong style="font-size:14px;color:#333;">Demanda estimada</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
                    <span style="font-size:14px;color:#555;">${rangoText}</span>
                  </td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
                    <span style="font-size:14px;color:#555;">${demandaEstimada || "—"}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Recuerde + Estatus -->
          <tr>
            <td style="padding:20px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top" style="padding-right:15px;">
                    <p style="margin:0 0 5px;font-size:14px;font-weight:bold;color:#333;">Recuerde:</p>
                    <p style="margin:0;font-size:13px;color:#666;">${mensaje}</p>
                  </td>
                  <td width="50%" valign="top" style="padding-left:15px;">
                    <p style="margin:0 0 5px;font-size:14px;font-weight:bold;color:#333;">Estatus:</p>
                    <p style="margin:0;font-size:13px;color:#666;">${estatus}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer banner -->
          <tr>
            <td align="center" style="background-color:${accentColor};padding:16px 20px;">
              <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:2px;">USUARIO ACTIVO</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error(
        "RESEND_API_KEY no está configurada. Configura la clave API de Resend para enviar correos."
      );
    }

    const { to, riskLevel, timeRange, demandaEstimada, mensaje, estatus, fecha } =
      await req.json();

    // Support both single email string and array of emails
    const recipients: string[] = Array.isArray(to) ? to : [to];
    if (recipients.length === 0 || !recipients[0]) {
      throw new Error("El campo 'to' (correo de destino) es requerido.");
    }

    const html = buildEmailHtml({
      riskLevel,
      timeRange,
      demandaEstimada,
      mensaje,
      estatus,
      fecha,
    });

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SERGEN <alertas@sergen-studio.lovable.app>",
        to: recipients,
        subject: `Pronóstico de potencia máxima - ${fecha}`,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(
        `Error de Resend [${resendResponse.status}]: ${JSON.stringify(resendData)}`
      );
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending alert notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
