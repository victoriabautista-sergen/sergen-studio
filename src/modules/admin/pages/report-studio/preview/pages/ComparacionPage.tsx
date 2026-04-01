import { ReportData } from "../../types";

const toSentenceCase = (s: string) => {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const ComparacionPage = ({ data }: { data: ReportData }) => {
  const h4 = data.hoja4_data;
  const h3 = data.hoja3_data;
  const h2 = data.hoja2_data;
  const dg = data.datos_generales;

  const borderStyle = "border border-[#1B3A5C]/20";
  const monedaSymbol = "S/";

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesIndex = meses.indexOf(dg.mes || "");
  const mesAnterior = mesIndex > 0 ? meses[mesIndex - 1] : mesIndex === 0 ? "Diciembre" : dg.mes;

  const items = h4.items_recalculados || [];
  const hasItems = items.length > 0;

  // Find energy items for impact calc
  const energiaHP = h3.items.find(i => i.descripcion.toUpperCase().includes(h3.nombre_hp.toUpperCase()));
  const energiaHFP = h3.items.find(i => i.descripcion.toUpperCase().includes(h3.nombre_hfp.toUpperCase()));
  const cantHP = energiaHP?.cantidad || 0;
  const cantHFP = energiaHFP?.cantidad || 0;
  const impactoHP = +(cantHP * h4.diferencia_hp).toFixed(2);
  const impactoHFP = +(cantHFP * h4.diferencia_hfp).toFixed(2);

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-xs font-semibold mt-4 mb-3" style={{ color: "#1B3A5C" }}>
          III. COMPARACIÓN CON FACTURA
        </h1>

        <p className="text-[11px] mb-4" style={{ color: "#1B3A5C" }}>
          A continuación se presenta la factura con los precios de energía recalculados según contrato. El precio calculado es de <strong>{fmt(h2.precio_calculado_hp, 4)} S/kWh (HP)</strong> y <strong>{fmt(h2.precio_calculado_hfp, 4)} S/kWh (HFP)</strong>. Los ítems de energía resaltados muestran el precio calculado por Sergen.
        </p>

        {hasItems ? (
          <>
            {/* Invoice header box - same as Hoja 3 */}
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

            {/* Invoice table - same 5-column structure as Hoja 3 */}
            <table className="w-full text-[9px] border-collapse mb-3" style={{ tableLayout: "fixed" }}>
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
                  const opInafectas = items.filter(i => i.tipo === "inafecto").reduce((s, i) => s + i.valor_venta_calc, 0);
                  const opExonerada = items.filter(i => i.tipo === "exonerado").reduce((s, i) => s + i.valor_venta_calc, 0);
                  const subtotal = h4.subtotal_afecto + opInafectas + opExonerada;
                  return [
                    ["OP. GRAVADAS", h4.subtotal_afecto, false],
                    ["OP. INAFECTAS", opInafectas, false],
                    ["OP. EXONERADA", opExonerada, false],
                    ["SUBTOTAL", subtotal, false],
                    ["IGV", h4.igv_recalculado, false],
                    ["IMPORTE TOTAL", h4.total_recalculado + opInafectas + opExonerada, true],
                  ].filter(([, val, isBold]) => isBold || (val as number) !== 0);
                })().map(([label, val, isBold], i) => (
                  <tr key={`total-${i}`}>
                    <td className="p-0 border-0"></td>
                    <td colSpan={2} className={`${borderStyle} px-1.5 py-0.5 text-left ${isBold ? "font-bold text-white text-[10px]" : "font-semibold"}`} style={isBold ? { backgroundColor: "#1B3A5C" } : { color: "#1B3A5C" }}>
                      {label as string}
                    </td>
                    <td colSpan={2} className={`${borderStyle} px-1.5 py-0.5 text-right font-mono ${isBold ? "font-bold text-white text-[11px]" : ""}`} style={isBold ? { backgroundColor: "#1B3A5C" } : { color: "#1B3A5C" }}>
                      {monedaSymbol} {fmt((val as number) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-[8px] italic text-gray-400 text-right mb-3">
              Fuente: Factura recalculada con precios según contrato
            </p>
          </>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 min-h-[150px]">
            <p className="text-xs">Completa la Hoja 3 para generar la factura simulada</p>
          </div>
        )}

        {/* Comparison Table */}
        <p className="text-[9px] italic text-gray-500 mb-1">
          Tabla comparativa – Periodo {mesAnterior?.toLowerCase()} del {dg.anio}
        </p>

        <table className="w-full text-[9px] border-collapse mb-3" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "34%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className="border border-[#E8792B]/50 px-1.5 py-0.5 text-left text-white font-semibold">Concepto</th>
              <th className="border border-[#E8792B]/50 px-1.5 py-0.5 text-right text-white font-semibold">Calculado</th>
              <th className="border border-[#E8792B]/50 px-1.5 py-0.5 text-right text-white font-semibold">Facturado</th>
              <th className="border border-[#E8792B]/50 px-1.5 py-0.5 text-right text-white font-semibold">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="border border-gray-200 px-1.5 py-0.5" style={{ color: "#1B3A5C" }}>Precio energía HP (S/kWh)</td>
              <td className="border border-gray-200 px-1.5 py-0.5 text-right font-mono" style={{ color: "#1B3A5C" }}>{fmt(h4.precio_calculado_hp, 5)}</td>
              <td className="border border-gray-200 px-1.5 py-0.5 text-right font-mono" style={{ color: "#1B3A5C" }}>{fmt(h4.precio_facturado_hp, 5)}</td>
              <td className="border border-gray-200 px-1.5 py-0.5 text-right font-mono font-bold" style={{ color: h4.diferencia_hp > 0 ? "#E8792B" : "#22c55e" }}>
                {h4.diferencia_hp >= 0 ? "+" : ""}{fmt(h4.diferencia_hp, 5)}
              </td>
            </tr>
            <tr className="bg-gray-50/50">
              <td className="border border-gray-200 px-1.5 py-0.5" style={{ color: "#1B3A5C" }}>Precio energía HFP (S/kWh)</td>
              <td className="border border-gray-200 px-1.5 py-0.5 text-right font-mono" style={{ color: "#1B3A5C" }}>{fmt(h4.precio_calculado_hfp, 5)}</td>
              <td className="border border-gray-200 px-1.5 py-0.5 text-right font-mono" style={{ color: "#1B3A5C" }}>{fmt(h4.precio_facturado_hfp, 5)}</td>
              <td className="border border-gray-200 px-1.5 py-0.5 text-right font-mono font-bold" style={{ color: h4.diferencia_hfp > 0 ? "#E8792B" : "#22c55e" }}>
                {h4.diferencia_hfp >= 0 ? "+" : ""}{fmt(h4.diferencia_hfp, 5)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Energy impact breakdown */}
        <div className="border border-gray-200 rounded mb-2">
          <div className="flex justify-between px-2 py-1 text-[9px] bg-gray-50">
            <span style={{ color: "#1B3A5C" }}>
              <strong>Energía HP:</strong> {fmt(cantHP, 2)} × {fmt(h4.diferencia_hp, 5)}
            </span>
            <span className="font-mono font-semibold" style={{ color: "#1B3A5C" }}>
              {monedaSymbol} {fmt(Math.abs(impactoHP))}
            </span>
          </div>
          <div className="flex justify-between px-2 py-1 text-[9px]">
            <span style={{ color: "#1B3A5C" }}>
              <strong>Energía HFP:</strong> {fmt(cantHFP, 2)} × {fmt(h4.diferencia_hfp, 5)}
            </span>
            <span className="font-mono font-semibold" style={{ color: "#1B3A5C" }}>
              {monedaSymbol} {fmt(Math.abs(impactoHFP))}
            </span>
          </div>
          <div className="flex justify-between px-2 py-1 text-[10px] border-t border-gray-200 bg-gray-50">
            <span className="font-semibold" style={{ color: "#1B3A5C" }}>Impacto económico total</span>
            <span className="font-mono font-bold" style={{ color: "#1B3A5C" }}>
              {monedaSymbol} {fmt(h4.impacto_economico, 3)}
            </span>
          </div>
        </div>

        {/* Conclusion box */}
        <div className="border-l-4 rounded p-3 mt-3 text-[10px] leading-relaxed" style={{ borderColor: "#E8792B", backgroundColor: "#FFF7ED", color: "#1B3A5C" }}>
          {h4.conclusion || "—"}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[8px] text-gray-400 border-t border-gray-200 pt-2 mt-auto">
        <span>Sergen Eficiencia Energética S.A.C. - Documento confidencial</span>
        <span>Página 4</span>
      </div>
    </div>
  );
};

export default ComparacionPage;