import { ReportData } from "../../types";

const PortadaPage = ({ data }: { data: ReportData }) => {
  const dg = data.datos_generales;

  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: "700px" }}>
      {/* Logo placeholder */}
      <div
        className="mb-8 flex items-center justify-center"
        style={{ width: "180px", height: "60px" }}
      >
        <span className="text-3xl font-bold" style={{ color: "#E8792B" }}>SERGEN</span>
      </div>

      <div className="w-full max-w-[380px] mx-auto space-y-6">
        <div className="border-t-2 border-b-2 py-6" style={{ borderColor: "#E8792B" }}>
          <h1 className="text-lg font-bold text-gray-800 tracking-wide uppercase">
            ANÁLISIS DE FACTURACIÓN
          </h1>
          <p className="text-sm text-gray-500 mt-1">Control de Demanda</p>
        </div>

        <div className="space-y-2">
          <p className="text-base font-semibold text-gray-700">{dg.client_name || "—"}</p>
          <p className="text-sm text-gray-500">{dg.concesionaria || "—"}</p>
        </div>

        <div className="space-y-1 text-sm text-gray-500">
          <p>{dg.numero_informe || "INF-000"}</p>
          <p className="uppercase">LIMA — {dg.mes} {dg.anio}</p>
        </div>
      </div>

      <div className="mt-12 text-[10px] text-gray-400">
        Sergen Eficiencia Energética S.A.C.
      </div>
    </div>
  );
};

export default PortadaPage;
