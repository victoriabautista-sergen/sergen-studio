import { ReportData } from "../../types";

const ConclusionesPage = ({ data }: { data: ReportData }) => {
  const h7 = data.hoja7_data;

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-bold text-gray-800 uppercase border-b pb-2" style={{ borderColor: "#E8792B" }}>
        Modulaciones y Conclusiones
      </h2>

      {/* Modulation summary */}
      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Resumen de Modulación</p>
        <div className="flex gap-6 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-xs text-gray-700">Días modulados: <strong>{h7.dias_modulados}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-xs text-gray-700">Días libres: <strong>{h7.dias_libres}</strong></span>
          </div>
        </div>
        {h7.resumen_modulacion && (
          <div className="bg-gray-50 border rounded p-3 text-xs text-gray-700 leading-relaxed">
            {h7.resumen_modulacion}
          </div>
        )}
      </div>

      {/* Conclusions */}
      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Conclusiones</p>
        <div className="space-y-2">
          {h7.conclusiones_auto.map((c, i) => (
            <div key={i} className="flex gap-2 text-xs text-gray-700">
              <span className="font-bold" style={{ color: "#E8792B" }}>{i + 1}.</span>
              <span>{c}</span>
            </div>
          ))}
          {h7.conclusiones_manuales && (
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-gray-700 whitespace-pre-line">{h7.conclusiones_manuales}</p>
            </div>
          )}
        </div>
      </div>

      {/* Signature area */}
      <div className="mt-16 pt-8 border-t border-gray-300 space-y-8">
        <div className="flex justify-between">
          <div className="text-center">
            <div className="w-40 border-b border-gray-400 mb-1" />
            <p className="text-[10px] text-gray-500">Elaborado por</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-gray-400 mb-1" />
            <p className="text-[10px] text-gray-500">Revisado por</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConclusionesPage;
