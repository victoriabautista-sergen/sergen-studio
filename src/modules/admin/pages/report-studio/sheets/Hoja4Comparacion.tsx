import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReportContext } from "../context/ReportContext";
import { Hoja4Item } from "../types";
import { X } from "lucide-react";

const Hoja4Comparacion = () => {
  const { data, updateSheet } = useReportContext();
  const h4 = data.hoja4_data;
  const h3 = data.hoja3_data;
  const h2 = data.hoja2_data;

  const [nuevoInafecto, setNuevoInafecto] = useState("");

  // Build recalculated items from hoja3 items
  useEffect(() => {
    const calc_hp = h2.precio_actualizado_hp;
    const calc_hfp = h2.precio_actualizado_hfp;
    const fact_hp = h3.precio_hp_facturado;
    const fact_hfp = h3.precio_hfp_facturado;
    const diff_hp = +(fact_hp - calc_hp).toFixed(5);
    const diff_hfp = +(fact_hfp - calc_hfp).toFixed(5);

    const inafectos = h4.conceptos_inafectos || [];

    const items_recalculados: Hoja4Item[] = h3.items.map((item) => {
      const descUpper = item.descripcion.toUpperCase();
      const isHP = descUpper.includes(h3.nombre_hp.toUpperCase());
      const isHFP = descUpper.includes(h3.nombre_hfp.toUpperCase());
      const isInafecto = inafectos.some(c => descUpper.includes(c.toUpperCase()));

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
        cantidad: item.cantidad,
        tipo: isInafecto ? "inafecto" as const : "gravado" as const,
        valor_unitario_calc,
        valor_venta_calc,
      };
    });

    const subtotal_afecto = +items_recalculados
      .filter(i => i.tipo === "gravado")
      .reduce((sum, i) => sum + i.valor_venta_calc, 0)
      .toFixed(2);
    const igv_recalculado = +(subtotal_afecto * 0.18).toFixed(2);
    const total_recalculado = +(subtotal_afecto + igv_recalculado).toFixed(2);

    const energiaHP = h3.items.find(i => i.descripcion.toUpperCase().includes(h3.nombre_hp.toUpperCase()));
    const energiaHFP = h3.items.find(i => i.descripcion.toUpperCase().includes(h3.nombre_hfp.toUpperCase()));
    const cantHP = energiaHP?.cantidad || 0;
    const cantHFP = energiaHFP?.cantidad || 0;

    const impactoHP = +(cantHP * diff_hp).toFixed(2);
    const impactoHFP = +(cantHFP * diff_hfp).toFixed(2);
    const impacto = +(Math.abs(impactoHP) + Math.abs(impactoHFP)).toFixed(3);

    const pagoMas = impacto > 0;
    const conclusion = `Considerando las cantidades facturadas de ${cantHP.toLocaleString("es-PE")} kWh (HP) y ${cantHFP.toLocaleString("es-PE")} kWh (HFP), la diferencia de precios representa un impacto económico de S/ ${impacto.toLocaleString("es-PE", { minimumFractionDigits: 2 })} que el cliente ${pagoMas ? "pagó de más" : "ahorró"} respecto al precio calculado según contrato.`;

    updateSheet("hoja4_data", {
      ...h4,
      items_recalculados,
      subtotal_afecto,
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
  }, [h2.precio_actualizado_hp, h2.precio_actualizado_hfp, h3.precio_hp_facturado, h3.precio_hfp_facturado, h3.items, h4.conceptos_inafectos, h3.nombre_hp, h3.nombre_hfp]);

  const agregarInafecto = () => {
    if (nuevoInafecto.trim()) {
      updateSheet("hoja4_data", {
        ...h4,
        conceptos_inafectos: [...(h4.conceptos_inafectos || []), nuevoInafecto.trim().toUpperCase()],
      });
      setNuevoInafecto("");
    }
  };

  const eliminarInafecto = (idx: number) => {
    const updated = [...(h4.conceptos_inafectos || [])];
    updated.splice(idx, 1);
    updateSheet("hoja4_data", { ...h4, conceptos_inafectos: updated });
  };

  const updateItemTipo = (idx: number, tipo: "gravado" | "inafecto" | "exonerado") => {
    const updated = [...(h4.items_recalculados || [])];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], tipo };

      const subtotal_afecto = +updated
        .filter(i => i.tipo === "gravado")
        .reduce((sum, i) => sum + i.valor_venta_calc, 0)
        .toFixed(2);
      const igv_recalculado = +(subtotal_afecto * 0.18).toFixed(2);
      const total_recalculado = +(subtotal_afecto + igv_recalculado).toFixed(2);

      updateSheet("hoja4_data", { ...h4, items_recalculados: updated, subtotal_afecto, igv_recalculado, total_recalculado });
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2">⚙ Conceptos Inafectos IGV</h3>
      <div className="flex gap-2">
        <Input
          placeholder="Ej: ALUMBRADO"
          value={nuevoInafecto}
          onChange={(e) => setNuevoInafecto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregarInafecto()}
        />
        <Button onClick={agregarInafecto} size="sm">Guardar</Button>
      </div>
      {(h4.conceptos_inafectos || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {h4.conceptos_inafectos.map((c, i) => (
            <span key={i} className="bg-muted px-2 py-1 rounded text-xs flex items-center gap-1">
              {c}
              <X className="w-3 h-3 cursor-pointer" onClick={() => eliminarInafecto(i)} />
            </span>
          ))}
        </div>
      )}

      <div className="border-t pt-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">📊 Comparación de precios</h3>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          {[
            ["Precio calculado HP", h4.precio_calculado_hp, "S/kWh"],
            ["Precio factura HP", h4.precio_facturado_hp, "S/kWh"],
          ].map(([label, val, unit]) => (
            <div key={label as string} className="flex justify-between text-sm">
              <span>{label as string}</span>
              <span className="font-mono font-medium">{(val as number).toFixed(5)} {unit as string}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm">
            <span>Diferencia HP</span>
            <span className={`font-mono font-bold ${h4.diferencia_hp > 0 ? "text-red-600" : "text-green-600"}`}>
              +{h4.diferencia_hp.toFixed(5)} S/kWh
            </span>
          </div>
          <div className="border-t my-2" />
          {[
            ["Precio calculado HFP", h4.precio_calculado_hfp, "S/kWh"],
            ["Precio factura HFP", h4.precio_facturado_hfp, "S/kWh"],
          ].map(([label, val, unit]) => (
            <div key={label as string} className="flex justify-between text-sm">
              <span>{label as string}</span>
              <span className="font-mono font-medium">{(val as number).toFixed(5)} {unit as string}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm">
            <span>Diferencia HFP</span>
            <span className={`font-mono font-bold ${h4.diferencia_hfp > 0 ? "text-red-600" : "text-green-600"}`}>
              +{h4.diferencia_hfp.toFixed(5)} S/kWh
            </span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">📄 Factura recalculada</h3>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          <div className="grid grid-cols-[1fr_90px_90px] gap-1 text-xs font-medium text-muted-foreground px-1">
            <span>Descripción</span>
            <span className="text-right">Tipo</span>
            <span className="text-right">Cant.</span>
          </div>
          {(h4.items_recalculados || []).map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_90px] gap-1 text-sm items-center bg-muted/30 rounded px-1 py-0.5">
              <span className="text-xs truncate font-medium">{item.descripcion}</span>
              <Select value={item.tipo} onValueChange={(v) => updateItemTipo(i, v as "gravado" | "inafecto" | "exonerado")}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gravado">Gravado</SelectItem>
                  <SelectItem value="inafecto">Inafecto</SelectItem>
                  <SelectItem value="exonerado">Exonerado</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-right font-mono text-xs">{item.cantidad.toLocaleString("es-PE")}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-medium mt-3 pt-2 border-t">
          <span>Base gravada</span>
          <span className="font-mono">S/ {h4.subtotal_afecto?.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
};

export default Hoja4Comparacion;
