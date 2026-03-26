import { ReportData } from "../../types";
import sergenLogo from "@/assets/sergen-logo.png";

const PortadaPage = ({ data }: { data: ReportData }) => {
  const dg = data.datos_generales;
  const codigoInforme = `CS ${dg.numero_informe || "001"}-${String(data.mes).padStart(2, "0")}-${data.anio}`;

  return (
    <div
      className="relative flex flex-col items-center justify-between"
      style={{
        minHeight: "700px",
        background: "linear-gradient(180deg, #ffffff 0%, #f8f9fc 100%)",
      }}
    >
      {/* Top spacer */}
      <div className="flex-1" />

      {/* Logo */}
      <div className="flex flex-col items-center">
        <div
          className="flex items-center justify-center"
          style={{
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,121,43,0.08) 0%, transparent 70%)",
          }}
        >
          <img
            src={sergenLogo}
            alt="Sergen Logo"
            style={{ width: "160px", objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Title block */}
      <div className="flex flex-col items-center mt-12" style={{ gap: "12px" }}>
        <div
          style={{
            width: "60px",
            height: "3px",
            background: "#E8792B",
            borderRadius: "2px",
          }}
        />
        <h1
          className="text-2xl font-bold tracking-widest"
          style={{
            color: "#1a2744",
            letterSpacing: "0.15em",
          }}
        >
          ANÁLISIS DE FACTURACIÓN
        </h1>
        <p
          className="text-lg font-semibold tracking-wide"
          style={{ color: "#1a2744" }}
        >
          {dg.client_name || "CLIENTE"}
        </p>
      </div>

      {/* Report code in orange */}
      <div className="mt-10">
        <span
          className="text-sm font-bold tracking-wider"
          style={{
            color: "#E8792B",
            letterSpacing: "0.2em",
          }}
        >
          {codigoInforme}
        </span>
      </div>

      <div className="flex-1" />

      {/* Footer: Location + Year */}
      <p
        className="text-sm font-medium pb-6 tracking-wide"
        style={{ color: "#1a2744" }}
      >
        LIMA-{data.anio}
      </p>
    </div>
  );
};

export default PortadaPage;
