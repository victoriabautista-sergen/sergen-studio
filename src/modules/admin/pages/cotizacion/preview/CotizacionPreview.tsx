import { useCotizacionContext } from "../context/CotizacionContext";
import { BRAND_CONFIG } from "../types";
import React, { useRef, useCallback } from "react";
import { generateCotizacionPDF } from "../utils/pdfExport";
import logoSergen from "@/assets/sergen-logo.png";
import logoIncoser from "@/assets/logo_incoser.png";

let _triggerExport: (() => Promise<void>) | null = null;

const fmt = (n: number) => n.toFixed(2);

const CotizacionPreviewContent = () => {
  const { data } = useCotizacionContext();
  const isIncoser = data.marca === "incoser";
  const logo = isIncoser ? logoIncoser : logoSergen;
  const brandName = isIncoser ? "INCOSER" : "SERGEN";
  const brandConfig = BRAND_CONFIG[data.marca];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "8px", color: "#333", lineHeight: 1.4 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <img src={logo} alt={brandName} style={{ height: isIncoser ? "60px" : "48px", objectFit: "contain" }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#E8792B", marginBottom: "4px" }}>COTIZACIÓN</div>
          <table style={{ fontSize: "7px", marginLeft: "auto" }}>
            <tbody>
              <tr><td style={{ paddingRight: "8px", color: "#666" }}>Fecha</td><td style={{ fontWeight: 500 }}>{data.fecha}</td></tr>
              <tr><td style={{ paddingRight: "8px", color: "#666" }}>Cotización</td><td style={{ fontWeight: 500 }}>{data.numero_cotizacion || "—"}</td></tr>
              <tr><td style={{ paddingRight: "8px", color: "#666" }}>Validez</td><td style={{ fontWeight: 500 }}>{data.validez || "—"}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Separator */}
      <div style={{ borderBottom: "2px solid #E8792B", marginBottom: "8px" }} />

      {/* Company info */}
      <table style={{ fontSize: "7px", marginBottom: "10px" }}>
        <tbody>
          <tr><td style={{ paddingRight: "8px", color: "#666", width: "55px" }}>Dirección</td><td><strong>:</strong> {data.direccion}</td></tr>
          <tr><td style={{ color: "#666" }}>Asesor</td><td><strong>:</strong> {data.asesor}</td></tr>
          <tr><td style={{ color: "#666" }}>Teléfono</td><td><strong>:</strong> {data.telefono}</td></tr>
          <tr><td style={{ color: "#666" }}>Correo</td><td><strong>:</strong> {data.correo}</td></tr>
        </tbody>
      </table>

      {/* Client */}
      <div style={{ backgroundColor: "#E8792B", color: "#fff", fontWeight: 700, fontSize: "8px", padding: "2px 6px", marginBottom: "4px" }}>
        CLIENTE
      </div>
      <table style={{ fontSize: "7px", marginBottom: "12px" }}>
        <tbody>
          <tr><td style={{ paddingRight: "8px", color: "#666", width: "55px" }}>Empresa</td><td><strong>:</strong> {data.empresa_cliente}</td></tr>
          <tr><td style={{ color: "#666" }}>Contacto</td><td><strong>:</strong> {data.contacto_cliente}</td></tr>
          <tr><td style={{ color: "#666" }}>Ubicación</td><td><strong>:</strong> {data.ubicacion_cliente}</td></tr>
        </tbody>
      </table>

      {/* Items table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7px", marginBottom: "4px" }}>
        <thead>
          <tr style={{ backgroundColor: "#E8792B", color: "#fff" }}>
            <th style={{ padding: "3px 4px", textAlign: "left", fontWeight: 600 }}>Descripción</th>
            <th style={{ padding: "3px 4px", textAlign: "center", fontWeight: 600, width: "50px" }}>Código</th>
            <th style={{ padding: "3px 4px", textAlign: "center", fontWeight: 600, width: "60px" }}>Precio Unit</th>
            <th style={{ padding: "3px 4px", textAlign: "center", fontWeight: 600, width: "30px" }}>Cant.</th>
            <th style={{ padding: "3px 4px", textAlign: "center", fontWeight: 600, width: "55px" }}>P.venta</th>
            <th style={{ padding: "3px 4px", textAlign: "center", fontWeight: 600, width: "55px" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #e5e5e5" }}>
              <td style={{ padding: "4px", verticalAlign: "top" }}>{item.descripcion}</td>
              <td style={{ padding: "4px", textAlign: "center" }}>{item.codigo}</td>
              <td style={{ padding: "4px", textAlign: "right" }}>S/ {fmt(item.precio_unitario)}</td>
              <td style={{ padding: "4px", textAlign: "center" }}>{item.cantidad}</td>
              <td style={{ padding: "4px", textAlign: "right" }}>S/ {fmt(item.precio_venta)}</td>
              <td style={{ padding: "4px", textAlign: "right" }}>S/ {fmt(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + Terms side by side */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {/* Terms */}
        <div style={{ flex: 1, border: "1px solid #E8792B", padding: "6px", fontSize: "7px" }}>
          <div style={{ backgroundColor: "#E8792B", color: "#fff", fontWeight: 700, padding: "2px 4px", marginBottom: "4px", fontSize: "7px" }}>
            TÉRMINOS Y CONDICIONES
          </div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{data.terminos}</div>
          <div style={{ marginTop: "6px" }}>
            3. N° Cta. Corriente soles BCP a nombre de {brandConfig.razon_social}:
          </div>
          <div style={{ marginLeft: "12px", marginTop: "2px" }}>
            {data.cuenta_bancaria}
          </div>
          <div style={{ marginLeft: "12px" }}>
            {data.cci}
          </div>
        </div>

        {/* Totals */}
        <div style={{ width: "160px", fontSize: "7px" }}>
          <table style={{ width: "100%" }}>
            <tbody>
              <tr><td>Subtotal</td><td style={{ textAlign: "right" }}>S/ {fmt(data.subtotal)}</td></tr>
              <tr><td>Imponible</td><td style={{ textAlign: "right" }}>S/ {fmt(data.imponible)}</td></tr>
              <tr><td>Impuesto %</td><td style={{ textAlign: "right" }}>{data.impuesto_pct}%</td></tr>
              <tr><td>Total Impuesto</td><td style={{ textAlign: "right" }}>S/ {fmt(data.total_impuesto)}</td></tr>
              <tr style={{ borderTop: "1px solid #ccc" }}><td>Otros</td><td style={{ textAlign: "right" }}>S/ {data.otros > 0 ? fmt(data.otros) : "-"}</td></tr>
              <tr style={{ borderTop: "2px solid #333", fontWeight: 700 }}><td>TOTAL</td><td style={{ textAlign: "right" }}>S/ {fmt(data.total)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature */}
      <div style={{ textAlign: "center", marginTop: "24px", fontSize: "7px" }}>
        <div style={{ borderTop: "1px solid #333", width: "200px", margin: "0 auto", paddingTop: "4px" }}>
          Gerente General de {data.empresa_cliente || "_______________"}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "16px", fontSize: "7px", color: "#666" }}>
        Si usted tiene alguna pregunta sobre esta cotización, por favor, póngase en contacto con nosotros
      </div>
      <div style={{ textAlign: "center", marginTop: "4px", fontSize: "9px", fontStyle: "italic", fontWeight: 600 }}>
        ¡Gracias por su preferencia!
      </div>
    </div>
  );
};

const CotizacionPreview = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { data } = useCotizacionContext();
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

  const handleExport = useCallback(async () => {
    if (!containerRef.current) return;
    const filename = `Cotizacion_${data.empresa_cliente || "doc"}_${data.numero_cotizacion || "sin_numero"}.pdf`.replace(/\s+/g, "_");
    await generateCotizacionPDF(containerRef.current, filename);
  }, [data, containerRef]);

  _triggerExport = handleExport;

  return (
    <div
      ref={containerRef}
      data-pdf-page="1"
      style={{
        width: "595px",
        height: "842px",
        backgroundColor: "#ffffff",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ padding: "32px 40px" }}>
        <CotizacionPreviewContent />
      </div>
    </div>
  );
});

CotizacionPreview.displayName = "CotizacionPreview";

export const triggerCotizacionExport = () => _triggerExport?.();

export default CotizacionPreview;
