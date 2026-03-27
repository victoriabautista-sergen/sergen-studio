import { useState, useRef, useCallback, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import AdminShell from "../../components/AdminShell";
import { CotizacionProvider, useCotizacionContext } from "./context/CotizacionContext";
import CotizacionEditor from "./editor/CotizacionEditor";
import CotizacionPreview from "./preview/CotizacionPreview";
import { generateCotizacionPDF } from "./utils/pdfExport";

const A4_W = 595;
const A4_H = 842;
const PAD = 48; // px padding around the sheet

const CotizacionContent = () => {
  const { advanceCorrelative } = useCotizacionContext();
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const computeScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const availW = container.clientWidth - PAD * 2;
    const availH = container.clientHeight - PAD * 2;
    const s = Math.min(availW / A4_W, availH / A4_H, 1.6);
    setScale(Math.max(s, 0.4));
  }, []);

  useEffect(() => {
    computeScale();
    const ro = new ResizeObserver(computeScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [computeScale]);

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
              <span className="text-xs text-muted-foreground">{Math.round(scale * 100)}%</span>
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
            <div ref={containerRef} className="flex-1 overflow-auto flex items-start justify-center" style={{ padding: `${PAD}px` }}>
              <div
                style={{
                  transform: `scale(${scale})`,
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
