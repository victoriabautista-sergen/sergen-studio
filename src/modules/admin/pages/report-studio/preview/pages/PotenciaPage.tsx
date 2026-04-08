import { ReportData } from "../../types";
import { format, parse } from "date-fns";

const PotenciaPage = ({ data, pageNumber }: { data: ReportData; pageNumber?: number }) => {
  const h5 = data.hoja5_data;
  const dg = data.datos_generales;

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesIndex = meses.indexOf(dg.mes || "");
  const mesAnterior = mesIndex > 0 ? meses[mesIndex - 1] : mesIndex === 0 ? "Diciembre" : dg.mes;
  const anioAnterior = mesIndex === 0 ? Number(dg.anio) - 1 : dg.anio;

  const borderStyle = "border border-gray-300";

  return (
    <div className="flex flex-col h-full text-[12px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-[14px] font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-[14px] font-semibold mt-4 mb-3" style={{ color: "#1B3A5C" }}>
          II. POTENCIA COINCIDENTE
        </h1>

        <p className="text-[12px] mb-3" style={{ color: "#1B3A5C" }}>
          Para el periodo <strong>{mesAnterior?.toLowerCase()} {anioAnterior}</strong> la potencia coincidente publicada por el COES fue la siguiente:
        </p>

        {/* Multi-header table matching reference */}
        <table className="w-full text-[11px] border-collapse mb-4" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th className={`${borderStyle} px-1.5 py-1 text-center font-semibold`} style={{ color: "#1B3A5C" }} colSpan={2}>Máxima demanda en hora punta</th>
              <th className={`${borderStyle} px-1.5 py-1 text-center font-semibold`} style={{ color: "#1B3A5C" }} colSpan={2}>Interconexión</th>
              <th className={`${borderStyle} px-1.5 py-1 text-center font-semibold`} style={{ color: "#1B3A5C" }} rowSpan={2}>SEIN<br/>MW</th>
            </tr>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
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

        <p className="text-[12px] mb-3" style={{ color: "#1B3A5C" }}>
          De las facturas analizadas de <strong>{dg.client_name || "—"}</strong> tenemos el siguiente cuadro:
        </p>

        {/* Potencia coincidente promedio box */}
        <div className="flex justify-between items-center rounded px-3 py-2" style={{ backgroundColor: "#f3f4f6", border: "1px solid #d0d8e0" }}>
          <span className="text-[12px] font-semibold" style={{ color: "#1B3A5C" }}>
            POTENCIA COINCIDENTE PROMEDIO DEL CLIENTE (kW):
          </span>
          <span className="text-[16px] font-bold font-mono" style={{ color: "#E8792B" }}>
            {h5.potencia_coincidente_promedio ? h5.potencia_coincidente_promedio.toFixed(2) : "—"}
          </span>
        </div>

        {/* Evidencia de alerta */}
        {h5.evidencia_alerta_url && (
          <div className="mt-4">
            <p className="text-[12px] mb-2 font-semibold" style={{ color: "#1B3A5C" }}>
              Evidencia de envío de alerta:
            </p>
            <img
              src={h5.evidencia_alerta_url}
              alt="Evidencia de envío de alerta"
              className="w-full max-h-[600px] object-contain border border-gray-300 rounded"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pdf-footer flex justify-between text-[11px] text-gray-500 border-t border-gray-200 pt-2 mt-auto">
        <span>Sergen Eficiencia Energética S.A.C. - Documento confidencial</span>
        <span>Página {pageNumber ?? 5}</span>
      </div>
    </div>
  );
};

export default PotenciaPage;
