import { ReportData } from "../../types";

const FacturaPage = ({ data }: { data: ReportData }) => {
  const h3 = data.hoja3_data;
  const dg = data.datos_generales;

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesIndex = meses.indexOf(dg.mes || "");
  const mesAnterior = mesIndex > 0 ? meses[mesIndex - 1] : mesIndex === 0 ? "Diciembre" : dg.mes;
  const anioAnterior = mesIndex === 0 ? Number(dg.anio) - 1 : dg.anio;

  const isPdf = h3.factura_file_url?.toLowerCase().endsWith(".pdf");

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-xs font-semibold mt-4 mb-3" style={{ color: "#1B3A5C" }}>
          II. FACTURA EMITIDA
        </h1>

        <p className="text-[9px] mb-4" style={{ color: "#1B3A5C" }}>
          Se presenta la factura <strong>{h3.numero_factura || "[N° Factura]"}</strong> de fecha <strong>{h3.fecha_factura || "[Fecha]"}</strong>, correspondiente al periodo de <strong>{mesAnterior?.toLowerCase()} del {anioAnterior}</strong>, con los importes originales emitidos por <strong>{dg.concesionaria || "[Concesionaria]"}</strong>.
        </p>

        {/* Invoice display */}
        {h3.factura_file_url ? (
          isPdf ? (
            <div className="border border-gray-200 rounded overflow-hidden" style={{ height: "680px" }}>
              <iframe
                src={h3.factura_file_url}
                className="w-full h-full"
                title="Factura original"
                style={{ border: "none" }}
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded overflow-hidden">
              <img
                src={h3.factura_file_url}
                alt="Factura original"
                className="w-full object-contain"
                style={{ maxHeight: "680px" }}
              />
            </div>
          )
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
            <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs">Sube una factura en el editor para mostrarla aquí</p>
          </div>
        )}

        {h3.factura_file_url && (
          <p className="text-[8px] italic text-gray-400 text-right mt-1">
            Fuente: Factura emitida por {dg.concesionaria || "[Concesionaria]"}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[8px] text-gray-400 border-t border-gray-200 pt-2 mt-auto">
        <span>Sergen Eficiencia Energética S.A.C. - Documento confidencial</span>
        <span>Página 3</span>
      </div>
    </div>
  );
};

export default FacturaPage;
