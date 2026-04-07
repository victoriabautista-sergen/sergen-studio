import { useReportContext } from "../context/ReportContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import PortadaPage from "./pages/PortadaPage";
import PreciosPage from "./pages/PreciosPage";
import FacturaPage from "./pages/FacturaPage";
import ComparacionPage from "./pages/ComparacionPage";
import PotenciaPage from "./pages/PotenciaPage";
import ProyeccionPage from "./pages/ProyeccionPage";
import ConclusionesPage from "./pages/ConclusionesPage";
import React, { useRef, useCallback, useState, useMemo } from "react";
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

const PAGE_NAMES: Record<number, string> = {
  1: "Portada",
  2: "Precios",
  3: "Factura",
  4: "Comparación",
  5: "Potencia",
  6: "Proyección",
  7: "Conclusiones",
};

// Store the export function so the toolbar can call it
let _triggerExport: (() => Promise<void>) | null = null;
let _isExporting = false;
let _setExportingExternal: ((v: boolean) => void) | null = null;

const Navigation = () => {
  const { activeSheet, setActiveSheet, hiddenPages, togglePageVisibility } = useReportContext();
  const [exporting, setExporting] = useState(false);

  _setExportingExternal = setExporting;

  const visiblePages = useMemo(() => {
    return Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
  }, []);

  const visibleCount = TOTAL_PAGES - hiddenPages.size;
  const visibleIndex = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1)
    .filter(p => !hiddenPages.has(p))
    .indexOf(activeSheet);
  const displayPageNum = hiddenPages.has(activeSheet) ? "—" : visibleIndex + 1;

  const currentIndex = visiblePages.indexOf(activeSheet);
  const isCurrentHidden = hiddenPages.has(activeSheet);

  const goToPrev = () => {
    if (currentIndex > 0) setActiveSheet(visiblePages[currentIndex - 1]);
  };
  const goToNext = () => {
    if (currentIndex < TOTAL_PAGES - 1) setActiveSheet(visiblePages[currentIndex + 1]);
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="default" onClick={goToPrev} disabled={activeSheet === 1} className="gap-1">
        <ChevronLeft className="h-4 w-4" /> Anterior
      </Button>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Página {displayPageNum} de {visibleCount}
      </span>
      <Button variant="outline" size="default" onClick={goToNext} disabled={activeSheet === TOTAL_PAGES} className="gap-1">
        Siguiente <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant={isCurrentHidden ? "destructive" : "outline"}
        size="default"
        onClick={() => togglePageVisibility(activeSheet)}
        className="gap-1"
      >
        {isCurrentHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {isCurrentHidden ? "Incluir en PDF" : "Excluir del PDF"}
      </Button>
    </div>
  );
};

// Hidden component that renders ALL visible pages for PDF export
const AllPagesForExport = React.forwardRef<HTMLDivElement, { data: any; hiddenPages: Set<number> }>(({ data, hiddenPages }, ref) => {
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
      {Object.entries(pageComponents)
        .filter(([pageNum]) => !hiddenPages.has(Number(pageNum)))
        .map(([pageNum, Component]) => (
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
          <div style={{ padding: "24px 32px", minHeight: "800px" }}>
            <Component data={data} />
          </div>
        </div>
      ))}
    </div>
  );
});
AllPagesForExport.displayName = "AllPagesForExport";

const ReportPreview = ({ zoom = 1 }: { zoom?: number }) => {
  const { data, activeSheet, hiddenPages, togglePageVisibility } = useReportContext();
  const PageComponent = pageComponents[activeSheet];
  const allPagesRef = useRef<HTMLDivElement>(null);
  const isCurrentHidden = hiddenPages.has(activeSheet);

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
    <div className="flex flex-col items-center h-full overflow-auto p-6 relative">
      <div className="relative flex-shrink-0" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
        <div
          className="bg-white shadow-xl border rounded-sm"
          style={{
            width: "595px",
            minWidth: "595px",
            height: "1010px",
            fontFamily: "'Inter', sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="px-10 py-8" style={{ height: "100%" }}>
            {PageComponent ? <PageComponent data={data} /> : <p className="text-muted-foreground">Página no disponible</p>}
          </div>
        </div>
      </div>

      {/* Hidden: all visible pages rendered for PDF export */}
      <AllPagesForExport ref={allPagesRef} data={data} hiddenPages={hiddenPages} />
    </div>
  );
};

ReportPreview.Navigation = Navigation;

export const triggerPDFExport = () => _triggerExport?.();

export default ReportPreview;
