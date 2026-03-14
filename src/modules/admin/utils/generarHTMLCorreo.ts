export interface EmailTemplateData {
  fecha: string;
  riskColor: string;
  riskLabel: string;
  timeRange: string;
  demandaEstimada: string;
  mensaje: string;
  estatus: string;
  graficoBase64?: string;
}

export function generarHTMLCorreo(d: EmailTemplateData): string {
  const chartSection = d.graficoBase64
    ? `<tr>
        <td style="padding:16px 24px 8px;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;">Pronóstico de Demanda</p>
          <img src="${d.graficoBase64}" alt="Gráfico de pronóstico" width="552" style="display:block;width:100%;max-width:552px;height:auto;border-radius:8px;border:1px solid #e5e7eb;" />
        </td>
      </tr>`
    : "";

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

  <!-- Icono de rayo -->
  <tr>
    <td align="center" style="padding:36px 24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" valign="middle" width="64" height="64" style="width:64px;height:64px;border-radius:50%;border:4px solid #60a5fa;text-align:center;vertical-align:middle;font-size:32px;line-height:64px;">
            &#9889;
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Título -->
  <tr>
    <td align="center" style="padding:0 24px 8px;">
      <h1 style="margin:0;font-size:22px;color:#111827;font-weight:700;">Pronóstico de potencia máxima</h1>
    </td>
  </tr>

  <!-- Fecha -->
  <tr>
    <td align="center" style="padding:0 24px 24px;">
      <p style="margin:0;font-size:17px;color:#111827;font-weight:700;text-transform:capitalize;">${d.fecha}</p>
    </td>
  </tr>

  <!-- Indicador de riesgo -->
  <tr>
    <td align="center" style="padding:0 24px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="background-color:${d.riskColor};color:#ffffff;font-size:14px;font-weight:700;padding:8px 28px;border-radius:20px;letter-spacing:0.5px;">
            RIESGO ${d.riskLabel.toUpperCase()}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Separador -->
  <tr>
    <td style="padding:0 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="border-top:1px solid #e5e7eb;font-size:1px;line-height:1px;">&nbsp;</td></tr>
      </table>
    </td>
  </tr>

  <!-- Gráfico -->
  ${chartSection}

  <!-- Tabla: Rango horario + Demanda estimada -->
  <tr>
    <td style="padding:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="font-size:13px;font-weight:700;color:#374151;padding-bottom:12px;border-bottom:2px solid #d1d5db;">Rango horario</td>
          <td width="50%" style="font-size:13px;font-weight:700;color:#374151;padding-bottom:12px;border-bottom:2px solid #d1d5db;text-align:right;">Demanda estimada</td>
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

  <!-- Banner USUARIO ACTIVO -->
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
