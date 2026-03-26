import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReportContext } from "../context/ReportContext";
import { useEffect } from "react";

const Hoja2Precios = () => {
  const { data, updateSheet } = useReportContext();
  const h2 = data.hoja2_data;

  const update = (field: string, value: number | string) => {
    updateSheet("hoja2_data", { ...h2, [field]: value });
  };

  // Auto-calculate prices
  useEffect(() => {
    if (h2.pngo > 0 && h2.tco > 0 && h2.ippo > 0) {
      const factor = (h2.png_actual / h2.pngo) * (h2.tc_actual / h2.tco) * (h2.ipp_actual / h2.ippo) * h2.factor_perdida;
      const hp = +(h2.precio_base_hp * factor).toFixed(4);
      const hfp = +(h2.precio_base_hfp * factor).toFixed(4);
      if (hp !== h2.precio_actualizado_hp || hfp !== h2.precio_actualizado_hfp) {
        updateSheet("hoja2_data", {
          ...h2,
          precio_actualizado_hp: hp,
          precio_actualizado_hfp: hfp,
        });
      }
    }
  }, [h2.precio_base_hp, h2.precio_base_hfp, h2.pngo, h2.tco, h2.ippo, h2.png_actual, h2.tc_actual, h2.ipp_actual, h2.factor_perdida]);

  const numField = (label: string, field: string, val: number) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step="any"
        value={val || ""}
        onChange={e => update(field, parseFloat(e.target.value) || 0)}
        className="h-8 text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Actualización de Precio</h3>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase">Valores Base</p>
        <div className="grid grid-cols-2 gap-2">
          {numField("Precio Base HP", "precio_base_hp", h2.precio_base_hp)}
          {numField("Precio Base HFP", "precio_base_hfp", h2.precio_base_hfp)}
          {numField("PNGo", "pngo", h2.pngo)}
          {numField("TCo", "tco", h2.tco)}
          {numField("IPPo", "ippo", h2.ippo)}
        </div>

        <p className="text-xs font-medium text-muted-foreground uppercase mt-3">Valores Actuales</p>
        <div className="grid grid-cols-3 gap-2">
          {numField("PNG", "png_actual", h2.png_actual)}
          {numField("TC", "tc_actual", h2.tc_actual)}
          {numField("IPP", "ipp_actual", h2.ipp_actual)}
        </div>

        <p className="text-xs font-medium text-muted-foreground uppercase mt-3">Cálculo</p>
        {numField("Factor de Pérdida", "factor_perdida", h2.factor_perdida)}

        <div>
          <Label className="text-xs">Fórmula</Label>
          <Input
            value={h2.formula}
            onChange={e => update("formula", e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Resultados</p>
          <div className="flex justify-between text-sm">
            <span>Precio Actualizado HP:</span>
            <span className="font-semibold text-primary">{h2.precio_actualizado_hp.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Precio Actualizado HFP:</span>
            <span className="font-semibold text-primary">{h2.precio_actualizado_hfp.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hoja2Precios;
