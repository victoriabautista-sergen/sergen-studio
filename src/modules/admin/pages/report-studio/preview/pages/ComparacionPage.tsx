import { ReportData } from "../../types";

const toSentenceCase = (s: string) => {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const ComparacionPage = ({ data, pageNumber }: { data: ReportData; pageNumber?: number }) => {
  const h4 = data.hoja4_data;
  const h3 = data.hoja3_data;
  const h2 = data.hoja2_data;
  const dg = data.datos_generales;

  const borderStyle = "border border-[#1B3A5C]/20";
  const monedaSymbol = "S/";

  const items = h4.items_recalculados || [];
  const hasItems = items.length > 0;

  return (
    <div className="flex flex-col h-full text-[12px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-[14px] font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-[14px] font-semibold mt-4 mb-3" style={{ color: "#1B3A5C" }}>
          III. COMPARACIÓN CON FACTURA
        </h1>

        <p className="text-[13px] mb-4" style={{ color: "#1B3A5C" }}>
          A continuación se presenta la factura con los precios de energía recalculados según contrato. El precio calculado es de <strong>{fmt(h2.precio_calculado_hp, 4)} S/kWh (HP)</strong> y <strong>{fmt(h2.precio_calculado_hfp, 4)} S/kWh (HFP)</strong>. Los ítems de energía resaltados muestran el precio calculado por Sergen.
        </p>

        {hasItems ? (
          <>
            {/* Invoice header box - same as Hoja 3 */}
            <div className="border border-gray-300 rounded p-3 mb-3 flex justify-between items-start">
              <div>
                <p className="text-[12px] font-bold" style={{ color: "#1B3A5C" }}>{h3.razon_social || dg.concesionaria || "[Concesionaria]"}</p>
                <p className="text-[11px] text-gray-500">RUC: {h3.ruc || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-bold" style={{ color: "#1B3A5C" }}>FACTURA ELECTRÓNICA</p>
                <p className="text-[12px] font-bold" style={{ color: "#dc2626" }}>SIMULACIÓN</p>
                <p className="text-[11px]" style={{ color: "#1B3A5C" }}>{h3.fecha_factura || "—"}</p>
              </div>
            </div>

            <table className="w-full text-[11px] border-collapse mb-3" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "46%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "#1B3A5C" }}>
                  <th className={`${borderStyle} px-1.5 py-0.5 text-left text-white font-semibold`}>DESCRIPCIÓN</th>
                  <th className={`${borderStyle} px-1.5 py-0.5 text-center text-white font-semibold`}>UNIDAD</th>
                  <th className={`${borderStyle} px-1.5 py-0.5 text-right text-white font-semibold`}>CANTIDAD</th>
                  <th className={`${borderStyle} px-1.5 py-0.5 text-right text-white font-semibold`}>V. UNITARIO</th>
                  <th className={`${borderStyle} px-1.5 py-0.5 text-right text-white font-semibold`}>V. VENTA</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className={item.is_energy ? "" : (i % 2 === 0 ? "bg-white" : "bg-gray-50/50")} style={item.is_energy ? { backgroundColor: "#FFF3E0" } : {}}>
                    <td className={`${borderStyle} px-1.5 py-0.5`} style={{ color: item.is_energy ? "#E8792B" : "#1B3A5C", fontWeight: item.is_energy ? 600 : 400 }}>
                      {toSentenceCase(item.descripcion)}
                    </td>
                    <td className={`${borderStyle} px-1.5 py-0.5 text-center`} style={{ color: item.is_energy ? "#E8792B" : "#1B3A5C" }}>{item.unidad}</td>
                    <td className={`${borderStyle} px-1.5 py-0.5 text-right font-mono`} style={{ color: item.is_energy ? "#E8792B" : "#1B3A5C" }}>
                      {fmt(item.cantidad, 2)}
                    </td>
                    <td className={`${borderStyle} px-1.5 py-0.5 text-right font-mono`} style={{ color: item.is_energy ? "#E8792B" : "#1B3A5C", fontWeight: item.is_energy ? 700 : 400 }}>
                      {item.is_energy ? fmt(item.valor_unitario_calc, 3) : fmt(item.valor_unitario_original, 2)}
                    </td>
                    <td className={`${borderStyle} px-1.5 py-0.5 text-right font-mono`} style={{ color: item.is_energy ? "#E8792B" : "#1B3A5C", fontWeight: item.is_energy ? 700 : 400 }}>
                      {item.is_energy ? fmt(item.valor_venta_calc, 2) : fmt(item.valor_venta_original, 2)}
                    </td>
                  </tr>
                ))}
                {/* Spacer */}
                <tr><td colSpan={5} className="py-1 border-0"></td></tr>
                {/* Totals - same structure as Hoja 3 */}
                {(() => {
                   // Separate inafecta and exonerada based on original invoice structure
                   const origInafectas = h3.op_inafectas || 0;
                   const origExonerada = h3.op_exonerada || 0;
                   const totalNoGravado = h4.subtotal_exonerado || 0;
                   
                   // Distribute the recalculated non-taxable total proportionally
                   const origNoGravTotal = origInafectas + origExonerada;
                   let calcInafectas = 0;
                   let calcExonerada = 0;
                   if (origNoGravTotal > 0) {
                     calcInafectas = +(totalNoGravado * origInafectas / origNoGravTotal).toFixed(2);
                     calcExonerada = +(totalNoGravado - calcInafectas).toFixed(2);
                   } else if (origInafectas > 0) {
                     calcInafectas = totalNoGravado;
                   } else if (origExonerada > 0) {
                     calcExonerada = totalNoGravado;
                   } else {
                     // If both are 0 but we have non-taxable items, check item types
                     const hasInafecta = items.some(it => it.tipo === "inafecta");
                     if (hasInafecta) calcInafectas = totalNoGravado;
                     else calcExonerada = totalNoGravado;
                   }
                   
                   const subtotal = h4.subtotal_afecto + totalNoGravado;
                   const totalFinal = h4.subtotal_afecto + h4.igv_recalculado + totalNoGravado;
                   return [
                     ["OP. GRAVADAS", h4.subtotal_afecto, false],
                     ["OP. INAFECTAS", calcInafectas, false],
                     ["OP. EXONERADA", calcExonerada, false],
                     ["OP. GRATUITA", h3.op_gratuita || 0, false],
                     ["OTROS CARGOS", h3.otros_cargos || 0, false],
                     ["OTROS DESCUENTOS", h3.otros_descuentos || 0, false],
                     ["SUBTOTAL", subtotal, false],
                     ["ISC", h3.isc || 0, false],
                     ["IGV", h4.igv_recalculado, false],
                     ["IMPORTE TOTAL", totalFinal, true],
                  ].filter(([, val, isBold]) => isBold || (val as number) !== 0);
                })().map(([label, val, isBold], i) => (
                  <tr key={`total-${i}`}>
                    <td className="p-0 border-0"></td>
                    <td colSpan={2} className={`${borderStyle} px-1.5 py-0.5 text-left ${isBold ? "font-bold text-white text-[12px]" : "font-semibold"}`} style={isBold ? { backgroundColor: "#1B3A5C" } : { color: "#1B3A5C" }}>
                      {label as string}
                    </td>
                    <td colSpan={2} className={`${borderStyle} px-1.5 py-0.5 text-right font-mono ${isBold ? "font-bold text-white text-[13px]" : ""}`} style={isBold ? { backgroundColor: "#1B3A5C" } : { color: "#1B3A5C" }}>
                      {monedaSymbol} {fmt((val as number) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-[10px] italic text-gray-400 text-right mb-3">
              Fuente: Factura recalculada con precios según contrato
            </p>
          </>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 min-h-[150px]">
            <p className="text-[14px]">Completa la Hoja 3 para generar la factura simulada</p>
          </div>
        )}


        {/* Conclusion box */}
        <div className="border-l-4 rounded p-3 mt-3 text-[12px] leading-relaxed" style={{ borderColor: "#E8792B", backgroundColor: "#FFF7ED", color: "#1B3A5C" }}>
          {h4.conclusion || "—"}
        </div>
      </div>

      {/* Footer */}
      <div className="pdf-footer flex justify-between text-[11px] text-gray-500 border-t border-gray-200 pt-2 mt-auto">
        <span>Sergen Eficiencia Energética S.A.C. - Documento confidencial</span>
        <span>Página {pageNumber ?? 4}</span>
      </div>
    </div>
  );
};

export default ComparacionPage;
