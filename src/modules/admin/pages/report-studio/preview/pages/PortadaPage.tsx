import { ReportData } from "../../types";
import sergenLogo from "@/assets/sergen-logo.png";

const PortadaPage = ({ data }: { data: ReportData }) => {
  const dg = data.datos_generales;
  const codigoInforme = `CS ${dg.numero_informe || "001"}-${String(data.mes).padStart(2, "0")}-${data.anio}`;

  return (
    <div
      className="flex flex-col items-center"
      style={{ minHeight: "700px", fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Logo centered */}
      <div className="flex justify-center pt-10">
        <img
          src={sergenLogo}
          alt="Sergen Logo"
          style={{ width: "280px", objectFit: "contain" }}
        />
      </div>

      {/* Spacer - bigger to push content down */}
      <div style={{ flex: "1.3 1 0", minHeight: "130px" }} />

      {/* Title block */}
      <div className="flex flex-col items-center" style={{ gap: "14px" }}>
        <h1
          style={{
            fontSize: "23px",
            fontWeight: 600,
            color: "#1a2744",
            letterSpacing: "0.01em",
            margin: 0,
          }}
        >
          ANÁLISIS DE FACTURACIÓN
        </h1>
        <h2
          style={{
            fontSize: "23px",
            fontWeight: 600,
            color: "#1a2744",
            letterSpacing: "0.01em",
            margin: 0,
          }}
        >
          {dg.client_name || "CLIENTE"}
        </h2>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 400,
            color: "#999",
            margin: 0,
            marginTop: "6px",
          }}
        >
          {codigoInforme}
        </p>
      </div>

      {/* Large spacer */}
      <div style={{ flex: "2.5 1 0", minHeight: "220px" }} />

      {/* Footer */}
      <p
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#1a2744",
          letterSpacing: "0.06em",
          margin: 0,
          paddingBottom: "16px",
        }}
      >
        LIMA-{data.anio}
      </p>
    </div>
  );
};

export default PortadaPage;
