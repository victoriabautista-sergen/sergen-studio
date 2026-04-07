import React from "react";
import { ReportData } from "../../types";

/** Renders formula text with subscript support: _x becomes <sub>x</sub>, _{abc} becomes <sub>abc</sub> */
const renderFormula = (text: string): React.ReactNode => {
  const parts = text.split(/(_\{[^}]+\}|_[a-zA-Z0-9])/g);
  return parts.map((part, i) => {
    const braceMatch = part.match(/^_\{(.+)\}$/);
    if (braceMatch) return <sub key={i} style={{ fontSize: "0.75em", verticalAlign: "sub", fontStyle: "normal", fontWeight: 600 }}>{braceMatch[1]}</sub>;
    const singleMatch = part.match(/^_([a-zA-Z0-9])$/);
    if (singleMatch) return <sub key={i} style={{ fontSize: "0.75em", verticalAlign: "sub", fontStyle: "normal", fontWeight: 600 }}>{singleMatch[1]}</sub>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

const PreciosPage = ({ data, pageNumber }: { data: ReportData; pageNumber?: number }) => {
  const h2 = data.hoja2_data;
  const dg = data.datos_generales;
  const monedaSymbol = h2.moneda === "USD" ? "$" : "S/";
  const pngBaseSymbol = (h2.png_moneda || "USD") === "USD" ? "$" : "S/";
  const pngActualSymbol = (h2.png_actual_moneda || h2.png_moneda || "USD") === "USD" ? "$" : "S/";
  const concesionaria = dg.concesionaria || "[Concesionaria]";
  const cliente = dg.client_name || "[Cliente]";
  const mesNombre = dg.mes || "—";
  const anio = dg.anio || "—";

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesIndex = meses.indexOf(mesNombre);
  const mesAnterior = mesIndex > 0 ? meses[mesIndex - 1] : mesIndex === 0 ? "Diciembre" : mesNombre;

  const borderStyle = "border border-[#E8792B]/50";

  return (
    <div className="flex flex-col h-full text-[12px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      {/* Content */}
      <div className="flex-1">
        {/* Header */}
        <p className="text-[14px] font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        {/* Title */}
        <h1 className="text-[14px] font-semibold mt-4 mb-2" style={{ color: "#1B3A5C" }}>
          I. ACTUALIZACIÓN DE PRECIO
        </h1>

        {/* 1. Contexto */}
        <h2 className="text-[13px] font-bold mb-1" style={{ color: "#1B3A5C" }}>1. Contexto</h2>
        <p className="mb-4 text-[12px] leading-relaxed text-gray-700" style={{ textAlign: "justify" }}>
          El presente informe tiene como objetivo analizar la actualización del precio contractual del servicio prestado,
          conforme a las cláusulas de reajuste establecidas en el contrato vigente entre <strong>{concesionaria}</strong> y <strong>{cliente}</strong>.
          Se utilizan las variables económicas y los índices de referencia aplicables al periodo {mesAnterior} del {anio}.
        </p>

        {/* 2. Variables utilizadas */}
        <h2 className="text-[13px] font-bold mb-1" style={{ color: "#1B3A5C" }}>2. Variables utilizadas</h2>
        <p className="text-[11px] italic text-gray-500 mb-1">Tabla 1: Actualización de precios de energía</p>

        <table className="w-full text-[12px] border-collapse mb-1" style={{ border: "1px solid rgba(232, 121, 43, 0.5)" }}>
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className={`px-1.5 py-0.5 text-left text-white font-semibold ${borderStyle}`}>Descripción</th>
              <th className={`px-1.5 py-0.5 text-right text-white font-semibold ${borderStyle} w-24`}>Valores</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["PNG (Precio del gas natural)", h2.png_actual, pngActualSymbol],
              [`PNG₀ (Precio del gas natural base)`, h2.pngo, pngBaseSymbol],
              ["TC (Tipo de cambio)", h2.tc_actual, ""],
              [`TC₀ (Tipo de cambio base)`, h2.tco, ""],
              ["IPP (Índice de precios al productor de EE.UU)", h2.ipp_actual, ""],
              [`IPP₀ (Índice de precios al productor de EE.UU base)`, h2.ippo, ""],
              [`Precio de energía base HP por kWh`, h2.precio_base_hp, monedaSymbol],
              [`Precio de energía base HFP por kWh`, h2.precio_base_hfp, monedaSymbol],
            ].map(([label, val, symbol], i) => (
              <tr key={i} className="bg-white">
                <td className={`px-1.5 py-0.5 ${borderStyle}`} style={{ color: "#1B3A5C" }}>{String(label)}</td>
                <td className={`px-1.5 py-0.5 ${borderStyle} text-right font-mono`} style={{ color: "#1B3A5C" }}>
                  {val ? `${symbol ? `${symbol} ` : ""}${Number(val).toFixed(4)}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-gray-400 text-right mb-4 italic">Fuente: Elaboración propia</p>

        {/* 3. Cálculo de precio energía */}
        <h2 className="text-[13px] font-bold mb-1" style={{ color: "#1B3A5C" }}>3. Cálculo de precio energía</h2>
        <p className="text-[12px] text-gray-700 mb-2">Realizamos el cálculo de precio energía:</p>

        <div className="border border-gray-200 rounded bg-gray-50 px-4 py-2 mb-2">
          <p className="text-[13px] text-gray-700 whitespace-pre-wrap" style={{ fontFamily: "'Times New Roman', serif" }}>
            {renderFormula(h2.formula || "Precio energía = Precio base × Factor E")}
          </p>
        </div>

        <p className="text-[12px] text-gray-700 mb-2">
          Realizando la conversión del precio actualizado de la energía tenemos que para el periodo <strong>{mesAnterior} del {mesIndex === 0 ? String(Number(anio) - 1) : anio}</strong> el
          costo de la energía es de <strong>{h2.precio_calculado_hp?.toFixed(5) || "0.00000"} {monedaSymbol}/kWh (HP)</strong> y{" "}
          <strong>{h2.precio_calculado_hfp?.toFixed(5) || "0.00000"} {monedaSymbol}/kWh (HFP)</strong>.
        </p>

        <p className="text-[11px] italic text-gray-500 mb-1">Precios de Energía Actualizados – {mesAnterior} del {mesIndex === 0 ? Number(anio) - 1 : anio}</p>

        <table className="w-full text-[12px] border-collapse mb-1" style={{ border: "1px solid rgba(232, 121, 43, 0.5)" }}>
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className={`px-1.5 py-0.5 text-left text-white font-semibold ${borderStyle}`}>Descripción</th>
              <th className={`px-1.5 py-0.5 text-right text-white font-semibold ${borderStyle} w-24`}>Valores</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Factor A", h2.factor_e?.toFixed(4) || "0.0000"],
              ["Factor por pérdida", h2.factor_perdida?.toFixed(2) || "0.00"],
              ["Precio actualizado HP por MWh", `${monedaSymbol} ${h2.precio_actualizado_hp?.toFixed(2) || "0.00"}`],
              ["Precio actualizado HFP por MWh", `${monedaSymbol} ${h2.precio_actualizado_hfp?.toFixed(2) || "0.00"}`],
              ["Precio de energía base HP por kWh", `${monedaSymbol} ${h2.precio_calculado_hp?.toFixed(4) || "0.0000"}`],
              ["Precio de energía base HFP por kWh", `${monedaSymbol} ${h2.precio_calculado_hfp?.toFixed(4) || "0.0000"}`],
            ].map(([label, val], i) => (
              <tr key={i} className="bg-white">
                <td className={`px-1.5 py-0.5 ${borderStyle}`} style={{ color: "#1B3A5C" }}>{label}</td>
                <td className={`px-1.5 py-0.5 ${borderStyle} text-right font-mono`} style={{ color: "#1B3A5C" }}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-gray-400 text-right italic">Fuente: Elaboración propia</p>
      </div>

      {/* Footer */}
      <div className="pdf-footer flex justify-between text-[11px] text-gray-500 border-t border-gray-200 pt-2 mt-auto">
        <span>Sergen Eficiencia Energética S.A.C. - Documento confidencial</span>
        <span>Página {pageNumber ?? 2}</span>
      </div>
    </div>
  );
};

export default PreciosPage;
