import { ReportData } from "../../types";

const toSentenceCase = (s: string) => {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const FacturaPage = ({ data }: { data: ReportData }) => {
  const h3 = data.hoja3_data;
  const dg = data.datos_generales;

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesIndex = meses.indexOf(dg.mes || "");
  const mesAnterior = mesIndex > 0 ? meses[mesIndex - 1] : mesIndex === 0 ? "Diciembre" : dg.mes;
  const anioAnterior = mesIndex === 0 ? Number(dg.anio) - 1 : dg.anio;

  const monedaSymbol = "S/";
  const borderStyle = "border border-[#1B3A5C]/20";
  const hasItems = h3.items && h3.items.length > 0;

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-xs font-semibold mt-4 mb-3" style={{ color: "#1B3A5C" }}>
          II. FACTURA EMITIDA
        </h1>

        <p className="text-[9px] mb-4" style={{ color: "#1B3A5C" }}>
          Se presenta la factura <strong>{h3.numero_factura || "[N° Factura]"}</strong> de fecha <strong>{h3.fecha_factura || "[Fecha]"}</strong>, correspondiente al periodo de <strong>{mesAnterior?.toLowerCase()} del {anioAnterior}</strong>, con los importes originales emitidos por <strong>{dg.concesionaria || "[Concesionaria]"}</strong>.
        </p>

        {hasItems ? (
          <>
            {/* Invoice header box */}
            <div className="border border-gray-300 rounded p-3 mb-3 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold" style={{ color: "#1B3A5C" }}>{h3.razon_social || dg.concesionaria || "[Concesionaria]"}</p>
                <p className="text-[9px] text-gray-500">RUC: {h3.ruc || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold" style={{ color: "#1B3A5C" }}>FACTURA ELECTRÓNICA</p>
                <p className="text-[9px]" style={{ color: "#1B3A5C" }}>{h3.numero_factura || "—"}</p>
                <p className="text-[9px]" style={{ color: "#1B3A5C" }}>{h3.fecha_factura || "—"}</p>
              </div>
            </div>

            {/* Items table */}
            <table className="w-full text-[11px] border-collapse mb-3" style={{ border: "1px solid rgba(27, 58, 92, 0.3)" }}>
              <thead>
                <tr style={{ backgroundColor: "#1B3A5C" }}>
                  <th className={`${borderStyle} p-1.5 text-left text-white font-semibold`}>DESCRIPCIÓN</th>
                  <th className={`${borderStyle} p-1.5 text-center text-white font-semibold`}>UNIDAD</th>
                  <th className={`${borderStyle} p-1.5 text-right text-white font-semibold`}>CANTIDAD</th>
                  <th className={`${borderStyle} p-1.5 text-right text-white font-semibold`}>V. UNITARIO</th>
                  <th className={`${borderStyle} p-1.5 text-right text-white font-semibold`}>V. VENTA</th>
                </tr>
              </thead>
              <tbody>
                {h3.items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className={`${borderStyle} p-1.5`} style={{ color: "#1B3A5C" }}>{toSentenceCase(item.descripcion)}</td>
                    <td className={`${borderStyle} p-1.5 text-center`} style={{ color: "#1B3A5C" }}>{item.unidad}</td>
                    <td className={`${borderStyle} p-1.5 text-right font-mono`} style={{ color: "#1B3A5C" }}>
                      {typeof item.cantidad === "number" ? item.cantidad.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : item.cantidad}
                    </td>
                    <td className={`${borderStyle} p-1.5 text-right font-mono`} style={{ color: "#1B3A5C" }}>
                      {typeof item.valor_unitario === "number" ? item.valor_unitario.toFixed(4) : item.valor_unitario}
                    </td>
                    <td className={`${borderStyle} p-1.5 text-right font-mono`} style={{ color: "#1B3A5C" }}>
                      {typeof item.valor_venta === "number" ? item.valor_venta.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.valor_venta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals - aligned with last 4 columns of items table */}
            <table className="w-full text-[11px] border-collapse mb-2">
              <tbody>
                {[
                  ["OP. GRAVADAS", h3.op_gravadas, false],
                  ["OP. INAFECTAS", h3.op_inafectas, false],
                  ["OP. EXONERADA", h3.op_exonerada, false],
                  ["OP. GRATUITA", h3.op_gratuita, false],
                  ["OTROS CARGOS", h3.otros_cargos, false],
                  ["OTROS DESCUENTOS", h3.otros_descuentos, false],
                  ["SUBTOTAL", h3.subtotal, false],
                  ["ISC", h3.isc, false],
                  ["IGV", h3.igv, false],
                  ["IMPORTE TOTAL", h3.importe_total, true],
                ].filter(([, val, isBold]) => isBold || (val as number) !== 0).map(([label, val, isBold], i) => (
                  <tr key={i} style={isBold ? { backgroundColor: "#1B3A5C" } : {}}>
                    <td className="p-0" style={{ width: "40%" }}></td>
                    <td colSpan={2} className={`px-2 py-1 ${borderStyle} text-right ${isBold ? "font-bold text-white text-[10px]" : "font-semibold"}`} style={!isBold ? { color: "#1B3A5C" } : {}}>
                      {label as string}
                    </td>
                    <td className={`px-2 py-1 ${borderStyle} text-right font-mono ${isBold ? "font-bold text-white text-[11px]" : ""}`} style={!isBold ? { color: "#1B3A5C" } : {}}>
                      {monedaSymbol} {((val as number) || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-[8px] italic text-gray-400 text-right">
              Fuente: Factura emitida por {dg.concesionaria || "[Concesionaria]"}
            </p>
          </>
        ) : (
          /* No data extracted yet - show placeholder */
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
            <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs">Sube una factura y extrae los datos para mostrar aquí</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[8px] text-gray-400 border-t border-gray-200 pt-2 mt-auto">
        <span>Sergen Eficiencia Energética S.A.C. - Documento confidencial</span>
        <span>Página 3</span>
      </div>
    </div>
  );
};

export default FacturaPage;
