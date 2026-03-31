import { ReportData } from "../../types";

const FacturaPage = ({ data }: { data: ReportData }) => {
  const h3 = data.hoja3_data;
  const dg = data.datos_generales;
  const borderStyle = "border border-[#E8792B]/50";

  return (
    <div className="flex flex-col h-full text-[10px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-xs font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        <h1 className="text-xs font-semibold mt-4 mb-4" style={{ color: "#1B3A5C" }}>
          II. FACTURA EMITIDA
        </h1>

        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div>
            <p className="text-gray-500">Cliente</p>
            <p className="font-medium" style={{ color: "#1B3A5C" }}>{dg.client_name || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">N° Factura</p>
            <p className="font-medium" style={{ color: "#1B3A5C" }}>{h3.numero_factura || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Período</p>
            <p className="font-medium" style={{ color: "#1B3A5C" }}>{dg.mes} {dg.anio}</p>
          </div>
          <div>
            <p className="text-gray-500">Concesionaria</p>
            <p className="font-medium" style={{ color: "#1B3A5C" }}>{dg.concesionaria || "—"}</p>
          </div>
        </div>

        <table className="w-full text-xs border-collapse" style={{ border: "1px solid rgba(232, 121, 43, 0.5)" }}>
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className={`${borderStyle} p-2 text-left text-white`}>Concepto</th>
              <th className={`${borderStyle} p-2 text-right text-white`}>Precio (ctm S//kWh)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${borderStyle} p-2`} style={{ color: "#1B3A5C" }}>{h3.nombre_hp}</td>
              <td className={`${borderStyle} p-2 text-right font-mono`} style={{ color: "#1B3A5C" }}>{h3.precio_hp_facturado.toFixed(4)}</td>
            </tr>
            <tr>
              <td className={`${borderStyle} p-2`} style={{ color: "#1B3A5C" }}>{h3.nombre_hfp}</td>
              <td className={`${borderStyle} p-2 text-right font-mono`} style={{ color: "#1B3A5C" }}>{h3.precio_hfp_facturado.toFixed(4)}</td>
            </tr>
            {h3.incluir_otros_cargos && (
              <tr>
                <td className={`${borderStyle} p-2`} style={{ color: "#1B3A5C" }}>Otros Cargos</td>
                <td className={`${borderStyle} p-2 text-right font-mono`} style={{ color: "#1B3A5C" }}>S/ {h3.otros_cargos.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
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
