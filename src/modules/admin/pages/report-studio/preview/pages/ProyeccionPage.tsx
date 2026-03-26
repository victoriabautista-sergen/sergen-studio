import { ReportData } from "../../types";

const ProyeccionPage = ({ data }: { data: ReportData }) => {
  const h6 = data.hoja6_data;

  const renderTable = (title: string, items: typeof h6.items_original, total: number) => (
    <div>
      <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">{title}</p>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border p-1.5 text-left text-gray-600">Concepto</th>
            <th className="border p-1.5 text-right text-gray-600">Cant.</th>
            <th className="border p-1.5 text-right text-gray-600">P. Unit.</th>
            <th className="border p-1.5 text-right text-gray-600">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="border p-1.5 text-gray-700">{item.concepto || "—"}</td>
              <td className="border p-1.5 text-right font-mono">{item.cantidad}</td>
              <td className="border p-1.5 text-right font-mono">{item.precio_unitario.toFixed(4)}</td>
              <td className="border p-1.5 text-right font-mono font-medium">{item.total.toFixed(2)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="border p-1.5 text-gray-800" colSpan={3}>Total</td>
            <td className="border p-1.5 text-right font-mono">S/ {total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-bold text-gray-800 uppercase border-b pb-2" style={{ borderColor: "#E8792B" }}>
        Factura Proyectada
      </h2>

      <div className="text-xs text-gray-600">
        <span className="font-medium">Potencia promedio aplicada: </span>
        <span className="font-bold" style={{ color: "#E8792B" }}>{h6.potencia_promedio.toFixed(2)} kW</span>
      </div>

      {renderTable("Factura Original", h6.items_original, h6.total_original)}
      {renderTable("Factura Proyectada", h6.items_proyectado, h6.total_proyectado)}

      <div className="bg-gray-50 border rounded-lg p-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">Diferencia (Ahorro Potencial)</span>
        <span className={`text-lg font-bold ${h6.diferencia > 0 ? "text-green-600" : "text-red-600"}`}>
          S/ {h6.diferencia.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ProyeccionPage;
