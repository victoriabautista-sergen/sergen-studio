import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReportContext } from "../context/ReportContext";

const Hoja4Comparacion = () => {
  const { data, updateSheet } = useReportContext();
  const h4 = data.hoja4_data;

  // Auto-calculate from hoja2 and hoja3
  useEffect(() => {
    const calc_hp = data.hoja2_data.precio_actualizado_hp;
    const calc_hfp = data.hoja2_data.precio_actualizado_hfp;
    const fact_hp = data.hoja3_data.precio_hp_facturado;
    const fact_hfp = data.hoja3_data.precio_hfp_facturado;
    const diff_hp = +(fact_hp - calc_hp).toFixed(4);
    const diff_hfp = +(fact_hfp - calc_hfp).toFixed(4);
    const impacto = +(Math.abs(diff_hp) + Math.abs(diff_hfp)).toFixed(2);
    const conclusion = impacto < 500
      ? "La facturación se encuentra correctamente realizada. La diferencia está dentro del margen aceptable."
      : "Se detecta una diferencia significativa en la facturación. Se recomienda revisión detallada con la concesionaria.";

    updateSheet("hoja4_data", {
      precio_calculado_hp: calc_hp,
      precio_calculado_hfp: calc_hfp,
      precio_facturado_hp: fact_hp,
      precio_facturado_hfp: fact_hfp,
      diferencia_hp: diff_hp,
      diferencia_hfp: diff_hfp,
      impacto_economico: impacto,
      conclusion,
    });
  }, [data.hoja2_data.precio_actualizado_hp, data.hoja2_data.precio_actualizado_hfp, data.hoja3_data.precio_hp_facturado, data.hoja3_data.precio_hfp_facturado]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Comparación</h3>

      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
          <span>Concepto</span><span className="text-center">Calculado</span><span className="text-center">Facturado</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <span>HP</span>
          <span className="text-center">{h4.precio_calculado_hp.toFixed(4)}</span>
          <span className="text-center">{h4.precio_facturado_hp.toFixed(4)}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <span>HFP</span>
          <span className="text-center">{h4.precio_calculado_hfp.toFixed(4)}</span>
          <span className="text-center">{h4.precio_facturado_hfp.toFixed(4)}</span>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Diferencias</p>
        <div className="flex justify-between text-sm">
          <span>Diferencia HP:</span>
          <span className={h4.diferencia_hp > 0 ? "text-destructive font-semibold" : "text-green-600 font-semibold"}>
            {h4.diferencia_hp.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Diferencia HFP:</span>
          <span className={h4.diferencia_hfp > 0 ? "text-destructive font-semibold" : "text-green-600 font-semibold"}>
            {h4.diferencia_hfp.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-1 border-t">
          <span className="font-medium">Impacto Económico:</span>
          <span className="font-bold text-primary">S/ {h4.impacto_economico.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <Label className="text-xs">Conclusión</Label>
        <p className="text-sm bg-muted/30 rounded-lg p-3 mt-1">{h4.conclusion}</p>
      </div>
    </div>
  );
};

export default Hoja4Comparacion;
