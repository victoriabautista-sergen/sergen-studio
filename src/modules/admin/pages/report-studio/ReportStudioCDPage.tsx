import { useState } from "react";
import { Download, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminShell from "../../components/AdminShell";
import { ReportProvider, useReportContext } from "./context/ReportContext";
import ReportPreview from "./preview/ReportPreview";
import Hoja1DatosGenerales from "./sheets/Hoja1DatosGenerales";
import Hoja2Precios from "./sheets/Hoja2Precios";
import Hoja3Factura from "./sheets/Hoja3Factura";
import Hoja4Comparacion from "./sheets/Hoja4Comparacion";
import Hoja5Potencia from "./sheets/Hoja5Potencia";
import Hoja6Proyeccion from "./sheets/Hoja6Proyeccion";
import Hoja7Conclusiones from "./sheets/Hoja7Conclusiones";

const SHEETS = [
  { id: 1, label: "Hoja 1", title: "Datos Generales" },
  { id: 2, label: "Hoja 2", title: "Precios" },
  { id: 3, label: "Hoja 3", title: "Factura" },
  { id: 4, label: "Hoja 4", title: "Comparación" },
  { id: 5, label: "Hoja 5", title: "Potencia" },
  { id: 6, label: "Hoja 6", title: "Proyección" },
  { id: 7, label: "Hoja 7", title: "Conclusiones" },
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
  const { activeSheet, setActiveSheet, saving } = useReportContext();
  const ActiveComponent = sheetComponents[activeSheet];

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 border rounded-lg overflow-hidden bg-card">
      {/* Left panel - Editor */}
      <div className="w-[30%] min-w-[320px] border-r flex flex-col">
        {/* Sheet tabs */}
        <div className="border-b bg-muted/30 px-2 py-1.5 flex gap-1 overflow-x-auto shrink-0">
          {SHEETS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSheet(s.id)}
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                activeSheet === s.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Sheet title */}
        <div className="px-4 py-2 border-b bg-muted/10 flex items-center justify-between shrink-0">
          <span className="text-xs text-muted-foreground">
            {SHEETS.find(s => s.id === activeSheet)?.title}
          </span>
          {saving && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
            </span>
          )}
        </div>

        {/* Sheet content */}
        <div className="flex-1 overflow-y-auto p-4">
          <ActiveComponent />
        </div>
      </div>

      {/* Right panel - Preview */}
      <div className="flex-1 flex flex-col bg-muted/20">
        {/* Toolbar */}
        <div className="border-b bg-card px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-sm font-medium text-foreground">Vista Previa</span>
          <Button size="sm" onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" /> Descargar PDF
          </Button>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden">
          <ReportPreview />
        </div>
      </div>
    </div>
  );
};

const ReportStudioCDPage = () => {
  const breadcrumbs = [
    { label: "Configuración", href: "/admin-panel/configuracion" },
    { label: "Control de Demanda", href: "/admin-panel/modulos/energy-intelligence" },
    { label: "Report Studio" },
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
