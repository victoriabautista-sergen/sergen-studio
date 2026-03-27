import { useState, useRef } from "react";
import { Download, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import AdminShell from "../../components/AdminShell";
import { CotizacionProvider, useCotizacionContext } from "./context/CotizacionContext";
import CotizacionEditor from "./editor/CotizacionEditor";
import CotizacionPreview from "./preview/CotizacionPreview";
import { generateCotizacionPDF } from "./utils/pdfExport";

const ZOOM_STEPS = [50, 60, 70, 80, 90, 100, 110, 120, 130, 150];

const CotizacionContent = () => {
  const { advanceCorrelative } = useCotizacionContext();
  const [downloading, setDownloading] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(3); // 80% default
  const zoom = ZOOM_STEPS[zoomIndex];
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    setDownloading(true);
    try {
      await generateCotizacionPDF(previewRef.current, previewRef.current.dataset.filename || "cotizacion.pdf");
      await advanceCorrelative();
    } finally {
      setDownloading(false);
    }
  };

  const zoomIn = () => setZoomIndex(prev => Math.min(prev + 1, ZOOM_STEPS.length - 1));
  const zoomOut = () => setZoomIndex(prev => Math.max(prev - 1, 0));
  const zoomReset = () => setZoomIndex(3);

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden bg-muted/30 rounded-lg">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left panel - Editor */}
        <ResizablePanel defaultSize={35} minSize={28} maxSize={50}>
          <div className="flex flex-col h-full bg-card">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-xl font-bold text-foreground">Cotización</h2>
              <p className="text-sm text-muted-foreground">Generador de cotizaciones</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <div className="bg-white rounded-lg border p-4">
                <CotizacionEditor />
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel - Preview */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="flex flex-col h-full bg-muted/20">
            {/* Toolbar */}
            <div className="border-b bg-card px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={zoomOut} disabled={zoomIndex === 0}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
                <Button variant="outline" size="sm" onClick={zoomIn} disabled={zoomIndex === ZOOM_STEPS.length - 1}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={zoomReset}>Reset</Button>
              </div>
              <Button
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="gap-2 bg-[#E8792B] hover:bg-[#d06a22] text-white"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading ? "Generando..." : "Descargar PDF"}
              </Button>
            </div>

            {/* Preview area */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-6">
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  transition: "transform 0.2s ease",
                }}
              >
                <div className="shadow-xl border rounded-sm">
                  <CotizacionPreview ref={previewRef} />
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

const CotizacionPage = () => {
  const breadcrumbs = [
    { label: "Admin Panel", href: "/admin-panel" },
    { label: "Cotización" },
  ];

  return (
    <AdminShell breadcrumbs={breadcrumbs} fullWidth>
      <CotizacionProvider>
        <CotizacionContent />
      </CotizacionProvider>
    </AdminShell>
  );
};

export default CotizacionPage;
