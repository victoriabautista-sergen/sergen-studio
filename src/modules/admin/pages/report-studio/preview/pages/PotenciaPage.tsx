import { ReportData } from "../../types";

const PotenciaPage = ({ data }: { data: ReportData }) => {
  const h5 = data.hoja5_data;
  const borderStyle = "border border-[#E8792B]/50";

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-xs font-semibold mt-4 mb-4" style={{ color: "#1B3A5C" }}>
          IV. POTENCIA COINCIDENTE
        </h1>

        <table className="w-full text-xs border-collapse" style={{ border: "1px solid rgba(232, 121, 43, 0.5)" }}>
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className={`${borderStyle} p-2 text-left text-white`}>Parámetro</th>
              <th className={`${borderStyle} p-2 text-right text-white`}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Fecha", h5.fecha || "—"],
              ["Hora", h5.hora || "—"],
              ["SEIN (MW)", h5.sein_mw ? h5.sein_mw.toFixed(2) : "—"],
              ["Importación (MW)", h5.importacion ? h5.importacion.toFixed(2) : "—"],
              ["Exportación (MW)", h5.exportacion ? h5.exportacion.toFixed(2) : "—"],
            ].map(([label, val]) => (
              <tr key={String(label)}>
                <td className={`${borderStyle} p-2`} style={{ color: "#1B3A5C" }}>{label}</td>
                <td className={`${borderStyle} p-2 text-right font-mono`} style={{ color: "#1B3A5C" }}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bg-gray-50 border rounded-lg p-4 text-center space-y-1 mt-4">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Potencia Coincidente Promedio</p>
          <p className="text-2xl font-bold" style={{ color: "#E8792B" }}>
            {h5.potencia_coincidente_promedio ? `${h5.potencia_coincidente_promedio.toFixed(2)} kW` : "— kW"}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[8px] text-gray-400 border-t border-gray-200 pt-2 mt-auto">
        <span>Sergen Eficiencia Energética S.A.C. - Documento confidencial</span>
        <span>Página 5</span>
      </div>
    </div>
  );
};

export default PotenciaPage;
