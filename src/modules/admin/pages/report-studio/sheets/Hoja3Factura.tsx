import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useReportContext } from "../context/ReportContext";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";

const Hoja3Factura = () => {
  const { data, updateSheet } = useReportContext();
  const { session } = useAuthContext();
  const h3 = data.hoja3_data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const update = (field: string, value: any) => {
    updateSheet("hoja3_data", { ...h3, [field]: value });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "invoice");
      formData.append("userId", session.user.id);

      const { data: result, error } = await supabase.functions.invoke("upload-file", {
        body: formData,
      });

      if (error) throw error;

      update("factura_file_url", result.url);
      toast.success("Factura subida correctamente");
    } catch (err: any) {
      toast.error("Error al subir la factura: " + (err.message || ""));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExtract = async () => {
    if (!h3.factura_file_url) {
      toast.error("Primero sube una factura");
      return;
    }

    updateSheet("hoja3_data", { ...h3, extracting: true });

    try {
      const { data: result, error } = await supabase.functions.invoke("extract-invoice-data", {
        body: {
          image_url: h3.factura_file_url,
          nombre_hp: h3.nombre_hp,
          nombre_hfp: h3.nombre_hfp,
        },
      });

      if (error) throw error;

      const extracted = result?.data || {};
      updateSheet("hoja3_data", {
        ...h3,
        extracting: false,
        numero_factura: extracted.numero_factura || h3.numero_factura,
        fecha_factura: extracted.fecha_factura || h3.fecha_factura,
        ruc: extracted.ruc || h3.ruc,
        razon_social: extracted.razon_social || h3.razon_social,
        precio_hp_facturado: extracted.precio_hp ?? h3.precio_hp_facturado,
        precio_hfp_facturado: extracted.precio_hfp ?? h3.precio_hfp_facturado,
        items: extracted.items || h3.items,
        subtotal: extracted.subtotal ?? h3.subtotal,
        igv: extracted.igv ?? h3.igv,
        importe_total: extracted.importe_total ?? h3.importe_total,
        otros_cargos: extracted.otros_cargos ?? h3.otros_cargos,
      });

      toast.success("Datos extraídos correctamente");
    } catch (err: any) {
      updateSheet("hoja3_data", { ...h3, extracting: false });
      toast.error("Error al extraer datos: " + (err.message || "Revisa los campos manualmente"));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Factura Emitida</h3>

      {/* Upload section */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Subir Factura</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleUpload}
          className="hidden"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
            {uploading ? "Subiendo..." : "Seleccionar archivo"}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleExtract}
            disabled={!h3.factura_file_url || h3.extracting}
            className="flex-1"
          >
            {h3.extracting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
            {h3.extracting ? "Extrayendo..." : "Extraer datos"}
          </Button>
        </div>
        {h3.factura_file_url && (
          <p className="text-[10px] text-muted-foreground truncate">✓ Factura cargada</p>
        )}
      </div>

      {/* Concept name mapping */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Mapeo de Conceptos</p>
        <p className="text-[10px] text-muted-foreground">
          Escribe el nombre exacto del concepto como aparece en la factura para facilitar la extracción automática.
        </p>
        <div>
          <Label className="text-xs">Concepto Energía HP (como aparece en factura)</Label>
          <Input value={h3.nombre_hp} onChange={e => update("nombre_hp", e.target.value)} className="h-8 text-sm" placeholder="ENERGÍA ACTIVA EN HORA PUNTA" />
        </div>
        <div>
          <Label className="text-xs">Concepto Energía HFP (como aparece en factura)</Label>
          <Input value={h3.nombre_hfp} onChange={e => update("nombre_hfp", e.target.value)} className="h-8 text-sm" placeholder="ENERGÍA ACTIVA EN HORA FUERA DE PUNTA" />
        </div>
      </div>

      {/* Extracted/Manual data */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Datos de la Factura</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">N° Factura</Label>
            <Input value={h3.numero_factura} onChange={e => update("numero_factura", e.target.value)} className="h-8 text-sm" placeholder="F001-00123" />
          </div>
          <div>
            <Label className="text-xs">Fecha</Label>
            <Input value={h3.fecha_factura} onChange={e => update("fecha_factura", e.target.value)} className="h-8 text-sm" placeholder="2026-03-13" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">RUC</Label>
            <Input value={h3.ruc} onChange={e => update("ruc", e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Razón Social</Label>
            <Input value={h3.razon_social} onChange={e => update("razon_social", e.target.value)} className="h-8 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Precio HP Facturado (ctm/kWh)</Label>
            <Input type="number" step="any" value={h3.precio_hp_facturado || ""} onChange={e => update("precio_hp_facturado", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Precio HFP Facturado (ctm/kWh)</Label>
            <Input type="number" step="any" value={h3.precio_hfp_facturado || ""} onChange={e => update("precio_hfp_facturado", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Subtotal</Label>
            <Input type="number" step="any" value={h3.subtotal || ""} onChange={e => update("subtotal", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">IGV</Label>
            <Input type="number" step="any" value={h3.igv || ""} onChange={e => update("igv", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Total</Label>
            <Input type="number" step="any" value={h3.importe_total || ""} onChange={e => update("importe_total", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hoja3Factura;
