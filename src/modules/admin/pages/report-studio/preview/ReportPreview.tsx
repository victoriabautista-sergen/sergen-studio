import { useReportContext } from "../context/ReportContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PortadaPage from "./pages/PortadaPage";
import PreciosPage from "./pages/PreciosPage";
import FacturaPage from "./pages/FacturaPage";
import ComparacionPage from "./pages/ComparacionPage";
import PotenciaPage from "./pages/PotenciaPage";
import ProyeccionPage from "./pages/ProyeccionPage";
import ConclusionesPage from "./pages/ConclusionesPage";

const TOTAL_PAGES = 7;

// Shared state for navigation between toolbar and preview
let _setPageExternal: ((fn: (p: number) => number) => void) | null = null;
let _getPage: (() => number) | null = null;

const Navigation = () => {
  // This is rendered in the toolbar; it communicates with the preview via shared ref
  const [page, setPage] = useState(1);

  // Sync with preview
  _setPageExternal = setPage as any;
  _getPage = () => page;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1) as any)} disabled={page === 1} className="gap-1">
        <ChevronLeft className="h-3.5 w-3.5" /> Anterior
      </Button>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Página {page} de {TOTAL_PAGES}
      </span>
      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(TOTAL_PAGES, p + 1) as any)} disabled={page === TOTAL_PAGES} className="gap-1">
        Siguiente <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

const ReportPreview = () => {
  const { data } = useReportContext();
  const page = _getPage ? _getPage() : 1;

  const pages = [
    <PortadaPage key={1} data={data} />,
    <PreciosPage key={2} data={data} />,
    <FacturaPage key={3} data={data} />,
    <ComparacionPage key={4} data={data} />,
    <PotenciaPage key={5} data={data} />,
    <ProyeccionPage key={6} data={data} />,
    <ConclusionesPage key={7} data={data} />,
  ];

  return (
    <div className="flex items-start justify-center h-full overflow-auto p-6">
      <div
        className="bg-white shadow-xl border rounded-sm"
        style={{
          width: "595px",
          minHeight: "842px",
          fontFamily: "'Inter', sans-serif",
          position: "relative",
        }}
      >
        {/* Content */}
        <div className="px-10 py-8" style={{ minHeight: "800px" }}>
          {pages[page - 1]}
        </div>
      </div>
    </div>
  );
};

ReportPreview.Navigation = Navigation;

export default ReportPreview;
