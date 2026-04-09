import { useEffect, useState, useRef } from "react";
import { useCotizacionContext } from "../context/CotizacionContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload } from "lucide-react";
import { CotizacionItem, CotizacionMarca } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface SergenUser {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

const CotizacionEditor = () => {
  const { data, updateData, setData } = useCotizacionContext();
  const [sergenUsers, setSergenUsers] = useState<SergenUser[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Find header row with "descripcion" to locate the items table
        let headerIdx = -1;
        let colDesc = 0, colCod = -1, colPrecio = -1, colCant = -1;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] ?? "").trim().toLowerCase();
            if (cell.includes("descripci")) {
              headerIdx = i;
              colDesc = j;
              // Scan rest of header for other columns
              for (let k = 0; k < row.length; k++) {
                const h = String(row[k] ?? "").trim().toLowerCase();
                if (h.includes("codigo") || h.includes("código")) colCod = k;
                if (h.includes("precio") || h.includes("p.unit") || h.includes("unitario")) colPrecio = k;
                if (h.includes("cant") || h.includes("qty")) colCant = k;
              }
              break;
            }
          }
          if (headerIdx >= 0) break;
        }

        // Parse items from rows after header
        const items: CotizacionItem[] = [];
        const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;

        for (let i = startRow; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          const rawDesc = String(row[colDesc] ?? "").trim();
          const desc = rawDesc.length > 0
            ? rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1).toLowerCase()
            : "";
          if (!desc) continue;

          const precio = colPrecio >= 0 ? (parseFloat(String(row[colPrecio] ?? 0)) || 0) : 0;
          const cantidad = colCant >= 0 ? (parseInt(String(row[colCant] ?? 1)) || 1) : 1;
          const codigo = colCod >= 0 ? String(row[colCod] ?? "") : "";

          items.push({
            descripcion: desc,
            codigo,
            precio_unitario: precio,
            cantidad,
            precio_venta: precio,
            total: precio * cantidad,
          });
        }

        if (items.length === 0) {
          toast.error("No se encontraron items en el archivo");
          return;
        }

        // Only update items and recalculate totals
        setData(prev => {
          const subtotal = items.reduce((s, i) => s + i.total, 0);
          return {
            ...prev,
            items,
            subtotal,
            imponible: subtotal,
            total_impuesto: subtotal * (prev.impuesto_pct / 100),
            total: subtotal + subtotal * (prev.impuesto_pct / 100) + prev.otros,
          };
        });

        toast.success(`${items.length} items cargados desde Excel`);
      } catch (err: any) {
        toast.error("Error al leer el archivo: " + (err.message || "formato inválido"));
      }
    };
    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = "";
  };

  // Fetch Sergen users (super_admin + technical_user)
  useEffect(() => {
    const fetchUsers = async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["super_admin", "technical_user"]);

      if (!roles?.length) return;

      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds)
        .eq("is_active", true);

      if (profiles) {
        setSergenUsers(profiles as SergenUser[]);
      }
    };
    fetchUsers();
  }, []);

  const handleAsesorChange = (userId: string) => {
    const user = sergenUsers.find(u => u.user_id === userId);
    if (user) {
      setData(prev => ({
        ...prev,
        asesor: user.full_name || "",
        correo: user.email || "",
        telefono: user.phone || "",
      }));
    }
  };

  const handleMarcaChange = (marca: CotizacionMarca) => {
    setData(prev => {
      let correo = prev.correo;
      if (correo) {
        correo = correo.replace(/@(sergen|incoser)\.pe/i, marca === "incoser" ? "@incoser.pe" : "@sergen.pe");
      }
      return { ...prev, marca, correo };
    });
  };

  const updateItem = (index: number, field: keyof CotizacionItem, value: string | number) => {
    const newItems = [...data.items];
    const item = { ...newItems[index], [field]: value };
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
    updateData("items", data.items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Marca / Logo */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Marca</h3>
        <Select value={data.marca} onValueChange={(v) => handleMarcaChange(v as CotizacionMarca)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sergen">SERGEN</SelectItem>
            <SelectItem value="incoser">INCOSER</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subir Excel */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleExcelUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-8 text-xs gap-2"
        >
          <Upload className="h-3.5 w-3.5" /> Cargar datos desde Excel
        </Button>
        <p className="text-[10px] text-muted-foreground mt-1">
          Tabla con columnas: Descripción, Código, Precio, Cantidad
        </p>
      </div>

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
            <Input value={data.numero_cotizacion} readOnly className="h-8 text-xs bg-muted" />
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
          <div className="col-span-2">
            <Label className="text-xs">Asesor</Label>
            <Select onValueChange={handleAsesorChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Seleccionar asesor" />
              </SelectTrigger>
              <SelectContent>
                {sergenUsers.map(user => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Teléfono</Label>
            <Input value={data.telefono} onChange={e => updateData("telefono", e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
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
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeItem(idx)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
              <div>
                <Label className="text-xs">Descripción</Label>
                <Textarea value={item.descripcion} onChange={e => updateItem(idx, "descripcion", e.target.value)} className="text-xs min-h-[60px]" />
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Términos y Condiciones</h3>
          <Button variant="outline" size="sm" onClick={() => updateData("terminos_items", [...data.terminos_items, ""])} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Agregar
          </Button>
        </div>
        <div className="space-y-2">
          {data.terminos_items.map((term, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-xs font-medium mt-2 min-w-[20px]">{idx + 1}.</span>
              <Textarea
                value={term}
                onChange={e => {
                  const newItems = [...data.terminos_items];
                  newItems[idx] = e.target.value;
                  updateData("terminos_items", newItems);
                }}
                className="text-xs min-h-[50px] flex-1"
              />
              {data.terminos_items.length > 1 && (
                <Button variant="ghost" size="icon" className="h-6 w-6 mt-1" onClick={() => {
                  const newItems = data.terminos_items.filter((_, i) => i !== idx);
                  updateData("terminos_items", newItems);
                }}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cuentas bancarias */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Datos Bancarios</h3>
        <p className="text-xs text-muted-foreground mb-2">Se actualizan automáticamente según la marca seleccionada.</p>
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
