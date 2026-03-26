import { ReportData } from "../../types";

const PreciosPage = ({ data }: { data: ReportData }) => {
  const h2 = data.hoja2_data;

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-bold text-gray-800 uppercase border-b pb-2" style={{ borderColor: "#E8792B" }}>
        Actualización de Precio de Energía
      </h2>

      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Valores Base del Contrato</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-1.5 text-left text-gray-600">Parámetro</th>
              <th className="border p-1.5 text-right text-gray-600">Valor</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Precio Base HP", h2.precio_base_hp],
              ["Precio Base HFP", h2.precio_base_hfp],
              ["PNGo", h2.pngo],
              ["TCo", h2.tco],
              ["IPPo", h2.ippo],
            ].map(([label, val]) => (
              <tr key={String(label)}>
                <td className="border p-1.5 text-gray-700">{label}</td>
                <td className="border p-1.5 text-right font-mono">{Number(val).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Valores Actuales</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-1.5 text-left text-gray-600">Parámetro</th>
              <th className="border p-1.5 text-right text-gray-600">Valor</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["PNG", h2.png_actual],
              ["TC", h2.tc_actual],
              ["IPP", h2.ipp_actual],
              ["Factor de Pérdida", h2.factor_perdida],
            ].map(([label, val]) => (
              <tr key={String(label)}>
                <td className="border p-1.5 text-gray-700">{label}</td>
                <td className="border p-1.5 text-right font-mono">{Number(val).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Fórmula de Cálculo</p>
        <div className="bg-gray-50 border rounded p-2 text-xs font-mono text-gray-700 text-center">
          {h2.formula}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Resultado</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className="border p-1.5 text-left text-white">Precio</th>
              <th className="border p-1.5 text-right text-white">Valor Actualizado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-1.5 font-medium text-gray-700">HP (ctm S//kWh)</td>
              <td className="border p-1.5 text-right font-mono font-bold">{h2.precio_actualizado_hp.toFixed(4)}</td>
            </tr>
            <tr>
              <td className="border p-1.5 font-medium text-gray-700">HFP (ctm S//kWh)</td>
              <td className="border p-1.5 text-right font-mono font-bold">{h2.precio_actualizado_hfp.toFixed(4)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreciosPage;
