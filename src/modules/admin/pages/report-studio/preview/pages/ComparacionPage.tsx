import { ReportData } from "../../types";

const ComparacionPage = ({ data }: { data: ReportData }) => {
  const h4 = data.hoja4_data;
  const borderStyle = "border border-[#E8792B]/50";

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-xs font-semibold mt-4 mb-4" style={{ color: "#1B3A5C" }}>
          III. COMPARACIÓN DE PRECIOS
        </h1>

        <table className="w-full text-xs border-collapse" style={{ border: "1px solid rgba(232, 121, 43, 0.5)" }}>
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className={`${borderStyle} p-2 text-left text-white`}>Concepto</th>
              <th className={`${borderStyle} p-2 text-right text-white`}>Calculado</th>
              <th className={`${borderStyle} p-2 text-right text-white`}>Facturado</th>
              <th className={`${borderStyle} p-2 text-right text-white`}>Diferencia</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${borderStyle} p-2`} style={{ color: "#1B3A5C" }}>Precio HP</td>
              <td className={`${borderStyle} p-2 text-right font-mono`} style={{ color: "#1B3A5C" }}>{h4.precio_calculado_hp.toFixed(4)}</td>
              <td className={`${borderStyle} p-2 text-right font-mono`} style={{ color: "#1B3A5C" }}>{h4.precio_facturado_hp.toFixed(4)}</td>
              <td className={`${borderStyle} p-2 text-right font-mono font-bold ${h4.diferencia_hp > 0 ? "text-red-600" : "text-green-600"}`}>
                {h4.diferencia_hp.toFixed(4)}
              </td>
            </tr>
            <tr>
              <td className={`${borderStyle} p-2`} style={{ color: "#1B3A5C" }}>Precio HFP</td>
              <td className={`${borderStyle} p-2 text-right font-mono`} style={{ color: "#1B3A5C" }}>{h4.precio_calculado_hfp.toFixed(4)}</td>
              <td className={`${borderStyle} p-2 text-right font-mono`} style={{ color: "#1B3A5C" }}>{h4.precio_facturado_hfp.toFixed(4)}</td>
              <td className={`${borderStyle} p-2 text-right font-mono font-bold ${h4.diferencia_hfp > 0 ? "text-red-600" : "text-green-600"}`}>
                {h4.diferencia_hfp.toFixed(4)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="bg-gray-50 border rounded-lg p-4 space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">Impacto Económico Total</span>
            <span className="text-lg font-bold" style={{ color: "#E8792B" }}>
              S/ {h4.impacto_economico.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Conclusión</p>
          <div className="bg-gray-50 border rounded p-3 text-xs text-gray-700 leading-relaxed">
            {h4.conclusion || "—"}
          </div>
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
