import { ReportData } from "../../types";

const PreciosPage = ({ data }: { data: ReportData }) => {
  const h2 = data.hoja2_data;
  const dg = data.datos_generales;
  const monedaSymbol = h2.moneda === "USD" ? "$" : "S/";
  const pngSymbol = (h2.png_moneda || "USD") === "USD" ? "$" : "S/";
  const concesionaria = dg.concesionaria || "[Concesionaria]";
  const cliente = dg.client_name || "[Cliente]";
  const mesNombre = dg.mes || "—";
  const anio = dg.anio || "—";

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesIndex = meses.indexOf(mesNombre);
  const mesAnterior = mesIndex > 0 ? meses[mesIndex - 1] : mesIndex === 0 ? "Diciembre" : mesNombre;

  const borderStyle = "border border-[#E8792B]/50";

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      {/* Content */}
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        {/* Title */}
        <h1 className="text-xs font-semibold mt-4 mb-2" style={{ color: "#1B3A5C" }}>
          I. ACTUALIZACIÓN DE PRECIO
        </h1>

        {/* 1. Contexto */}
        <h2 className="text-[11px] font-bold mb-1" style={{ color: "#1B3A5C" }}>1. Contexto</h2>
        <p className="mb-4 text-[10px] leading-relaxed text-gray-700" style={{ textAlign: "justify" }}>
          El presente informe tiene como objetivo analizar la actualización del precio contractual del servicio prestado,
          conforme a las cláusulas de reajuste establecidas en el contrato vigente entre <strong>{concesionaria}</strong> y <strong>{cliente}</strong>.
          Se utilizan las variables económicas y los índices de referencia aplicables al periodo {mesAnterior} del {anio}.
        </p>

        {/* 2. Variables utilizadas */}
        <h2 className="text-[11px] font-bold mb-1" style={{ color: "#1B3A5C" }}>2. Variables utilizadas</h2>
        <p className="text-[9px] italic text-gray-500 mb-1">Tabla 1: Actualización de precios de energía</p>

        <table className="w-full text-[10px] border-collapse mb-1" style={{ border: "1px solid rgba(232, 121, 43, 0.5)" }}>
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className={`px-1.5 py-0.5 text-left text-white font-semibold ${borderStyle}`}>Descripción</th>
              <th className={`px-1.5 py-0.5 text-right text-white font-semibold ${borderStyle} w-24`}>Valores</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["PNG (Precio del gas natural)", h2.png_actual, pngSymbol],
              [`PNG₀ (Precio del gas natural base)`, h2.pngo, pngSymbol],
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
        <p className="text-[8px] text-gray-400 text-right mb-4 italic">Fuente: Elaboración propia</p>

        {/* 3. Cálculo de precio energía */}
        <h2 className="text-[11px] font-bold mb-1" style={{ color: "#1B3A5C" }}>3. Cálculo de precio energía</h2>
        <p className="text-[10px] text-gray-700 mb-2">Realizamos el cálculo de precio energía:</p>

        <div className="border border-gray-200 rounded bg-gray-50 px-4 py-2 mb-2">
          <p className="text-[10px] italic text-gray-700 font-mono whitespace-pre-wrap">
            {h2.formula || "Precio energía = Precio base × Factor E"}
          </p>
        </div>

        <p className="text-[10px] text-gray-700 mb-2">
          Realizando la conversión del precio actualizado de la energía tenemos que para el periodo <strong>{mesNombre} del {anio}</strong> el
          costo de la energía es de <strong>{h2.precio_calculado_hp?.toFixed(5) || "0.00000"} {monedaSymbol}/kWh (HP)</strong> y{" "}
          <strong>{h2.precio_calculado_hfp?.toFixed(5) || "0.00000"} {monedaSymbol}/kWh (HFP)</strong>.
        </p>

        <p className="text-[9px] italic text-gray-500 mb-1">Precios de Energía Actualizados – {mesNombre} del {anio}</p>

        <table className="w-full text-[10px] border-collapse mb-1" style={{ border: "1px solid rgba(232, 121, 43, 0.5)" }}>
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className={`px-1.5 py-0.5 text-left text-white font-semibold ${borderStyle}`}>Concepto</th>
              <th className={`px-1.5 py-0.5 text-center text-white font-semibold ${borderStyle} w-24`}>Valor</th>
              <th className={`px-1.5 py-0.5 text-center text-white font-semibold ${borderStyle} w-20`}>Unidad</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Factor E", h2.factor_e?.toFixed(4) || "0.0000", ""],
              ["Factor por pérdida", h2.factor_perdida?.toFixed(2) || "0.00", ""],
              ["Precio actualizado HP", h2.precio_actualizado_hp?.toFixed(2) || "0.00", `${monedaSymbol}/MWh`],
              ["Precio actualizado HFP", h2.precio_actualizado_hfp?.toFixed(2) || "0.00", `${monedaSymbol}/MWh`],
              ["Precio Calculado HP", h2.precio_calculado_hp?.toFixed(5) || "0.00000", `${monedaSymbol}/kWh`],
              ["Precio Calculado HFP", h2.precio_calculado_hfp?.toFixed(5) || "0.00000", `${monedaSymbol}/kWh`],
            ].map(([label, val, unit], i) => (
              <tr key={i} className="bg-white">
                <td className={`px-1.5 py-0.5 ${borderStyle}`} style={{ color: "#1B3A5C" }}>{label}</td>
                <td className={`px-1.5 py-0.5 ${borderStyle} text-center font-mono`} style={{ color: "#1B3A5C" }}>{val}</td>
                <td className={`px-1.5 py-0.5 ${borderStyle} text-center`} style={{ color: "#1B3A5C" }}>{unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[8px] text-gray-400 text-right italic">Fuente: Elaboración propia</p>
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[8px] text-gray-400 border-t border-gray-200 pt-2 mt-auto">
        <span>Sergen Eficiencia Energética S.A.C. - Documento confidencial</span>
        <span>Página 2</span>
      </div>
    </div>
  );
};

export default PreciosPage;
