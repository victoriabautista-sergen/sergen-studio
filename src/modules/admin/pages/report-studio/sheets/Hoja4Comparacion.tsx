import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useReportContext } from "../context/ReportContext";
import { Hoja4Item } from "../types";
import { X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Hoja4Comparacion = () => {
  const { data, updateSheet } = useReportContext();
  const h4 = data.hoja4_data;
  const h3 = data.hoja3_data;
  const h2 = data.hoja2_data;
  const concesionaria = data.datos_generales.concesionaria || "";

  const [nuevoExonerado, setNuevoExonerado] = useState("");
  const [savingKeywords, setSavingKeywords] = useState(false);

  // Auto-load exonerado keywords from DB for this concesionaria
  useEffect(() => {
    if (!concesionaria) return;
    supabase
      .from("concesionaria_potencia_keywords")
      .select("inafecto_keywords")
      .eq("concesionaria", concesionaria)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row && (row as any).inafecto_keywords?.length > 0 && (!h4.conceptos_exonerados || h4.conceptos_exonerados.length === 0)) {
          updateSheet("hoja4_data", {
            ...h4,
            conceptos_exonerados: (row as any).inafecto_keywords,
          });
        }
      });
  }, [concesionaria]);

  // Save exonerado keywords to DB for concesionaria (used as rules for AI extraction)
  const saveKeywordsForConcesionaria = async () => {
    if (!concesionaria || !h4.conceptos_exonerados?.length) return;
    setSavingKeywords(true);
    try {
      const { data: existing } = await supabase
        .from("concesionaria_potencia_keywords")
        .select("id")
        .eq("concesionaria", concesionaria)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("concesionaria_potencia_keywords")
          .update({ inafecto_keywords: h4.conceptos_exonerados } as any)
          .eq("concesionaria", concesionaria);
      } else {
        await supabase
          .from("concesionaria_potencia_keywords")
          .insert({ concesionaria, inafecto_keywords: h4.conceptos_exonerados } as any);
      }
      toast.success(`Reglas exonerados guardadas para ${concesionaria}`);
    } catch (err: any) {
      toast.error("Error al guardar: " + (err.message || ""));
    } finally {
      setSavingKeywords(false);
    }
  };

  // Build recalculated items from hoja3 items — use h3 tipo directly (no reclassification)
  useEffect(() => {
    const calc_hp = h2.precio_calculado_hp;
    const calc_hfp = h2.precio_calculado_hfp;
    const fact_hp = h3.precio_hp_facturado;
    const fact_hfp = h3.precio_hfp_facturado;

    console.log("[Hoja4] Precios calculados HP:", calc_hp, "HFP:", calc_hfp);
    console.log("[Hoja4] Precios facturados HP:", fact_hp, "HFP:", fact_hfp);
    console.log("[Hoja4] nombre_hp:", h3.nombre_hp, "nombre_hfp:", h3.nombre_hfp);

    // If calculated prices are 0, skip recalculation
    if (!calc_hp && !calc_hfp) {
      console.log("[Hoja4] Precios calculados son 0, no se recalcula");
      return;
    }

    const diff_hp = +(fact_hp - calc_hp).toFixed(5);
    const diff_hfp = +(fact_hfp - calc_hfp).toFixed(5);

    const nombreHP = (h3.nombre_hp || "").toUpperCase().trim();
    const nombreHFP = (h3.nombre_hfp || "").toUpperCase().trim();

    const items_recalculados: Hoja4Item[] = h3.items.map((item) => {
      const descUpper = (item.descripcion || "").toUpperCase().trim();
      
      // Match using includes in both directions for flexibility
      const isHP = nombreHP.length > 0 && (descUpper.includes(nombreHP) || nombreHP.includes(descUpper));
      const isHFP = nombreHFP.length > 0 && (descUpper.includes(nombreHFP) || nombreHFP.includes(descUpper));
      const isEnergy = isHP || isHFP;

      if (isEnergy) {
        console.log("[Hoja4] Matched energy item:", item.descripcion, "isHP:", isHP, "isHFP:", isHFP);
      }

      // Use classification directly from Hoja 3 extraction
      let tipo: "gravado" | "exonerado" | "inafecta" = "gravado";
      if (item.tipo === "exonerado") {
        tipo = "exonerado";
      } else if (item.tipo === "inafecta" || (item.tipo as string) === "inafecto") {
        tipo = "inafecta";
      }

      let valor_unitario_calc = item.valor_unitario;
      let valor_venta_calc = item.valor_venta;

      if (isHP) {
        valor_unitario_calc = calc_hp;
        valor_venta_calc = +(item.cantidad * calc_hp).toFixed(2);
      } else if (isHFP) {
        valor_unitario_calc = calc_hfp;
        valor_venta_calc = +(item.cantidad * calc_hfp).toFixed(2);
      }

      return {
        descripcion: item.descripcion,
        unidad: item.unidad,
        cantidad: item.cantidad,
        tipo,
        valor_unitario_original: item.valor_unitario,
        valor_venta_original: item.valor_venta,
        valor_unitario_calc,
        valor_venta_calc,
        is_energy: isEnergy,
      };
    });

    // Calculate the energy price difference impact on valor_venta
    let diff_gravado = 0;
    let diff_no_gravado = 0;
    items_recalculados.forEach((item) => {
      if (item.is_energy) {
        const diff_venta = item.valor_venta_calc - item.valor_venta_original;
        if (item.tipo === "exonerado" || item.tipo === "inafecta") {
          diff_no_gravado += diff_venta;
        } else {
          diff_gravado += diff_venta;
        }
      }
    });

    // Start from hoja3's original totals and only adjust for energy difference
    const subtotal_afecto = +(h3.op_gravadas + diff_gravado).toFixed(2);
    const subtotal_exonerado = +((h3.op_inafectas || 0) + (h3.op_exonerada || 0) + diff_no_gravado).toFixed(2);
    const igv_recalculado = +(subtotal_afecto * 0.18).toFixed(2);
    const total_recalculado = +(subtotal_afecto + igv_recalculado + subtotal_exonerado).toFixed(2);

    // Total hoja4 for impacto calculation
    const total_hoja4 = total_recalculado;

    // Impacto = difference between hoja3 total and hoja4 total (verified cross-check)
    const total_hoja3 = h3.importe_total || 0;
    const impacto = +Math.abs(total_hoja3 - total_hoja4).toFixed(2);
    const pagoMas = total_hoja3 > total_hoja4;

    const energiaHP = h3.items.find(i => i.descripcion.toUpperCase().includes(h3.nombre_hp.toUpperCase()));
    const energiaHFP = h3.items.find(i => i.descripcion.toUpperCase().includes(h3.nombre_hfp.toUpperCase()));
    const cantHP = energiaHP?.cantidad || 0;
    const cantHFP = energiaHFP?.cantidad || 0;

    const conclusion = `Considerando las cantidades facturadas de ${cantHP.toLocaleString("es-PE")} kWh (HP) y ${cantHFP.toLocaleString("es-PE")} kWh (HFP), la diferencia de precios representa un impacto económico de S/ ${impacto.toLocaleString("es-PE", { minimumFractionDigits: 2 })} que el cliente ${pagoMas ? "pagó de más" : "ahorró"} respecto al precio calculado según contrato.`;

    updateSheet("hoja4_data", {
      ...h4,
      items_recalculados,
      subtotal_afecto,
      subtotal_exonerado,
      igv_recalculado,
      total_recalculado,
      precio_calculado_hp: calc_hp,
      precio_calculado_hfp: calc_hfp,
      precio_facturado_hp: fact_hp,
      precio_facturado_hfp: fact_hfp,
      diferencia_hp: diff_hp,
      diferencia_hfp: diff_hfp,
      impacto_economico: impacto,
      conclusion,
    });
  }, [h2.precio_actualizado_hp, h2.precio_actualizado_hfp, h3.precio_hp_facturado, h3.precio_hfp_facturado, h3.items, h3.nombre_hp, h3.nombre_hfp, h3.importe_total, h3.op_gravadas, h3.op_inafectas, h3.op_exonerada]);

  const agregarExonerado = () => {
    if (nuevoExonerado.trim()) {
      updateSheet("hoja4_data", {
        ...h4,
        conceptos_exonerados: [...(h4.conceptos_exonerados || []), nuevoExonerado.trim().toUpperCase()],
      });
      setNuevoExonerado("");
    }
  };

  const eliminarExonerado = (idx: number) => {
    const updated = [...(h4.conceptos_exonerados || [])];
    updated.splice(idx, 1);
    updateSheet("hoja4_data", { ...h4, conceptos_exonerados: updated });
  };


  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2">⚙ Reglas Exonerados por Concesionaria</h3>
      <p className="text-xs text-muted-foreground">
        Estos conceptos se usan como regla para la extracción IA de futuras facturas de <strong>{concesionaria || "esta concesionaria"}</strong>.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="Ej: FISE, INTERES MORATORIO"
          value={nuevoExonerado}
          onChange={(e) => setNuevoExonerado(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregarExonerado()}
        />
        <Button onClick={agregarExonerado} size="sm">Agregar</Button>
      </div>
      {(h4.conceptos_exonerados || []).length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {h4.conceptos_exonerados.map((c, i) => (
              <span key={i} className="bg-muted px-2 py-1 rounded text-xs flex items-center gap-1">
                {c}
                <X className="w-3 h-3 cursor-pointer" onClick={() => eliminarExonerado(i)} />
              </span>
            ))}
          </div>
          {concesionaria && (
            <Button onClick={saveKeywordsForConcesionaria} size="sm" variant="outline" disabled={savingKeywords} className="text-xs h-7">
              <Save className="w-3 h-3 mr-1" />
              {savingKeywords ? "Guardando..." : `Guardar para ${concesionaria}`}
            </Button>
          )}
        </div>
      )}

      {/* Show only exonerado items */}
      {h3.items.filter(item => item.tipo === "exonerado" || item.tipo === "inafecta" || (item.tipo as string) === "inafecto").length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">📋 Ítems No Gravados Detectados</h3>
          <p className="text-xs text-muted-foreground">
            Ítems clasificados como exonerados o inafectos en la factura actual. Esta clasificación puede variar entre concesionarias.
          </p>
          <div className="space-y-1">
            {h3.items
              .filter(item => item.tipo === "exonerado" || item.tipo === "inafecta" || (item.tipo as string) === "inafecto")
              .map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded px-2 py-1.5 text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[250px]">
                    <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">
                      {item.tipo === "inafecta" || (item.tipo as string) === "inafecto" ? "inafecta" : "exonerado"}
                    </span>
                    <span title={item.descripcion}>{item.descripcion}</span>
                  </div>
                  <span className="font-mono ml-2 whitespace-nowrap">{item.valor_venta?.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Hoja4Comparacion;
