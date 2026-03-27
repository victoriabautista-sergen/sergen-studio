import { useCotizacionContext } from "../context/CotizacionContext";
import { BRAND_CONFIG } from "../types";
import React, { useRef } from "react";
import logoSergen from "@/assets/sergen-logo.png";
import logoIncoser from "@/assets/logo_incoser.png";
import logoCvc from "@/assets/partners/cvcenergia.png";
import logoKallpa from "@/assets/partners/kallpa.jpg";
import logoFenix from "@/assets/partners/fenix.jpg";
import logoOrazul from "@/assets/partners/orazul.jpeg";
import logoLaVirgen from "@/assets/partners/lavirgen.jpeg";
import logoElectroDunas from "@/assets/partners/electrodunas.png";

const fmt = (n: number) => n.toFixed(2);
const ORANGE = "hsl(28 91% 54%)";
const TABLE_OUTER_BORDER = "0.5px solid hsl(28 91% 54% / 0.55)";
const TABLE_INNER_BORDER = "0.5px solid hsl(28 91% 54% / 0.22)";
const HEADER_DIVIDER = "0.5px solid hsl(0 0% 100% / 0.45)";
const OB = `0.2px solid ${ORANGE}`;

const CotizacionPreviewContent = () => {
  const { data } = useCotizacionContext();
  const isIncoser = data.marca === "incoser";
  const logo = isIncoser ? logoIncoser : logoSergen;
  const brandName = isIncoser ? "INCOSER" : "SERGEN";
  const brandConfig = BRAND_CONFIG[data.marca];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "8px", color: "#333", lineHeight: 1.4 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <img src={logo} alt={brandName} style={{ height: isIncoser ? "64px" : "48px", objectFit: "contain" }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#E8792B", marginBottom: "4px", marginRight: "20px" }}>COTIZACIÓN</div>
          <table style={{ fontSize: "7px", marginLeft: "auto" }}>
            <tbody>
              <tr><td style={{ paddingRight: "4px", color: "#666", textAlign: "left" }}>Fecha :</td><td style={{ fontWeight: 500, textAlign: "left", paddingLeft: "6px" }}>{data.fecha}</td></tr>
              <tr><td style={{ paddingRight: "4px", color: "#666", textAlign: "left" }}>Cotización :</td><td style={{ fontWeight: 500, textAlign: "left", paddingLeft: "6px" }}>{data.numero_cotizacion || "—"}</td></tr>
              <tr><td style={{ paddingRight: "4px", color: "#666", textAlign: "left" }}>Validez :</td><td style={{ fontWeight: 500, textAlign: "left", paddingLeft: "6px" }}>{data.validez || "—"}</td></tr>
            </tbody>
          </table>
        </div>
      </div>


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
      <div
        style={{
          backgroundColor: ORANGE,
          color: "#fff",
          fontWeight: 700,
          fontSize: "8px",
          marginBottom: "6px",
          display: "flex",
          alignItems: "center",
          height: "16px",
          width: "100%",
          boxSizing: "border-box",
          paddingLeft: "6px",
        }}
      >
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
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "7px", marginBottom: "4px", borderTop: TABLE_OUTER_BORDER, borderBottom: TABLE_OUTER_BORDER, borderLeft: TABLE_INNER_BORDER, borderRight: TABLE_INNER_BORDER }}>
        <thead>
          <tr style={{ backgroundColor: ORANGE, color: "#fff", height: "16px" }}>
            <th style={{ padding: "0 4px 0 6px", textAlign: "left", fontWeight: 600, verticalAlign: "middle", lineHeight: 1, borderRight: HEADER_DIVIDER }}>Descripción</th>
            <th style={{ padding: "0 4px", textAlign: "center", fontWeight: 600, width: "50px", verticalAlign: "middle", lineHeight: 1, borderRight: HEADER_DIVIDER }}>Código</th>
            <th style={{ padding: "0 4px", textAlign: "center", fontWeight: 600, width: "60px", verticalAlign: "middle", lineHeight: 1, borderRight: HEADER_DIVIDER }}>Precio Unit</th>
            <th style={{ padding: "0 4px", textAlign: "center", fontWeight: 600, width: "30px", verticalAlign: "middle", lineHeight: 1, borderRight: HEADER_DIVIDER }}>Cant.</th>
            <th style={{ padding: "0 4px", textAlign: "center", fontWeight: 600, width: "55px", verticalAlign: "middle", lineHeight: 1, borderRight: HEADER_DIVIDER }}>P.venta</th>
            <th style={{ padding: "0 4px", textAlign: "center", fontWeight: 600, width: "55px", verticalAlign: "middle", lineHeight: 1 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: "4px 6px", verticalAlign: "top", whiteSpace: "pre-wrap", borderRight: TABLE_INNER_BORDER, borderBottom: TABLE_INNER_BORDER }}>{item.descripcion}</td>
              <td style={{ padding: "4px", textAlign: "center", verticalAlign: "middle", borderRight: TABLE_INNER_BORDER, borderBottom: TABLE_INNER_BORDER }}>{item.codigo}</td>
              <td style={{ padding: "4px", textAlign: "right", verticalAlign: "middle", borderRight: TABLE_INNER_BORDER, borderBottom: TABLE_INNER_BORDER }}>S/ {fmt(item.precio_unitario)}</td>
              <td style={{ padding: "4px", textAlign: "center", verticalAlign: "middle", borderRight: TABLE_INNER_BORDER, borderBottom: TABLE_INNER_BORDER }}>{item.cantidad}</td>
              <td style={{ padding: "4px", textAlign: "right", verticalAlign: "middle", borderRight: TABLE_INNER_BORDER, borderBottom: TABLE_INNER_BORDER }}>S/ {fmt(item.precio_venta)}</td>
              <td style={{ padding: "4px", textAlign: "right", verticalAlign: "middle", borderBottom: TABLE_INNER_BORDER }}>S/ {fmt(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + Terms side by side */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {/* Terms */}
        <div style={{ flex: 1, border: OB, padding: "6px", fontSize: "7px" }}>
          <div
            style={{
              backgroundColor: ORANGE,
              color: "#fff",
              fontWeight: 700,
              marginBottom: "8px",
              fontSize: "7px",
              display: "flex",
              alignItems: "center",
              height: "14px",
              width: "100%",
              boxSizing: "border-box",
              paddingLeft: "6px",
            }}
          >
            TÉRMINOS Y CONDICIONES
          </div>
          {data.terminos_items.map((term, idx) => (
            <div key={idx} style={{ marginBottom: "3px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {idx + 1}. {term}
            </div>
          ))}
          <div style={{ marginTop: "3px" }}>
            {data.terminos_items.length + 1}. N° Cta. Corriente soles BCP a nombre de {brandConfig.razon_social}:
          </div>
          <div style={{ marginLeft: "12px", marginTop: "2px" }}>
            {data.cuenta_bancaria}
          </div>
          <div style={{ marginLeft: "12px" }}>
            {data.cci}
          </div>

          {/* Signature inside terms box */}
          <div style={{ textAlign: "center", marginTop: "36px", paddingTop: "8px", fontSize: "7px" }}>
            <div style={{ borderTop: "1px solid #333", width: "200px", margin: "0 auto", paddingTop: "4px" }}>
              Gerente General de {data.empresa_cliente || "_______________"}
            </div>
          </div>
        </div>

        {/* Totals */}
        <div style={{ width: "160px", fontSize: "7px" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 3px" }}>
            <tbody>
              <tr><td>Subtotal</td><td style={{ textAlign: "right" }}>S/ {fmt(data.subtotal)}</td></tr>
              <tr><td>Imponible</td><td style={{ textAlign: "right" }}>S/ {fmt(data.imponible)}</td></tr>
              <tr><td>Impuesto %</td><td style={{ textAlign: "right" }}>{data.impuesto_pct}%</td></tr>
              <tr><td style={{ paddingBottom: "4px" }}>Total Impuesto</td><td style={{ textAlign: "right", paddingBottom: "4px" }}>S/ {fmt(data.total_impuesto)}</td></tr>
              <tr style={{ borderTop: "0.5px solid #ccc" }}><td style={{ paddingTop: "6px" }}>Otros</td><td style={{ textAlign: "right", paddingTop: "6px" }}>S/ {data.otros > 0 ? fmt(data.otros) : "-"}</td></tr>
              <tr style={{ borderTop: "0.75px solid #333", fontWeight: 700 }}><td>TOTAL</td><td style={{ textAlign: "right" }}>S/ {fmt(data.total)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "10px", fontSize: "7px", color: "#666" }}>
        Si usted tiene alguna pregunta sobre esta cotización, por favor, póngase en contacto con nosotros
      </div>
      <div style={{ textAlign: "center", marginTop: "4px", fontSize: "9px", fontStyle: "italic", fontWeight: 600 }}>
        ¡Gracias por su preferencia!
      </div>

      {/* Strategic Partners */}
      <div style={{ marginTop: "12px" }}>
        <div style={{ fontSize: "7px", fontWeight: 700, color: "#1a2744", marginBottom: "8px", textTransform: "uppercase" }}>
          Socios Estratégicos:
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <img src={logoKallpa} alt="Kallpa" style={{ height: "52px", objectFit: "contain", marginLeft: "20px" }} />
          <img src={logoElectroDunas} alt="ElectroDunas" style={{ height: "44px", objectFit: "contain" }} />
          <img src={logoFenix} alt="Fenix" style={{ height: "94px", objectFit: "contain" }} />
          <img src={logoLaVirgen} alt="La Virgen" style={{ height: "86px", objectFit: "contain", marginRight: "20px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "40px", marginTop: "10px" }}>
          <img src={logoCvc} alt="CVC Energía" style={{ height: "36px", objectFit: "contain" }} />
          <img src={logoOrazul} alt="Orazul Energy" style={{ height: "32px", objectFit: "contain" }} />
        </div>
      </div>
    </div>
  );
};

const CotizacionPreview = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { data } = useCotizacionContext();
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;


  return (
    <div
      ref={containerRef}
      data-pdf-page="1"
      data-filename={`Cotizacion_${data.empresa_cliente || "doc"}_${data.numero_cotizacion || "sin_numero"}.pdf`.replace(/\s+/g, "_")}
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



export default CotizacionPreview;
