import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { useReportContext } from "../context/ReportContext";

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const Hoja6Proyeccion = () => {
  const { data, updateSheet } = useReportContext();
  const h6 = data.hoja6_data;
  const h3 = data.hoja3_data;
  const h5 = data.hoja5_data;

  const [nuevoItem, setNuevoItem] = useState("");

  const potenciaPromedio = h5.potencia_coincidente_promedio || 0;

  // Recalculate whenever inputs change
  useEffect(() => {
    if (!h3.items.length) return;

    const itemsPotencia = h6.items_potencia || [];

    // Calculate original total (from hoja 3)
    const totalOriginal = h3.importe_total || 0;

    // Find items to replace and calculate difference
    let sumaOriginalReemplazados = 0;
    let sumaRecalculados = 0;

    const detalles: { descripcion: string; valorOriginal: number; valorNuevo: number }[] = [];

    h3.items.forEach((item) => {
      const descUpper = item.descripcion.toUpperCase();
      const isMatch = itemsPotencia.some(p => descUpper.includes(p.toUpperCase()));
      if (isMatch) {
        const valorNuevo = +(item.valor_unitario * potenciaPromedio).toFixed(2);
        sumaOriginalReemplazados += item.valor_venta;
        sumaRecalculados += valorNuevo;
        detalles.push({
          descripcion: item.descripcion,
          valorOriginal: item.valor_venta,
          valorNuevo,
        });
      }
    });

    // New subtotal = original subtotal - original replaced + recalculated
    const subtotalOriginal = h3.subtotal || 0;
    const nuevoSubtotal = +(subtotalOriginal - sumaOriginalReemplazados + sumaRecalculados).toFixed(2);
    const nuevoIGV = +(nuevoSubtotal * 0.18).toFixed(2);
    const nuevoTotal = +(nuevoSubtotal + nuevoIGV).toFixed(2);
    const diferencia = +(nuevoTotal - totalOriginal).toFixed(2);

    updateSheet("hoja6_data", {
      ...h6,
      potencia_promedio: potenciaPromedio,
      total_original: totalOriginal,
      total_proyectado: nuevoTotal,
      diferencia,
    });
  }, [h3.items, h3.importe_total, h3.subtotal, h5.potencia_coincidente_promedio, h6.items_potencia]);

  const agregarItem = () => {
    if (nuevoItem.trim()) {
      updateSheet("hoja6_data", {
        ...h6,
        items_potencia: [...(h6.items_potencia || []), nuevoItem.trim().toUpperCase()],
      });
      setNuevoItem("");
    }
  };

  const eliminarItem = (idx: number) => {
    const updated = [...(h6.items_potencia || [])];
    updated.splice(idx, 1);
    updateSheet("hoja6_data", { ...h6, items_potencia: updated });
  };

  // Find matched items for display
  const itemsPotencia = h6.items_potencia || [];
  const matchedItems = h3.items.filter(item =>
    itemsPotencia.some(p => item.descripcion.toUpperCase().includes(p.toUpperCase()))
  );

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2">📊 Factura Proyectada</h3>

      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Ítems de factura cuya cantidad se reemplaza por la potencia coincidente promedio
        </p>
        <p className="text-sm">
          Potencia coincidente promedio: <strong>{potenciaPromedio ? `${fmt(potenciaPromedio)} kW` : "— kW"}</strong>
        </p>

        {(h6.items_potencia || []).map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-background rounded px-3 py-2 border">
            <span className="text-sm font-medium">{item}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => eliminarItem(i)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            placeholder="Ej: POTENCIA HORA PUNTA G"
            value={nuevoItem}
            onChange={(e) => setNuevoItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarItem()}
            className="text-sm"
          />
          <Button onClick={agregarItem} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>
      </div>

      {/* Calculation process */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">📋 Proceso de cálculo</h4>

        <div className="bg-muted/20 rounded p-3 space-y-1 text-sm">
          <p className="font-medium">Paso 1: Valores originales (Hoja 3)</p>
          <p className="text-muted-foreground">Total Afecto (Subtotal): <strong className="text-foreground">S/ {fmt(h3.subtotal)}</strong></p>
          <p className="text-muted-foreground">Importe Total Factura: <strong className="text-foreground">S/ {fmt(h3.importe_total)}</strong></p>
        </div>

        <div className="bg-muted/20 rounded p-3 space-y-1 text-sm">
          <p className="font-medium">Paso 2: Ítems modificados</p>
          {matchedItems.length > 0 ? matchedItems.map((item, i) => {
            const valorNuevo = +(item.valor_unitario * potenciaPromedio).toFixed(2);
            return (
              <div key={i} className="ml-2 space-y-0.5">
                <p className="font-medium">{item.descripcion}</p>
                <p className="text-muted-foreground">Valor original: <strong className="text-foreground">S/ {fmt(item.valor_venta)}</strong></p>
                <p className="text-muted-foreground">
                  Nuevo: {fmt(item.valor_unitario, 4)} × {fmt(potenciaPromedio, 2)} = <strong className="text-foreground">S/ {fmt(valorNuevo)}</strong>
                </p>
              </div>
            );
          }) : (
            <p className="text-muted-foreground ml-2">No hay ítems seleccionados</p>
          )}
          {matchedItems.length > 0 && (
            <>
              <p className="text-muted-foreground mt-2">Suma valores originales: <strong className="text-foreground">S/ {fmt(matchedItems.reduce((s, i) => s + i.valor_venta, 0))}</strong></p>
              <p className="text-muted-foreground">Suma valores recalculados: <strong className="text-foreground">S/ {fmt(matchedItems.reduce((s, i) => s + +(i.valor_unitario * potenciaPromedio).toFixed(2), 0))}</strong></p>
            </>
          )}
        </div>

        <div className="bg-muted/20 rounded p-3 space-y-1 text-sm">
          <p className="font-medium">Paso 3: Nuevo Total Afecto</p>
          {(() => {
            const sumaOrig = matchedItems.reduce((s, i) => s + i.valor_venta, 0);
            const sumaRecalc = matchedItems.reduce((s, i) => s + +(i.valor_unitario * potenciaPromedio).toFixed(2), 0);
            const nuevoSubtotal = +(h3.subtotal - sumaOrig + sumaRecalc).toFixed(2);
            return (
              <p className="text-muted-foreground">
                {fmt(h3.subtotal)} – {fmt(sumaOrig)} + {fmt(sumaRecalc)} = <strong className="text-foreground">S/ {fmt(nuevoSubtotal)}</strong>
              </p>
            );
          })()}
        </div>

        <div className="bg-muted/20 rounded p-3 space-y-1 text-sm">
          <p className="font-medium">Paso 4: IGV e Importe Total</p>
          {(() => {
            const sumaOrig = matchedItems.reduce((s, i) => s + i.valor_venta, 0);
            const sumaRecalc = matchedItems.reduce((s, i) => s + +(i.valor_unitario * potenciaPromedio).toFixed(2), 0);
            const nuevoSubtotal = +(h3.subtotal - sumaOrig + sumaRecalc).toFixed(2);
            const igv = +(nuevoSubtotal * 0.18).toFixed(2);
            const total = +(nuevoSubtotal + igv).toFixed(2);
            return (
              <>
                <p className="text-muted-foreground">IGV (18%): {fmt(nuevoSubtotal)} × 0.18 = <strong className="text-foreground">S/ {fmt(igv)}</strong></p>
                <p className="text-muted-foreground">Importe Total: {fmt(nuevoSubtotal)} + {fmt(igv)} = <strong className="text-foreground">S/ {fmt(total)}</strong></p>
              </>
            );
          })()}
        </div>

        <div className="bg-muted/20 rounded p-3 space-y-1 text-sm border-l-4 border-primary">
          <p className="font-medium">Paso 5: Desviación</p>
          <p className="text-muted-foreground">
            Proyectado – Original: {fmt(h6.total_proyectado)} – {fmt(h6.total_original)} = <strong className="text-foreground">S/ {fmt(h6.diferencia)}</strong>
          </p>
          {h6.diferencia < 0 ? (
            <p className="text-green-600 flex items-center gap-1">✅ Se redujo la factura</p>
          ) : h6.diferencia > 0 ? (
            <p className="text-destructive flex items-center gap-1">⚠️ Se incrementó la factura</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Hoja6Proyeccion;
