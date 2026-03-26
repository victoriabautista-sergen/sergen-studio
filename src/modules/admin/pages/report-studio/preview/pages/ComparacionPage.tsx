import { ReportData } from "../../types";

const ComparacionPage = ({ data }: { data: ReportData }) => {
  const h4 = data.hoja4_data;

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-bold text-gray-800 uppercase border-b pb-2" style={{ borderColor: "#E8792B" }}>
        Comparación de Precios
      </h2>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ backgroundColor: "#E8792B" }}>
            <th className="border p-2 text-left text-white">Concepto</th>
            <th className="border p-2 text-right text-white">Calculado</th>
            <th className="border p-2 text-right text-white">Facturado</th>
            <th className="border p-2 text-right text-white">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2 text-gray-700">Precio HP</td>
            <td className="border p-2 text-right font-mono">{h4.precio_calculado_hp.toFixed(4)}</td>
            <td className="border p-2 text-right font-mono">{h4.precio_facturado_hp.toFixed(4)}</td>
            <td className={`border p-2 text-right font-mono font-bold ${h4.diferencia_hp > 0 ? "text-red-600" : "text-green-600"}`}>
              {h4.diferencia_hp.toFixed(4)}
            </td>
          </tr>
          <tr>
            <td className="border p-2 text-gray-700">Precio HFP</td>
            <td className="border p-2 text-right font-mono">{h4.precio_calculado_hfp.toFixed(4)}</td>
            <td className="border p-2 text-right font-mono">{h4.precio_facturado_hfp.toFixed(4)}</td>
            <td className={`border p-2 text-right font-mono font-bold ${h4.diferencia_hfp > 0 ? "text-red-600" : "text-green-600"}`}>
              {h4.diferencia_hfp.toFixed(4)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600">Impacto Económico Total</span>
          <span className="text-lg font-bold" style={{ color: "#E8792B" }}>
            S/ {h4.impacto_economico.toFixed(2)}
          </span>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Conclusión</p>
        <div className="bg-gray-50 border rounded p-3 text-xs text-gray-700 leading-relaxed">
          {h4.conclusion || "—"}
        </div>
      </div>
    </div>
  );
};

export default ComparacionPage;
