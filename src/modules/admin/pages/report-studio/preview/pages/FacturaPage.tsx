import { ReportData } from "../../types";

const FacturaPage = ({ data }: { data: ReportData }) => {
  const h3 = data.hoja3_data;
  const dg = data.datos_generales;

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-bold text-gray-800 uppercase border-b pb-2" style={{ borderColor: "#E8792B" }}>
        Factura Emitida
      </h2>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-gray-500">Cliente</p>
            <p className="font-medium text-gray-800">{dg.client_name || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">N° Factura</p>
            <p className="font-medium text-gray-800">{h3.numero_factura || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Período</p>
            <p className="font-medium text-gray-800">{dg.mes} {dg.anio}</p>
          </div>
          <div>
            <p className="text-gray-500">Concesionaria</p>
            <p className="font-medium text-gray-800">{dg.concesionaria || "—"}</p>
          </div>
        </div>

        <table className="w-full text-xs border-collapse mt-4">
          <thead>
            <tr style={{ backgroundColor: "#E8792B" }}>
              <th className="border p-2 text-left text-white">Concepto</th>
              <th className="border p-2 text-right text-white">Precio (ctm S//kWh)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2 text-gray-700">{h3.nombre_hp}</td>
              <td className="border p-2 text-right font-mono">{h3.precio_hp_facturado.toFixed(4)}</td>
            </tr>
            <tr>
              <td className="border p-2 text-gray-700">{h3.nombre_hfp}</td>
              <td className="border p-2 text-right font-mono">{h3.precio_hfp_facturado.toFixed(4)}</td>
            </tr>
            {h3.incluir_otros_cargos && (
              <tr>
                <td className="border p-2 text-gray-700">Otros Cargos</td>
                <td className="border p-2 text-right font-mono">S/ {h3.otros_cargos.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FacturaPage;
