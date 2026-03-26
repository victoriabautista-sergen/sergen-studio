import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReportContext } from "../context/ReportContext";

const Hoja7Conclusiones = () => {
  const { data, updateSheet } = useReportContext();
  const h7 = data.hoja7_data;

  const update = (field: string, value: any) => {
    updateSheet("hoja7_data", { ...h7, [field]: value });
  };

  // Auto-generate conclusions
  useEffect(() => {
    const conclusions: string[] = [];
    if (data.hoja4_data.impacto_economico < 500) {
      conclusions.push("La facturación del período analizado se encuentra dentro de los parámetros esperados.");
    } else {
      conclusions.push(`Se identificó una diferencia de S/ ${data.hoja4_data.impacto_economico.toFixed(2)} en la facturación que requiere atención.`);
    }
    if (data.hoja6_data.diferencia > 0) {
      conclusions.push(`El ahorro potencial estimado con la optimización de potencia es de S/ ${data.hoja6_data.diferencia.toFixed(2)}.`);
    }
    if (h7.dias_modulados > 0) {
      conclusions.push(`Se realizaron ${h7.dias_modulados} días de modulación durante el período.`);
    }
    update("conclusiones_auto", conclusions);
  }, [data.hoja4_data.impacto_economico, data.hoja6_data.diferencia, h7.dias_modulados]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Modulaciones y Conclusiones</h3>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Días Modulados</Label>
            <Input type="number" value={h7.dias_modulados || ""} onChange={e => update("dias_modulados", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Días Libres</Label>
            <Input type="number" value={h7.dias_libres || ""} onChange={e => update("dias_libres", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Resumen de Modulación</Label>
          <Textarea
            value={h7.resumen_modulacion}
            onChange={e => update("resumen_modulacion", e.target.value)}
            className="text-sm min-h-[60px]"
            placeholder="Resumen del comportamiento de modulación del período..."
          />
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Conclusiones Automáticas</p>
          <div className="space-y-1">
            {h7.conclusiones_auto.map((c, i) => (
              <p key={i} className="text-sm bg-muted/30 rounded p-2">• {c}</p>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Conclusiones Adicionales</Label>
          <Textarea
            value={h7.conclusiones_manuales}
            onChange={e => update("conclusiones_manuales", e.target.value)}
            className="text-sm min-h-[80px]"
            placeholder="Agregar conclusiones adicionales..."
          />
        </div>
      </div>
    </div>
  );
};

export default Hoja7Conclusiones;
