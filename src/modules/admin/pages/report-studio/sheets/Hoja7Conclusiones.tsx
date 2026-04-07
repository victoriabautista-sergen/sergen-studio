import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useReportContext } from "../context/ReportContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MESES } from "../types";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

const Hoja7Conclusiones = () => {
  const { data, updateSheet } = useReportContext();
  const h7 = data.hoja7_data;
  const dg = data.datos_generales;
  const [nuevaConclusion, setNuevaConclusion] = useState("");
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const update = (field: string, value: any) => {
    updateSheet("hoja7_data", { ...h7, [field]: value });
  };

  // Get previous month based on report date
  const getPreviousMonth = useCallback(() => {
    const mesIndex = MESES.indexOf(dg.mes || "");
    const year = parseInt(dg.anio) || new Date().getFullYear();
    const month = mesIndex >= 0 ? mesIndex : new Date().getMonth();
    const reportDate = new Date(year, month, 1);
    return subMonths(reportDate, 1);
  }, [dg.mes, dg.anio]);

  // Fetch modulation data from DB
  const fetchModulationData = useCallback(async () => {
    setLoadingCalendar(true);
    try {
      const prevMonth = getPreviousMonth();
      const start = format(startOfMonth(prevMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(prevMonth), 'yyyy-MM-dd');

      const { data: modData, error } = await supabase
        .from('modulation_days')
        .select('date, is_modulated')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      if (error) throw error;

      const days = (modData as any[]) || [];
      const modulados = days.filter(d => d.is_modulated).length;
      const libres = days.filter(d => !d.is_modulated).length;

      updateSheet("hoja7_data", {
        ...h7,
        modulation_days: days,
        dias_modulados: modulados,
        dias_libres: libres,
      });
      toast.success(`Calendario cargado: ${modulados} días modulados, ${libres} días libres`);
    } catch (err: any) {
      toast.error("Error al cargar datos de modulación: " + err.message);
    } finally {
      setLoadingCalendar(false);
    }
  }, [getPreviousMonth, h7]);

  // Auto-fetch on mount if no data
  useEffect(() => {
    if ((!h7.modulation_days || h7.modulation_days.length === 0) && dg.mes && dg.anio) {
      fetchModulationData();
    }
  }, [dg.mes, dg.anio]);

  // Auto-generate conclusions ONLY if empty (initial seed)
  useEffect(() => {
    if (h7.conclusiones_auto && h7.conclusiones_auto.length > 0) return; // Already has content, don't overwrite

    const conclusions: string[] = [];
    const h4 = data.hoja4_data;
    const h6 = data.hoja6_data;

    if (Math.abs(h4.impacto_economico) < 500) {
      conclusions.push("El precio de la energía facturado coincide con el cálculo efectuado según contrato para el periodo evaluado.");
    } else {
      conclusions.push(`Se identificó una diferencia de S/ ${h4.impacto_economico.toFixed(2)} en la facturación que requiere atención.`);
    }

    if (h6.diferencia < 0) {
      const mesStr = dg.mes?.toLowerCase() || "";
      const anioStr = dg.anio || "";
      conclusions.push(`Realizando el control de demanda **logramos ahorrar un promedio de S/ ${Math.abs(h6.diferencia).toFixed(2)}** para el periodo de ${mesStr}-${anioStr.slice(-2)}.`);
    }

    if (conclusions.length > 0) {
      update("conclusiones_auto", conclusions);
    }
  }, [data.hoja4_data.impacto_economico, data.hoja6_data.diferencia, dg.mes, dg.anio]);

  const regenerarConclusiones = () => {
    const conclusions: string[] = [];
    const h4 = data.hoja4_data;
    const h6 = data.hoja6_data;

    if (Math.abs(h4.impacto_economico) < 500) {
      conclusions.push("El precio de la energía facturado coincide con el cálculo efectuado según contrato para el periodo evaluado.");
    } else {
      conclusions.push(`Se identificó una diferencia de S/ ${h4.impacto_economico.toFixed(2)} en la facturación que requiere atención.`);
    }

    if (h6.diferencia < 0) {
      const mesStr = dg.mes?.toLowerCase() || "";
      const anioStr = dg.anio || "";
      conclusions.push(`Realizando el control de demanda **logramos ahorrar un promedio de S/ ${Math.abs(h6.diferencia).toFixed(2)}** para el periodo de ${mesStr}-${anioStr.slice(-2)}.`);
    }

    update("conclusiones_auto", conclusions);
    toast.success("Conclusiones regeneradas");
  };

  const updateAutoConclusion = (index: number, value: string) => {
    const updated = [...(h7.conclusiones_auto || [])];
    updated[index] = value;
    update("conclusiones_auto", updated);
  };

  const removeAutoConclusion = (index: number) => {
    const updated = (h7.conclusiones_auto || []).filter((_, i) => i !== index);
    update("conclusiones_auto", updated);
  };

  const agregarConclusion = () => {
    if (nuevaConclusion.trim()) {
      const manuales = h7.conclusiones_manuales
        ? h7.conclusiones_manuales + "\n" + nuevaConclusion.trim()
        : nuevaConclusion.trim();
      update("conclusiones_manuales", manuales);
      setNuevaConclusion("");
    }
  };

  const prevMonth = getPreviousMonth();
  const prevMonthName = MESES[prevMonth.getMonth()];
  const prevMonthYear = prevMonth.getFullYear();

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2">📅 Modulaciones y Conclusiones</h3>

      {/* Modulación del mes */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Modulación del mes</p>
          <Button variant="outline" size="sm" className="text-xs" onClick={fetchModulationData} disabled={loadingCalendar}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loadingCalendar ? "animate-spin" : ""}`} />
            {loadingCalendar ? "Cargando..." : "Sincronizar"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Datos del calendario de <strong>{prevMonthName} {prevMonthYear}</strong> (mes anterior a la factura)
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Días modulados (rojos)</Label>
            <Input
              type="number"
              value={h7.dias_modulados || ""}
              onChange={e => update("dias_modulados", parseInt(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Días libre (verdes)</Label>
            <Input
              type="number"
              value={h7.dias_libres || ""}
              onChange={e => update("dias_libres", parseInt(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {(h7.modulation_days || []).length > 0 && (
          <p className="text-xs text-green-600">✅ {h7.modulation_days.length} días cargados del calendario</p>
        )}
      </div>

      {/* Conclusiones auto-generadas (editables) */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Conclusiones principales</p>
          <Button variant="outline" size="sm" className="text-xs" onClick={regenerarConclusiones}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Regenerar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Se generan automáticamente la primera vez. Puede editarlas o eliminarlas libremente.
        </p>

        <div className="space-y-2">
          {(h7.conclusiones_auto || []).map((c, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs font-bold text-muted-foreground mt-2 min-w-[1.2rem]">{i + 1}.</span>
              <Input
                value={c}
                onChange={(e) => updateAutoConclusion(i, e.target.value)}
                className="text-sm flex-1"
              />
              <Button variant="ghost" size="sm" className="text-destructive shrink-0 h-9 w-9 p-0" onClick={() => removeAutoConclusion(i)}>
                ✕
              </Button>
            </div>
          ))}
          {(!h7.conclusiones_auto || h7.conclusiones_auto.length === 0) && (
            <p className="text-xs text-muted-foreground italic">Sin conclusiones. Haga clic en "Regenerar" o agregue manualmente.</p>
          )}
        </div>
      </div>

      {/* Conclusiones adicionales */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <p className="text-sm font-semibold">Conclusiones adicionales</p>

        <div className="flex gap-2">
          <Input
            placeholder="Escribir conclusión adicional..."
            value={nuevaConclusion}
            onChange={(e) => setNuevaConclusion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarConclusion()}
            className="text-sm"
          />
          <Button onClick={agregarConclusion} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>

        {h7.conclusiones_manuales && (
          <div className="bg-background rounded p-3 border text-sm space-y-1">
            {h7.conclusiones_manuales.split("\n").filter(Boolean).map((c, i) => (
              <p key={i} className="text-foreground">• {c}</p>
            ))}
            <Button variant="ghost" size="sm" className="text-xs text-destructive mt-1" onClick={() => update("conclusiones_manuales", "")}>
              Limpiar conclusiones manuales
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hoja7Conclusiones;
