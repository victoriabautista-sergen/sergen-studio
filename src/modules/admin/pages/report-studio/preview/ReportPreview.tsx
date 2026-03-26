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

const ReportPreview = () => {
  const { data } = useReportContext();
  const [page, setPage] = useState(1);

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
    <div className="flex flex-col items-center h-full">
      {/* A4 page container */}
      <div className="flex-1 overflow-auto w-full flex justify-center p-4">
        <div
          className="bg-white shadow-xl border rounded-sm"
          style={{
            width: "595px",
            minHeight: "842px",
            fontFamily: "'Inter', sans-serif",
            position: "relative",
          }}
        >
          {/* Header */}
          <div className="px-10 pt-4 pb-2 border-b border-gray-200 flex items-center justify-between text-[9px] text-gray-400">
            <span>Sergen Eficiencia Energética</span>
            <span>Documento confidencial</span>
          </div>

          {/* Content */}
          <div className="px-10 py-6" style={{ minHeight: "750px" }}>
            {pages[page - 1]}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 px-10 py-3 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-400">
            <span>Documento confidencial</span>
            <span>Página {page} de {TOTAL_PAGES}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 py-3 border-t bg-card w-full justify-center">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {page} de {TOTAL_PAGES}
        </span>
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(TOTAL_PAGES, p + 1))} disabled={page === TOTAL_PAGES}>
          Siguiente <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default ReportPreview;
