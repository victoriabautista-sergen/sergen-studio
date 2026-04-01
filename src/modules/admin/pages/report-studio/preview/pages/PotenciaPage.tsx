import { ReportData } from "../../types";

const PotenciaPage = ({ data }: { data: ReportData }) => {
  const h5 = data.hoja5_data;
  const dg = data.datos_generales;

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesIndex = meses.indexOf(dg.mes || "");
  const mesAnterior = mesIndex > 0 ? meses[mesIndex - 1] : mesIndex === 0 ? "Diciembre" : dg.mes;
  const anioAnterior = mesIndex === 0 ? Number(dg.anio) - 1 : dg.anio;

  const borderStyle = "border border-gray-300";

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-xs font-semibold mt-4 mb-3" style={{ color: "#1B3A5C" }}>
          II. POTENCIA COINCIDENTE
        </h1>

        <p className="text-[10px] mb-3" style={{ color: "#1B3A5C" }}>
          Para el periodo <strong>{mesAnterior?.toLowerCase()} {anioAnterior}</strong> la potencia coincidente publicada por el COES fue la siguiente:
        </p>

        {/* Multi-header table matching reference */}
        <table className="w-full text-[9px] border-collapse mb-4" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr style={{ backgroundColor: "#e5e7eb" }}>
              <th className={`${borderStyle} px-1.5 py-1 text-center font-semibold`} style={{ color: "#1B3A5C" }} colSpan={2}>Máxima demanda en hora punta</th>
              <th className={`${borderStyle} px-1.5 py-1 text-center font-semibold`} style={{ color: "#1B3A5C" }} colSpan={2}>Interconexión</th>
              <th className={`${borderStyle} px-1.5 py-1 text-center font-semibold`} style={{ color: "#1B3A5C" }} rowSpan={2}>SEIN<br/>MW</th>
            </tr>
            <tr style={{ backgroundColor: "#e5e7eb" }}>
              <th className={`${borderStyle} px-1.5 py-1 text-center font-semibold`} style={{ color: "#1B3A5C" }}>Fecha</th>
              <th className={`${borderStyle} px-1.5 py-1 text-center font-semibold`} style={{ color: "#1B3A5C" }}>Hora</th>
              <th className={`${borderStyle} px-1.5 py-1 text-center font-semibold`} style={{ color: "#1B3A5C" }}>PER-ECU Exportación MW</th>
              <th className={`${borderStyle} px-1.5 py-1 text-center font-semibold`} style={{ color: "#1B3A5C" }}>ECU-PER Importación MW</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className={`${borderStyle} px-1.5 py-1 text-center`} style={{ color: "#1B3A5C" }}>{h5.fecha || "—"}</td>
              <td className={`${borderStyle} px-1.5 py-1 text-center`} style={{ color: "#1B3A5C" }}>{h5.hora || "—"}</td>
              <td className={`${borderStyle} px-1.5 py-1 text-center font-mono`} style={{ color: "#1B3A5C" }}>{h5.exportacion ? h5.exportacion.toFixed(3) : "0.000"}</td>
              <td className={`${borderStyle} px-1.5 py-1 text-center font-mono`} style={{ color: "#1B3A5C" }}>{h5.importacion ? h5.importacion.toFixed(3) : "0.000"}</td>
              <td className={`${borderStyle} px-1.5 py-1 text-center font-mono`} style={{ color: "#1B3A5C" }}>{h5.sein_mw ? h5.sein_mw.toFixed(2) : "—"}</td>
            </tr>
          </tbody>
        </table>

        <p className="text-[10px] mb-3" style={{ color: "#1B3A5C" }}>
          De las facturas analizadas de <strong>{dg.client_name || "—"}</strong> tenemos el siguiente cuadro:
        </p>

        {/* Potencia coincidente promedio box */}
        <div className="flex justify-between items-center rounded px-3 py-2" style={{ backgroundColor: "#eef3f8", border: "1px solid #d0d8e0" }}>
          <span className="text-[10px] font-semibold" style={{ color: "#1B3A5C" }}>
            POTENCIA COINCIDENTE PROMEDIO DEL CLIENTE (kW):
          </span>
          <span className="text-sm font-bold font-mono" style={{ color: "#E8792B" }}>
            {h5.potencia_coincidente_promedio ? h5.potencia_coincidente_promedio.toFixed(2) : "—"}
          </span>
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
