import { ReportData } from "../../types";
import sergenLogo from "@/assets/sergen-logo.png";

const PortadaPage = ({ data }: { data: ReportData }) => {
  const dg = data.datos_generales;
  const codigoInforme = `CS ${dg.numero_informe || "001"}-${String(data.mes).padStart(2, "0")}-${data.anio}`;

  return (
    <div className="flex flex-col items-center justify-between text-center" style={{ minHeight: "700px" }}>
      {/* Top spacer */}
      <div />

      {/* Logo */}
      <div className="flex flex-col items-center gap-16">
        <img src={sergenLogo} alt="Sergen Logo" style={{ width: "280px" }} />

        {/* Title block */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold tracking-wide" style={{ color: "#1a2744" }}>
            ANÁLISIS DE FACTURACIÓN
          </h1>
          <p className="text-base font-semibold" style={{ color: "#1a2744" }}>
            {dg.client_name || "CLIENTE"}
          </p>
        </div>

        {/* Report code */}
        <p className="text-sm" style={{ color: "#E8792B" }}>
          {codigoInforme}
        </p>
      </div>

      {/* Bottom: Location + Year */}
      <p className="text-sm font-medium pb-4" style={{ color: "#1a2744" }}>
        LIMA-{data.anio}
      </p>
    </div>
  );
};

export default PortadaPage;
