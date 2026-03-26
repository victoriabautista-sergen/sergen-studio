import { ReportData } from "../../types";
import sergenLogo from "@/assets/sergen-logo.png";

const PortadaPage = ({ data }: { data: ReportData }) => {
  const dg = data.datos_generales;
  const codigoInforme = `CS ${dg.numero_informe || "001"}-${String(data.mes).padStart(2, "0")}-${data.anio}`;

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: "700px", fontFamily: "sans-serif" }}
    >
      {/* Logo top-left area, centered horizontally */}
      <div className="flex justify-center pt-10">
        <img
          src={sergenLogo}
          alt="Sergen Logo"
          style={{ width: "200px", objectFit: "contain" }}
        />
      </div>

      {/* Spacer */}
      <div style={{ flex: "1 1 0", minHeight: "120px" }} />

      {/* Title block - centered */}
      <div className="flex flex-col items-center" style={{ gap: "16px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#1a2744",
            letterSpacing: "0.02em",
            margin: 0,
          }}
        >
          ANÁLISIS DE FACTURACIÓN
        </h1>
        <p
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#1a2744",
            margin: 0,
          }}
        >
          {dg.client_name || "CLIENTE"}
        </p>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 400,
            color: "#888",
            margin: 0,
            marginTop: "8px",
          }}
        >
          {codigoInforme}
        </p>
      </div>

      {/* Large spacer to push footer down */}
      <div style={{ flex: "2 1 0", minHeight: "200px" }} />

      {/* Footer */}
      <div className="flex justify-center pb-8">
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#1a2744",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          LIMA-{data.anio}
        </p>
      </div>
    </div>
  );
};

export default PortadaPage;
