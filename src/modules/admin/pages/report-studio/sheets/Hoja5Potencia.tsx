import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReportContext } from "../context/ReportContext";

const Hoja5Potencia = () => {
  const { data, updateSheet } = useReportContext();
  const h5 = data.hoja5_data;

  const update = (field: string, value: any) => {
    updateSheet("hoja5_data", { ...h5, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Potencia Coincidente</h3>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Fecha</Label>
            <Input type="date" value={h5.fecha} onChange={e => update("fecha", e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Hora</Label>
            <Input value={h5.hora} onChange={e => update("hora", e.target.value)} className="h-8 text-sm" placeholder="18:30" />
          </div>
        </div>

        <div>
          <Label className="text-xs">SEIN (MW)</Label>
          <Input type="number" step="any" value={h5.sein_mw || ""} onChange={e => update("sein_mw", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Importación (MW)</Label>
            <Input type="number" step="any" value={h5.importacion || ""} onChange={e => update("importacion", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Exportación (MW)</Label>
            <Input type="number" step="any" value={h5.exportacion || ""} onChange={e => update("exportacion", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
        </div>

        <div className="pt-2 border-t">
          <Label className="text-xs">Potencia Coincidente Promedio (kW)</Label>
          <Input
            type="number"
            step="any"
            value={h5.potencia_coincidente_promedio || ""}
            onChange={e => update("potencia_coincidente_promedio", parseFloat(e.target.value) || 0)}
            className="h-8 text-sm font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default Hoja5Potencia;
