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
import React from "react";

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

const Navigation = () => {
  const { activeSheet, setActiveSheet } = useReportContext();

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

const ReportPreview = () => {
  const { data, activeSheet } = useReportContext();
  const PageComponent = pageComponents[activeSheet];

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
        <div className="px-10 py-8" style={{ minHeight: "800px" }}>
          <PageComponent data={data} />
        </div>
      </div>
    </div>
  );
};

ReportPreview.Navigation = Navigation;

export default ReportPreview;
