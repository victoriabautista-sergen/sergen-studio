import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useReportContext } from "../context/ReportContext";
import { Hoja6Item } from "../types";

const emptyItem: Hoja6Item = { concepto: "", cantidad: 0, precio_unitario: 0, total: 0 };

const ItemRow = ({ item, onChange, onRemove }: { item: Hoja6Item; onChange: (i: Hoja6Item) => void; onRemove: () => void }) => {
  const handleChange = (field: string, value: any) => {
    const updated = { ...item, [field]: value };
    if (field === "cantidad" || field === "precio_unitario") {
      updated.total = +(updated.cantidad * updated.precio_unitario).toFixed(2);
    }
    onChange(updated);
  };

  return (
    <div className="grid grid-cols-[1fr_60px_80px_80px_30px] gap-1 items-center">
      <Input value={item.concepto} onChange={e => handleChange("concepto", e.target.value)} className="h-7 text-xs" />
      <Input type="number" value={item.cantidad || ""} onChange={e => handleChange("cantidad", parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
      <Input type="number" step="any" value={item.precio_unitario || ""} onChange={e => handleChange("precio_unitario", parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
      <span className="text-xs text-right font-medium">{item.total.toFixed(2)}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}><Trash2 className="h-3 w-3" /></Button>
    </div>
  );
};

const Hoja6Proyeccion = () => {
  const { data, updateSheet } = useReportContext();
  const h6 = data.hoja6_data;

  const updateItems = (key: "items_original" | "items_proyectado", items: Hoja6Item[]) => {
    const total = items.reduce((sum, i) => sum + i.total, 0);
    const totalOrig = key === "items_original" ? total : h6.total_original;
    const totalProy = key === "items_proyectado" ? total : h6.total_proyectado;
    updateSheet("hoja6_data", {
      ...h6,
      [key]: items,
      [key === "items_original" ? "total_original" : "total_proyectado"]: total,
      diferencia: +(totalOrig - totalProy).toFixed(2),
    });
  };

  const addItem = (key: "items_original" | "items_proyectado") => {
    updateItems(key, [...h6[key], { ...emptyItem }]);
  };

  const renderSection = (title: string, key: "items_original" | "items_proyectado", items: Hoja6Item[]) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => addItem(key)}>
          <Plus className="h-3 w-3 mr-1" /> Ítem
        </Button>
      </div>
      <div className="grid grid-cols-[1fr_60px_80px_80px_30px] gap-1 text-[10px] text-muted-foreground font-medium">
        <span>Concepto</span><span>Cant</span><span>P. Unit</span><span className="text-right">Total</span><span />
      </div>
      {items.map((item, i) => (
        <ItemRow
          key={i}
          item={item}
          onChange={updated => {
            const newItems = [...items];
            newItems[i] = updated;
            updateItems(key, newItems);
          }}
          onRemove={() => updateItems(key, items.filter((_, idx) => idx !== i))}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Factura Proyectada</h3>

      <div>
        <Label className="text-xs">Potencia Promedio (kW)</Label>
        <Input
          type="number"
          step="any"
          value={h6.potencia_promedio || ""}
          onChange={e => updateSheet("hoja6_data", { ...h6, potencia_promedio: parseFloat(e.target.value) || 0 })}
          className="h-8 text-sm"
        />
      </div>

      {renderSection("Factura Original", "items_original", h6.items_original)}
      {renderSection("Factura Proyectada", "items_proyectado", h6.items_proyectado)}

      <div className="bg-muted/50 rounded-lg p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span>Total Original:</span><span className="font-semibold">S/ {h6.total_original.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total Proyectado:</span><span className="font-semibold">S/ {h6.total_proyectado.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm pt-1 border-t">
          <span className="font-medium">Diferencia (Ahorro):</span>
          <span className={`font-bold ${h6.diferencia > 0 ? "text-green-600" : "text-destructive"}`}>
            S/ {h6.diferencia.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Hoja6Proyeccion;
