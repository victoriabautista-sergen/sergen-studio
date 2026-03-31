import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { useReportContext } from "../context/ReportContext";
import { useEffect } from "react";

const Hoja2Precios = () => {
  const { data, updateSheet } = useReportContext();
  const h2 = data.hoja2_data;

  const update = (field: string, value: number | string) => {
    updateSheet("hoja2_data", { ...h2, [field]: value });
  };

  const monedaSymbol = h2.moneda === "USD" ? "$" : "S/";
  const pngBaseSymbol = (h2.png_moneda || "USD") === "USD" ? "$" : "S/";
  const pngActualSymbol = (h2.png_actual_moneda || h2.png_moneda || "USD") === "USD" ? "$" : "S/";

  // Auto-calculate prices
  useEffect(() => {
    if (h2.pngo > 0 && h2.tco > 0 && h2.ippo > 0) {
      const factorE = (h2.png_actual / h2.pngo) * (h2.tc_actual / h2.tco) * (h2.ipp_actual / h2.ippo);
      const factor = factorE * h2.factor_perdida;
      const hp = +(h2.precio_base_hp * factor).toFixed(4);
      const hfp = +(h2.precio_base_hfp * factor).toFixed(4);
      const calcHp = +(hp / 1000).toFixed(5);
      const calcHfp = +(hfp / 1000).toFixed(5);
      const fe = +factorE.toFixed(4);
      if (hp !== h2.precio_actualizado_hp || hfp !== h2.precio_actualizado_hfp || fe !== h2.factor_e || calcHp !== h2.precio_calculado_hp || calcHfp !== h2.precio_calculado_hfp) {
        updateSheet("hoja2_data", {
          ...h2,
          factor_e: fe,
          precio_actualizado_hp: hp,
          precio_actualizado_hfp: hfp,
          precio_calculado_hp: calcHp,
          precio_calculado_hfp: calcHfp,
        });
      }
    }
  }, [h2.precio_base_hp, h2.precio_base_hfp, h2.pngo, h2.tco, h2.ippo, h2.png_actual, h2.tc_actual, h2.ipp_actual, h2.factor_perdida]);

  const numField = (label: string, field: string, val: number, prefix?: string) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{prefix}</span>
        )}
        <Input
          type="number"
          step="any"
          value={val || ""}
          onChange={e => update(field, parseFloat(e.target.value) || 0)}
          className={`h-8 text-sm ${prefix ? "pl-8" : ""}`}
        />
      </div>
    </div>
  );

  const CurrencySwitch = ({ field, checked }: { field: string; checked: boolean }) => (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground">S/</span>
      <Switch
        checked={checked}
        onCheckedChange={(c) => update(field, c ? "USD" : "PEN")}
        className="scale-75"
      />
      <span className="text-[10px] text-muted-foreground">$</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Actualización de Precio</h3>

      {/* Moneda general */}
      <div>
        <Label className="text-xs">Moneda del Contrato</Label>
        <Select value={h2.moneda} onValueChange={(v) => update("moneda", v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PEN">S/ Soles</SelectItem>
            <SelectItem value="USD">$ Dólares</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* CAJA 1: Valores Base */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Valores Base</p>
        <div className="grid grid-cols-2 gap-2">
          {numField("Precio Base HP", "precio_base_hp", h2.precio_base_hp, monedaSymbol)}
          {numField("Precio Base HFP", "precio_base_hfp", h2.precio_base_hfp, monedaSymbol)}
          {numField("Precio Potencia", "precio_potencia", h2.precio_potencia, monedaSymbol)}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">PNGo</Label>
            <CurrencySwitch field="png_moneda" checked={(h2.png_moneda || "USD") === "USD"} />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{pngBaseSymbol}</span>
            <Input
              type="number"
              step="any"
              value={h2.pngo || ""}
              onChange={e => update("pngo", parseFloat(e.target.value) || 0)}
              className="h-8 text-sm pl-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {numField("TCo", "tco", h2.tco)}
          {numField("IPPo", "ippo", h2.ippo)}
        </div>
      </div>

      {/* CAJA 2: Valores Actuales */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Valores Actuales</p>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">PNG</Label>
            <CurrencySwitch field="png_actual_moneda" checked={(h2.png_actual_moneda || h2.png_moneda || "USD") === "USD"} />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{pngActualSymbol}</span>
            <Input
              type="number"
              step="any"
              value={h2.png_actual || ""}
              onChange={e => update("png_actual", parseFloat(e.target.value) || 0)}
              className="h-8 text-sm pl-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {numField("TC", "tc_actual", h2.tc_actual)}
          {numField("IPP", "ipp_actual", h2.ipp_actual)}
        </div>
      </div>

      {/* CAJA 3: Fórmula (visual) */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Fórmula (Visual)</p>
        <p className="text-[10px] text-muted-foreground">Este texto es solo descriptivo y no afecta el cálculo. Cada empresa puede usar nombres o siglas diferentes.</p>
        <div>
          <Label className="text-xs">Texto de la fórmula</Label>
          <textarea
            value={h2.formula}
            onChange={e => update("formula", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px] resize-y"
          />
        </div>
      </div>

      {/* CAJA 4: Cálculo */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Cálculo</p>
        
        <div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Fórmula de cálculo</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-xs space-y-1.5" side="right">
                <p className="font-semibold text-foreground mb-2">Siglas de la fórmula</p>
                <div className="space-y-1 text-muted-foreground">
                  <p><strong className="text-foreground">PB</strong> — Precio Base (HP o HFP)</p>
                  <p><strong className="text-foreground">PB<sub>HP</sub></strong> — Precio Base Hora Punta</p>
                  <p><strong className="text-foreground">PB<sub>HFP</sub></strong> — Precio Base Hora Fuera de Punta</p>
                  <p><strong className="text-foreground">PNG</strong> — Precio del Gas Natural (actual)</p>
                  <p><strong className="text-foreground">PNGo</strong> — Precio del Gas Natural (base)</p>
                  <p><strong className="text-foreground">TC</strong> — Tipo de Cambio (actual)</p>
                  <p><strong className="text-foreground">TCo</strong> — Tipo de Cambio (base)</p>
                  <p><strong className="text-foreground">IPP</strong> — Índice de Precios al Productor (actual)</p>
                  <p><strong className="text-foreground">IPPo</strong> — Índice de Precios al Productor (base)</p>
                  <p><strong className="text-foreground">FP</strong> — Factor de Pérdida</p>
                </div>
                <div className="mt-2 pt-2 border-t text-muted-foreground">
                  <p className="text-[10px]">El cálculo se aplica por separado a cada precio base (HP y HFP).</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-[9px] text-muted-foreground mb-1">Se calcula independientemente para HP y HFP. Edita el texto descriptivo abajo.</p>
          <textarea
            value={h2.formula_calculo || ""}
            onChange={e => update("formula_calculo", e.target.value)}
            className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] resize-y"
            placeholder={"Factor_E = (PNG / PNG_o) × (TC / TC_o) × (IPP / IPP_o)\nPA_HP = PB_HP × Factor_E × FP\n..."}
          />
        </div>

        {numField("Factor de Pérdida", "factor_perdida", h2.factor_perdida)}

        <div className="bg-background rounded-lg p-3 space-y-1 border">
          <p className="text-xs font-medium text-muted-foreground">Resultados ({monedaSymbol})</p>
          <div className="flex justify-between text-sm">
            <span>Precio Actualizado HP:</span>
            <span className="font-semibold text-primary">{monedaSymbol} {h2.precio_actualizado_hp.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Precio Actualizado HFP:</span>
            <span className="font-semibold text-primary">{monedaSymbol} {h2.precio_actualizado_hfp.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Precio Calculado HP:</span>
            <span className="font-semibold text-primary">{monedaSymbol} {h2.precio_calculado_hp?.toFixed(5) || "0.00000"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Precio Calculado HFP:</span>
            <span className="font-semibold text-primary">{monedaSymbol} {h2.precio_calculado_hfp?.toFixed(5) || "0.00000"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hoja2Precios;
