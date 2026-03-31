import { ReportData } from "../../types";

const ProyeccionPage = ({ data }: { data: ReportData }) => {
  const h6 = data.hoja6_data;
  const borderStyle = "border border-[#E8792B]/50";

  const renderTable = (title: string, items: typeof h6.items_original, total: number) => (
    <div>
      <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">{title}</p>
      <table className="w-full text-xs border-collapse" style={{ border: "1px solid rgba(232, 121, 43, 0.5)" }}>
        <thead>
          <tr style={{ backgroundColor: "#E8792B" }}>
            <th className={`${borderStyle} p-1.5 text-left text-white`}>Concepto</th>
            <th className={`${borderStyle} p-1.5 text-right text-white`}>Cant.</th>
            <th className={`${borderStyle} p-1.5 text-right text-white`}>P. Unit.</th>
            <th className={`${borderStyle} p-1.5 text-right text-white`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className={`${borderStyle} p-1.5`} style={{ color: "#1B3A5C" }}>{item.concepto || "—"}</td>
              <td className={`${borderStyle} p-1.5 text-right font-mono`} style={{ color: "#1B3A5C" }}>{item.cantidad}</td>
              <td className={`${borderStyle} p-1.5 text-right font-mono`} style={{ color: "#1B3A5C" }}>{item.precio_unitario.toFixed(4)}</td>
              <td className={`${borderStyle} p-1.5 text-right font-mono font-medium`} style={{ color: "#1B3A5C" }}>{item.total.toFixed(2)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className={`${borderStyle} p-1.5`} style={{ color: "#1B3A5C" }} colSpan={3}>Total</td>
            <td className={`${borderStyle} p-1.5 text-right font-mono`} style={{ color: "#1B3A5C" }}>S/ {total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-xs font-semibold mt-4 mb-4" style={{ color: "#1B3A5C" }}>
          V. FACTURA PROYECTADA
        </h1>

        <div className="text-xs mb-4" style={{ color: "#1B3A5C" }}>
          <span className="font-medium">Potencia promedio aplicada: </span>
          <span className="font-bold" style={{ color: "#E8792B" }}>{h6.potencia_promedio.toFixed(2)} kW</span>
        </div>

        <div className="space-y-4">
          {renderTable("Factura Original", h6.items_original, h6.total_original)}
          {renderTable("Factura Proyectada", h6.items_proyectado, h6.total_proyectado)}
        </div>

        <div className="bg-gray-50 border rounded-lg p-4 flex items-center justify-between mt-4">
          <span className="text-xs font-semibold text-gray-600">Diferencia (Ahorro Potencial)</span>
          <span className={`text-lg font-bold ${h6.diferencia > 0 ? "text-green-600" : "text-red-600"}`}>
            S/ {h6.diferencia.toFixed(2)}
          </span>
        </div>
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
