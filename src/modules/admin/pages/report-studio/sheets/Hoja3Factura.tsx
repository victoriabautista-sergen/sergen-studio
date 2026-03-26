import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useReportContext } from "../context/ReportContext";

const Hoja3Factura = () => {
  const { data, updateSheet } = useReportContext();
  const h3 = data.hoja3_data;

  const update = (field: string, value: any) => {
    updateSheet("hoja3_data", { ...h3, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Factura Emitida</h3>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Nombre concepto HP</Label>
          <Input value={h3.nombre_hp} onChange={e => update("nombre_hp", e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Nombre concepto HFP</Label>
          <Input value={h3.nombre_hfp} onChange={e => update("nombre_hfp", e.target.value)} className="h-8 text-sm" />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="otros_cargos"
            checked={h3.incluir_otros_cargos}
            onCheckedChange={v => update("incluir_otros_cargos", v)}
          />
          <Label htmlFor="otros_cargos" className="text-sm">Incluir otros cargos</Label>
        </div>

        <div>
          <Label className="text-xs">Número de Factura</Label>
          <Input value={h3.numero_factura} onChange={e => update("numero_factura", e.target.value)} className="h-8 text-sm" placeholder="F001-00123" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Precio HP Facturado</Label>
            <Input type="number" step="any" value={h3.precio_hp_facturado || ""} onChange={e => update("precio_hp_facturado", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Precio HFP Facturado</Label>
            <Input type="number" step="any" value={h3.precio_hfp_facturado || ""} onChange={e => update("precio_hfp_facturado", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
        </div>

        {h3.incluir_otros_cargos && (
          <div>
            <Label className="text-xs">Otros Cargos (S/)</Label>
            <Input type="number" step="any" value={h3.otros_cargos || ""} onChange={e => update("otros_cargos", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Hoja3Factura;
