import { ReportData } from "../../types";

const PotenciaPage = ({ data }: { data: ReportData }) => {
  const h5 = data.hoja5_data;

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-bold text-gray-800 uppercase border-b pb-2" style={{ borderColor: "#E8792B" }}>
        Potencia Coincidente
      </h2>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ backgroundColor: "#E8792B" }}>
            <th className="border p-2 text-left text-white">Parámetro</th>
            <th className="border p-2 text-right text-white">Valor</th>
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
              <td className="border p-2 text-gray-700">{label}</td>
              <td className="border p-2 text-right font-mono">{val}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bg-gray-50 border rounded-lg p-4 text-center space-y-1">
        <p className="text-[10px] text-gray-500 uppercase font-semibold">Potencia Coincidente Promedio</p>
        <p className="text-2xl font-bold" style={{ color: "#E8792B" }}>
          {h5.potencia_coincidente_promedio ? `${h5.potencia_coincidente_promedio.toFixed(2)} kW` : "— kW"}
        </p>
      </div>
    </div>
  );
};

export default PotenciaPage;
