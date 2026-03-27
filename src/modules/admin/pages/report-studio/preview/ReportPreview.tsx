import { useReportContext } from "../context/ReportContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PortadaPage from "./pages/PortadaPage";
import PreciosPage from "./pages/PreciosPage";
import FacturaPage from "./pages/FacturaPage";
import ComparacionPage from "./pages/ComparacionPage";
import PotenciaPage from "./pages/PotenciaPage";
import ProyeccionPage from "./pages/ProyeccionPage";
import ConclusionesPage from "./pages/ConclusionesPage";
import React, { useRef, useCallback, useState } from "react";
import { generateReportPDF } from "../utils/pdfExport";

const TOTAL_PAGES = 7;

const pageComponents: Record<number, React.FC<{ data: any }>> = {
  1: PortadaPage,
  2: PreciosPage,
  3: FacturaPage,
  4: ComparacionPage,
  5: PotenciaPage,
  6: ProyeccionPage,
  7: ConclusionesPage,
};

// Store the export function so the toolbar can call it
let _triggerExport: (() => Promise<void>) | null = null;
let _isExporting = false;
let _setExportingExternal: ((v: boolean) => void) | null = null;

const Navigation = () => {
  const { activeSheet, setActiveSheet } = useReportContext();
  const [exporting, setExporting] = useState(false);

  _setExportingExternal = setExporting;

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="default" onClick={() => setActiveSheet(Math.max(1, activeSheet - 1))} disabled={activeSheet === 1} className="gap-1">
        <ChevronLeft className="h-4 w-4" /> Anterior
      </Button>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Página {activeSheet} de {TOTAL_PAGES}
      </span>
      <Button variant="outline" size="default" onClick={() => setActiveSheet(Math.min(TOTAL_PAGES, activeSheet + 1))} disabled={activeSheet === TOTAL_PAGES} className="gap-1">
        Siguiente <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Hidden component that renders ALL pages for PDF export
const AllPagesForExport = React.forwardRef<HTMLDivElement, { data: any }>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      {Object.entries(pageComponents).map(([pageNum, Component]) => (
        <div
          key={pageNum}
          data-pdf-page={pageNum}
          style={{
            width: "595px",
            height: "842px",
            backgroundColor: "#ffffff",
            fontFamily: "'Inter', sans-serif",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div style={{ padding: "32px 40px", minHeight: "800px" }}>
            <Component data={data} />
          </div>
        </div>
      ))}
    </div>
  );
});
AllPagesForExport.displayName = "AllPagesForExport";

const ReportPreview = () => {
  const { data, activeSheet } = useReportContext();
  const PageComponent = pageComponents[activeSheet];
  const allPagesRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    if (!allPagesRef.current || _isExporting) return;
    _isExporting = true;
    _setExportingExternal?.(true);
    try {
      const clientName = data.datos_generales?.client_name || "reporte";
      const mes = data.datos_generales?.mes || "";
      const anio = data.datos_generales?.anio || "";
      const filename = `Reporte_${clientName}_${mes}_${anio}.pdf`.replace(/\s+/g, "_");
      await generateReportPDF(allPagesRef.current, filename);
    } finally {
      _isExporting = false;
      _setExportingExternal?.(false);
    }
  }, [data]);

  _triggerExport = handleExport;

  return (
    <div className="flex items-start justify-center h-full overflow-auto p-6 relative">
      <div
        className="bg-white shadow-xl border rounded-sm"
        style={{
          width: "595px",
          minHeight: "842px",
          fontFamily: "'Inter', sans-serif",
          position: "relative",
        }}
      >
        <div className="px-10 py-8" style={{ minHeight: "800px" }}>
          <PageComponent data={data} />
        </div>
      </div>

      {/* Hidden: all pages rendered for PDF export */}
      <AllPagesForExport ref={allPagesRef} data={data} />
    </div>
  );
};

ReportPreview.Navigation = Navigation;

export const triggerPDFExport = () => _triggerExport?.();

export default ReportPreview;
