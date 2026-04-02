import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Pencil, Check, Save, Loader2 } from "lucide-react";
import { useReportContext } from "../context/ReportContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const Hoja6Proyeccion = () => {
  const { data, updateSheet } = useReportContext();
  const h6 = data.hoja6_data;
  const h3 = data.hoja3_data;
  const h5 = data.hoja5_data;
  const concesionaria = data.datos_generales.concesionaria;

  const [nuevoItem, setNuevoItem] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const potenciaPromedio = h5.potencia_coincidente_promedio || 0;

  // Load saved keywords for this concesionaria
  useEffect(() => {
    if (!concesionaria || loaded) return;

    const loadKeywords = async () => {
      const { data: row } = await supabase
        .from("concesionaria_potencia_keywords" as any)
        .select("keywords")
        .eq("concesionaria", concesionaria.toUpperCase())
        .maybeSingle();

      if (row && (row as any).keywords?.length > 0) {
        const savedKeywords = (row as any).keywords as string[];
        // Only set if no items_potencia yet
        if (!h6.items_potencia || h6.items_potencia.length === 0) {
          updateSheet("hoja6_data", { ...h6, items_potencia: savedKeywords });
        }
        setLoaded(true);
      } else {
        // Fallback: auto-detect from invoice
        setLoaded(true);
      }
    };

    loadKeywords();
  }, [concesionaria]);

  // Auto-detect potencia items when hoja3 loads and no items_potencia set yet and no saved keywords
  useEffect(() => {
    if (h3.items.length > 0 && (!h6.items_potencia || h6.items_potencia.length === 0) && loaded) {
      const potenciaKeywords = ["POTENCIA ACTIVA", "POTENCIA HORA PUNTA", "POTENCIA FUERA PUNTA"];
      const detected = h3.items
        .filter(item => potenciaKeywords.some(k => item.descripcion.toUpperCase().includes(k)))
        .map(item => item.descripcion.toUpperCase());
      if (detected.length > 0) {
        updateSheet("hoja6_data", { ...h6, items_potencia: detected });
      }
    }
  }, [h3.items, loaded]);

  // Recalculate whenever inputs change
  useEffect(() => {
    if (!h3.items.length) return;

    const itemsPotencia = h6.items_potencia || [];
    const totalOriginal = h3.importe_total || 0;

    let sumaOriginalReemplazados = 0;
    let sumaRecalculados = 0;

    h3.items.forEach((item) => {
      const descUpper = item.descripcion.toUpperCase();
      const isMatch = itemsPotencia.some(p => descUpper.includes(p.toUpperCase()));
      if (isMatch) {
        const valorNuevo = +(item.valor_unitario * potenciaPromedio).toFixed(2);
        sumaOriginalReemplazados += item.valor_venta;
        sumaRecalculados += valorNuevo;
      }
    });

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

  const saveKeywords = async () => {
    if (!concesionaria || !h6.items_potencia?.length) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("concesionaria_potencia_keywords" as any)
        .upsert(
          { concesionaria: concesionaria.toUpperCase(), keywords: h6.items_potencia },
          { onConflict: "concesionaria" }
        );
      if (error) throw error;
      toast.success("Keywords guardadas para " + concesionaria);
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

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

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditValue(h6.items_potencia[idx]);
  };

  const confirmEdit = () => {
    if (editingIdx !== null && editValue.trim()) {
      const updated = [...(h6.items_potencia || [])];
      updated[editingIdx] = editValue.trim().toUpperCase();
      updateSheet("hoja6_data", { ...h6, items_potencia: updated });
    }
    setEditingIdx(null);
    setEditValue("");
  };

  // Matched items for summary
  const itemsPotencia = h6.items_potencia || [];
  const matchedItems = h3.items.filter(item =>
    itemsPotencia.some(p => item.descripcion.toUpperCase().includes(p.toUpperCase()))
  );

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2">📊 Factura Proyectada</h3>

      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Ítems de potencia a reemplazar
            {concesionaria && <span className="ml-1 text-xs font-medium text-primary">({concesionaria})</span>}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={saveKeywords}
            disabled={saving || !itemsPotencia.length || !concesionaria}
            className="text-xs"
          >
            {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
            Guardar para concesionaria
          </Button>
        </div>

        <p className="text-sm">
          Potencia coincidente promedio: <strong>{potenciaPromedio ? `${fmt(potenciaPromedio)} kW` : "— kW"}</strong>
        </p>

        {itemsPotencia.map((item, i) => (
          <div key={i} className="flex items-center justify-between rounded px-3 py-2 border bg-background">
            {editingIdx === i ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                  className="h-7 text-sm flex-1"
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={confirmEdit}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium">{item}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => startEdit(i)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => eliminarItem(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
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

      {/* Matched items summary */}
      {matchedItems.length > 0 && (
        <div className="rounded-lg p-4 space-y-2 border bg-muted/20">
          <p className="text-sm font-medium text-muted-foreground">Ítems de potencia detectados en factura:</p>
          {matchedItems.map((item, i) => (
            <div key={i} className="flex justify-between text-sm bg-background rounded px-3 py-1.5 border">
              <span className="truncate font-medium">{item.descripcion}</span>
              <span className="font-mono text-muted-foreground ml-2 whitespace-nowrap">
                {fmt(item.cantidad)} → <strong>{fmt(potenciaPromedio)} kW</strong>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Totals summary */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span>Factura original:</span>
          <span className="font-semibold font-mono">S/ {fmt(h6.total_original)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Factura proyectada:</span>
          <span className="font-semibold font-mono">S/ {fmt(h6.total_proyectado)}</span>
        </div>
        <div className="flex justify-between text-sm pt-1 border-t">
          <span className="font-medium">Desviación:</span>
          <span className={`font-bold font-mono ${h6.diferencia < 0 ? "text-green-600" : h6.diferencia > 0 ? "text-destructive" : ""}`}>
            S/ {fmt(h6.diferencia)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Hoja6Proyeccion;