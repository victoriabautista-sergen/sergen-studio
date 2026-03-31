import { useState } from "react";
import { Download, ZoomIn, ZoomOut, RotateCcw, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import AdminShell from "../../components/AdminShell";
import { ReportProvider, useReportContext } from "./context/ReportContext";
import ReportPreview, { triggerPDFExport } from "./preview/ReportPreview";
import Hoja1DatosGenerales from "./sheets/Hoja1DatosGenerales";
import Hoja2Precios from "./sheets/Hoja2Precios";
import Hoja3Factura from "./sheets/Hoja3Factura";
import Hoja4Comparacion from "./sheets/Hoja4Comparacion";
import Hoja5Potencia from "./sheets/Hoja5Potencia";
import Hoja6Proyeccion from "./sheets/Hoja6Proyeccion";
import Hoja7Conclusiones from "./sheets/Hoja7Conclusiones";

const SHEETS = [
  { id: 1, label: "Hoja 1", title: "Datos Generales", icon: "📁" },
  { id: 2, label: "Hoja 2", title: "Precios", icon: "💰" },
  { id: 3, label: "Hoja 3", title: "Factura", icon: "🧾" },
  { id: 4, label: "Hoja 4", title: "Comparación", icon: "📊" },
  { id: 5, label: "Hoja 5", title: "Potencia", icon: "⚡" },
  { id: 6, label: "Hoja 6", title: "Proyección", icon: "📈" },
  { id: 7, label: "Hoja 7", title: "Conclusiones", icon: "✅" },
];

const sheetComponents: Record<number, React.FC> = {
  1: Hoja1DatosGenerales,
  2: Hoja2Precios,
  3: Hoja3Factura,
  4: Hoja4Comparacion,
  5: Hoja5Potencia,
  6: Hoja6Proyeccion,
  7: Hoja7Conclusiones,
};

const ReportStudioContent = () => {
  const { data, activeSheet, setActiveSheet, saving, updateSheet } = useReportContext();
  const ActiveComponent = sheetComponents[activeSheet];

  const [downloading, setDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleZoomReset = () => setZoom(1);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await triggerPDFExport();
      // Incrementar correlativo después de descargar
      const currentNum = parseInt(data.datos_generales.numero_informe) || 0;
      const nextNum = (currentNum + 1).toString().padStart(2, "0");
      updateSheet("datos_generales", {
        ...data.datos_generales,
        numero_informe: nextNum,
      });
    } finally {
      setDownloading(false);
    }
  };

  const currentSheet = SHEETS.find(s => s.id === activeSheet);

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden bg-muted/30 rounded-lg">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left panel - Editor */}
        <ResizablePanel defaultSize={32} minSize={30} maxSize={50}>
          <div className="flex flex-col h-full bg-card">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-xl font-bold text-foreground">Generador de Reporte</h2>
              <p className="text-sm text-muted-foreground">Informes de análisis de facturación</p>
            </div>

            <div className="px-5 pb-3">
            <div className="flex flex-wrap gap-2">
                {SHEETS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSheet(s.id)}
                    className={`px-4 py-2 text-base rounded-md transition-colors font-medium ${
                      activeSheet === s.id
                        ? "bg-[#1a2744] text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 pb-2 flex items-center gap-2">
              <span className="text-lg">{currentSheet?.icon}</span>
              <span className="text-base font-semibold text-foreground">{currentSheet?.title}</span>
              {saving && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5 min-w-0">
              <div className="bg-white rounded-lg border p-4 overflow-hidden">
                <ActiveComponent />
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={68} minSize={40}>
          <div className="flex flex-col h-full bg-muted/20">
            <div className="border-b bg-card px-4 py-2 flex items-center justify-between shrink-0">
              <ReportPreview.Navigation />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="default" className="gap-1" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="default" className="gap-1" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="default" onClick={handleZoomReset}>Reset</Button>
                <Button size="default" onClick={handleDownloadPDF} disabled={downloading} className="gap-2 bg-[#E8792B] hover:bg-[#d06a22] text-white">
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {downloading ? "Generando..." : "Descargar PDF"}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <ReportPreview zoom={zoom} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

const ReportStudioCDPage = () => {
  const breadcrumbs = [
    { label: "Configuración", href: "/admin-panel/configuracion" },
    { label: "Control de Demanda", href: "/admin-panel/modulos/energy-intelligence" },
    { label: "Generador de Reporte" },
  ];

  return (
    <AdminShell breadcrumbs={breadcrumbs} fullWidth>
      <ReportProvider>
        <ReportStudioContent />
      </ReportProvider>
    </AdminShell>
  );
};

export default ReportStudioCDPage;
