import { useCotizacionContext } from "../context/CotizacionContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { CotizacionItem } from "../types";

const CotizacionEditor = () => {
  const { data, updateData, setData } = useCotizacionContext();

  const updateItem = (index: number, field: keyof CotizacionItem, value: string | number) => {
    const newItems = [...data.items];
    const item = { ...newItems[index], [field]: value };
    // Recalculate item total
    item.total = item.precio_unitario * item.cantidad;
    item.precio_venta = item.precio_unitario;
    newItems[index] = item;
    updateData("items", newItems);
  };

  const addItem = () => {
    updateData("items", [
      ...data.items,
      { descripcion: "", codigo: "", precio_unitario: 0, cantidad: 1, precio_venta: 0, total: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    const newItems = data.items.filter((_, i) => i !== index);
    updateData("items", newItems);
  };

  return (
    <div className="space-y-6">
      {/* Datos de Cotización */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Datos de Cotización</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Fecha</Label>
            <Input value={data.fecha} onChange={e => updateData("fecha", e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">N° Cotización</Label>
            <Input value={data.numero_cotizacion} onChange={e => updateData("numero_cotizacion", e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Validez</Label>
            <Input value={data.validez} onChange={e => updateData("validez", e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Datos de Empresa */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Datos de Empresa</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Dirección</Label>
            <Input value={data.direccion} onChange={e => updateData("direccion", e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Asesor</Label>
            <Input value={data.asesor} onChange={e => updateData("asesor", e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Teléfono</Label>
            <Input value={data.telefono} onChange={e => updateData("telefono", e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Correo</Label>
            <Input value={data.correo} onChange={e => updateData("correo", e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Datos del Cliente */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Datos del Cliente</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Empresa</Label>
            <Input value={data.empresa_cliente} onChange={e => updateData("empresa_cliente", e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Contacto</Label>
            <Input value={data.contacto_cliente} onChange={e => updateData("contacto_cliente", e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Ubicación</Label>
            <Input value={data.ubicacion_cliente} onChange={e => updateData("ubicacion_cliente", e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Servicios / Productos</h3>
          <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Agregar
          </Button>
        </div>
        <div className="space-y-4">
          {data.items.map((item, idx) => (
            <div key={idx} className="border rounded-md p-3 space-y-2 relative">
              {data.items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeItem(idx)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
              <div>
                <Label className="text-xs">Descripción</Label>
                <Textarea
                  value={item.descripcion}
                  onChange={e => updateItem(idx, "descripcion", e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Código</Label>
                  <Input value={item.codigo} onChange={e => updateItem(idx, "codigo", e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Precio Unit.</Label>
                  <Input type="number" value={item.precio_unitario} onChange={e => updateItem(idx, "precio_unitario", parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Cantidad</Label>
                  <Input type="number" value={item.cantidad} onChange={e => updateItem(idx, "cantidad", parseInt(e.target.value) || 1)} className="h-8 text-xs" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Impuestos */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Impuestos y Otros</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Impuesto %</Label>
            <Input type="number" value={data.impuesto_pct} onChange={e => updateData("impuesto_pct", parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Otros</Label>
            <Input type="number" value={data.otros} onChange={e => updateData("otros", parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Términos */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Términos y Condiciones</h3>
        <Textarea
          value={data.terminos}
          onChange={e => updateData("terminos", e.target.value)}
          className="text-xs min-h-[100px]"
        />
      </div>

      {/* Cuentas bancarias */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Datos Bancarios</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Cuenta Bancaria</Label>
            <Input value={data.cuenta_bancaria} onChange={e => updateData("cuenta_bancaria", e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">CCI</Label>
            <Input value={data.cci} onChange={e => updateData("cci", e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CotizacionEditor;
