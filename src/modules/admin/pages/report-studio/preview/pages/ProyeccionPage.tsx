import { ReportData } from "../../types";

const toSentenceCase = (s: string) => {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const ProyeccionPage = ({ data }: { data: ReportData }) => {
  const h3 = data.hoja3_data;
  const h5 = data.hoja5_data;
  const h6 = data.hoja6_data;
  const dg = data.datos_generales;

  const borderStyle = "border border-[#1B3A5C]/20";
  const monedaSymbol = "S/";

  const itemsPotencia = h6.items_potencia || [];
  const potenciaPromedio = h5.potencia_coincidente_promedio || 0;

  // Find original potencia from hoja 3 items
  const potenciaOrigItem = h3.items.find(i =>
    i.descripcion.toUpperCase().includes("POTENCIA ACTIVA")
  );
  const potenciaOriginal = potenciaOrigItem?.cantidad || 0;

  const hasItems = h3.items.length > 0;

  // Build projected items
  const projectedItems = h3.items.map((item) => {
    const descUpper = item.descripcion.toUpperCase();
    const isMatch = itemsPotencia.some(p => descUpper.includes(p.toUpperCase()));
    if (isMatch) {
      const newCantidad = potenciaPromedio;
      const newTotal = +(item.valor_unitario * newCantidad).toFixed(2);
      return { ...item, cantidad: newCantidad, valor_venta: newTotal, is_potencia: true };
    }
    return { ...item, is_potencia: false };
  });

  // Calculate totals - replicate Hoja 3 structure
  const opGravadas = +projectedItems.reduce((sum, i) => sum + i.valor_venta, 0).toFixed(2);
  const opInafectas = h3.op_inafectas || 0;
  const opExonerada = h3.op_exonerada || 0;
  const opGratuita = h3.op_gratuita || 0;
  const otrosCargos = h3.otros_cargos || 0;
  const otrosDescuentos = h3.otros_descuentos || 0;
  const subtotalProyectado = +(opGravadas + opInafectas + opExonerada).toFixed(2);
  const iscProyectado = h3.isc || 0;
  const igvProyectado = +(opGravadas * 0.18).toFixed(2);
  const totalProyectado = +(subtotalProyectado + iscProyectado + igvProyectado + otrosCargos - otrosDescuentos).toFixed(2);
  const desviacion = +(totalProyectado - (h3.importe_total || 0)).toFixed(2);

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-xs font-semibold mt-4 mb-3" style={{ color: "#1B3A5C" }}>
          III. FACTURA PROYECTADA CON POTENCIA COINCIDENTE PROMEDIO
        </h1>

        <p className="text-[10px] mb-4" style={{ color: "#1B3A5C" }}>
          Gracias a las gestiones realizadas por el personal de <strong><u>{dg.client_name || "Cliente"}</u></strong>, la potencia coincidente original fue de <strong>{fmt(potenciaOriginal, 2)} kW</strong>. Realizando una simulación de la factura con la potencia coincidente promedio de <strong>{potenciaPromedio ? fmt(potenciaPromedio, 2) : "—"}</strong>, obtenemos el siguiente resultado:
        </p>

        {hasItems ? (
          <>
            {/* Invoice header */}
            <div className="border border-gray-300 rounded p-3 mb-3 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold" style={{ color: "#1B3A5C" }}>{h3.razon_social || dg.concesionaria || "[Concesionaria]"}</p>
                <p className="text-[9px] text-gray-500">RUC: {h3.ruc || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold" style={{ color: "#1B3A5C" }}>FACTURA ELECTRÓNICA</p>
                <p className="text-[10px] italic" style={{ color: "#E8792B" }}>Proyectado Promedio</p>
                <p className="text-[9px]" style={{ color: "#1B3A5C" }}>{h3.fecha_factura || "—"}</p>
              </div>
            </div>

            {/* Invoice table */}
            <table className="w-full text-[9px] border-collapse mb-3" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "38%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "17%" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "#1B3A5C" }}>
                  <th className={`${borderStyle} px-1.5 py-0.5 text-left text-white font-semibold`}>DESCRIPCIÓN</th>
                  <th className={`${borderStyle} px-1.5 py-0.5 text-center text-white font-semibold`}>UNIDAD</th>
                  <th className={`${borderStyle} px-1.5 py-0.5 text-right text-white font-semibold`}>CONSUMO</th>
                  <th className={`${borderStyle} px-1.5 py-0.5 text-right text-white font-semibold`}>P.U.</th>
                  <th className={`${borderStyle} px-1.5 py-0.5 text-right text-white font-semibold`}>P. PARCIAL</th>
                </tr>
              </thead>
              <tbody>
                {projectedItems.map((item, i) => (
                    <tr
                      key={i}
                      className={!item.is_potencia ? (i % 2 === 0 ? "bg-white" : "bg-gray-50/50") : ""}
                      style={item.is_potencia ? { backgroundColor: "#FEE2E2" } : {}}
                    >
                      <td className={`${borderStyle} px-1.5 py-0.5`} style={{ color: item.is_potencia ? "#ffffff" : "#1B3A5C", fontWeight: item.is_potencia ? 700 : 400 }}>
                        {toSentenceCase(item.descripcion)}
                      </td>
                      <td className={`${borderStyle} px-1.5 py-0.5 text-center`} style={{ color: item.is_potencia ? "#ffffff" : "#1B3A5C", fontWeight: item.is_potencia ? 700 : 400 }}>{item.unidad}</td>
                      <td className={`${borderStyle} px-1.5 py-0.5 text-right font-mono`} style={{ color: item.is_potencia ? "#ffffff" : "#1B3A5C", fontWeight: item.is_potencia ? 700 : 400 }}>
                        {fmt(item.cantidad, 2)}
                      </td>
                      <td className={`${borderStyle} px-1.5 py-0.5 text-right font-mono`} style={{ color: item.is_potencia ? "#ffffff" : "#1B3A5C", fontWeight: item.is_potencia ? 700 : 400 }}>
                        {fmt(item.valor_unitario, 10)}
                      </td>
                      <td className={`${borderStyle} px-1.5 py-0.5 text-right font-mono`} style={{ color: item.is_potencia ? "#ffffff" : "#1B3A5C", fontWeight: item.is_potencia ? 700 : 400 }}>
                        {fmt(item.valor_venta, 2)}
                      </td>
                    </tr>
                ))}

                {/* Spacer */}
                <tr><td colSpan={5} className="py-1 border-0"></td></tr>

                {/* Totals */}
                {(() => {
                  const rows: [string, number, boolean][] = [
                    ["OP. GRAVADAS", opGravadas, false],
                    ["OP. INAFECTAS", opInafectas, false],
                    ["OP. EXONERADA", opExonerada, false],
                    ["OP. GRATUITA", opGratuita, false],
                    ["OTROS CARGOS", otrosCargos, false],
                    ["OTROS DESCUENTOS", otrosDescuentos, false],
                    ["SUBTOTAL", subtotalProyectado, false],
                    ["ISC", iscProyectado, false],
                    ["IGV", igvProyectado, false],
                    ["IMPORTE TOTAL", totalProyectado, true],
                  ];
                  return rows
                    .filter(([, val, isBold]) => isBold || (val as number) !== 0)
                    .map(([label, val, isBold], i) => (
                    <tr key={`total-${i}`}>
                      <td className="p-0 border-0"></td>
                      <td colSpan={2} className={`${borderStyle} px-1.5 py-0.5 text-left ${isBold ? "font-bold text-white text-[10px]" : "font-semibold"}`} style={isBold ? { backgroundColor: "#1B3A5C" } : { color: "#1B3A5C" }}>
                        {label}
                      </td>
                      <td colSpan={2} className={`${borderStyle} px-1.5 py-0.5 text-right font-mono ${isBold ? "font-bold text-white text-[11px]" : ""}`} style={isBold ? { backgroundColor: "#1B3A5C" } : { color: "#1B3A5C" }}>
                        {monedaSymbol} {fmt(val)}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>

            {/* Deviation analysis */}
            <div
              className="rounded p-3 mt-4"
              style={{
                backgroundColor: desviacion < 0 ? "#fef2f2" : desviacion > 0 ? "#f0fdf4" : "#f9fafb",
                border: `1px solid ${desviacion < 0 ? "#fecaca" : desviacion > 0 ? "#bbf7d0" : "#e5e7eb"}`,
              }}
            >
              <p className="text-[10px] font-semibold mb-2" style={{ color: "#1B3A5C" }}>Análisis de desviación</p>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span style={{ color: "#1B3A5C" }}>Factura original:</span>
                  <span className="font-mono font-semibold" style={{ color: "#1B3A5C" }}>{monedaSymbol} {fmt(h3.importe_total || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#1B3A5C" }}>Factura proyectada:</span>
                  <span className="font-mono font-semibold" style={{ color: "#1B3A5C" }}>{monedaSymbol} {fmt(totalProyectado)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span style={{ color: "#1B3A5C" }}>Desviación:</span>
                  <span className="font-mono" style={{ color: desviacion < 0 ? "#dc2626" : desviacion > 0 ? "#16a34a" : "#1B3A5C" }}>
                    {monedaSymbol} {fmt(desviacion)}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 min-h-[150px]">
            <p className="text-xs">Completa la Hoja 3 para generar la factura proyectada</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[8px] text-gray-400 border-t border-gray-200 pt-2 mt-auto">
        <span>Sergen Eficiencia Energética S.A.C. - Documento confidencial</span>
        <span>Página 6</span>
      </div>
    </div>
  );
};

export default ProyeccionPage;
