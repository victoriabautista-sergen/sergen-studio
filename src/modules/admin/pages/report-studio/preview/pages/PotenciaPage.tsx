import { ReportData } from "../../types";

const PotenciaPage = ({ data }: { data: ReportData }) => {
  const h5 = data.hoja5_data;
  const orangeTableStyle = { border: "1px solid #E8792B", borderCollapse: "collapse" as const };
  const orangeCellStyle = (isLast = false) => ({ color: "#1B3A5C", borderBottom: isLast ? "none" : "1px solid #E8792B" });

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-xs font-semibold mt-4 mb-4" style={{ color: "#1B3A5C" }}>
          IV. POTENCIA COINCIDENTE
        </h1>

        <table className="w-full text-xs" style={orangeTableStyle}>
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className="p-2 text-left text-white font-semibold">Parámetro</th>
              <th className="p-2 text-right text-white font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows = [
                ["Fecha", h5.fecha || "—"],
                ["Hora", h5.hora || "—"],
                ["SEIN (MW)", h5.sein_mw ? h5.sein_mw.toFixed(2) : "—"],
                ["Importación (MW)", h5.importacion ? h5.importacion.toFixed(2) : "—"],
                ["Exportación (MW)", h5.exportacion ? h5.exportacion.toFixed(2) : "—"],
              ];
              return rows.map(([label, val], i) => (
                <tr key={String(label)} className="bg-white">
                  <td className="p-2" style={orangeCellStyle(i === rows.length - 1)}>{label}</td>
                  <td className="p-2 text-right font-mono" style={orangeCellStyle(i === rows.length - 1)}>{val}</td>
                </tr>
              ));
            })()}
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
