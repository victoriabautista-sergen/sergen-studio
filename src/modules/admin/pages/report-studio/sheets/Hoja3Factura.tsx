import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useReportContext } from "../context/ReportContext";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Search, Loader2 } from "lucide-react";
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

  const extractData = async (fileUrl: string) => {
    updateSheet("hoja3_data", { ...h3, extracting: true });
    try {
      const { data: result, error } = await supabase.functions.invoke("extract-invoice-data", {
        body: {
          image_url: fileUrl,
          nombre_hp: h3.nombre_hp,
          nombre_hfp: h3.nombre_hfp,
        },
      });
      if (error) throw error;
      const extracted = result?.data || {};
      updateSheet("hoja3_data", {
        ...h3,
        extracting: false,
        factura_file_url: fileUrl,
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
      updateSheet("hoja3_data", { ...h3, extracting: false, factura_file_url: fileUrl });
      toast.error("Error al extraer datos: " + (err.message || "Revisa los campos manualmente"));
    }
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

      toast.success("Factura subida, extrayendo datos...");
      await extractData(result.url);
    } catch (err: any) {
      toast.error("Error al subir la factura: " + (err.message || ""));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isProcessing = uploading || h3.extracting;

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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
          {uploading ? "Subiendo..." : h3.extracting ? "Extrayendo datos..." : "Seleccionar archivo"}
        </Button>
        {h3.factura_file_url && !isProcessing && (
          <p className="text-[10px] text-muted-foreground truncate">✓ Factura cargada y datos extraídos</p>
        )}
      </div>

      {/* Datos Extraídos */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Datos Extraídos</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => h3.factura_file_url && extractData(h3.factura_file_url)}
            disabled={!h3.factura_file_url || h3.extracting}
            className="h-7 text-xs"
          >
            {h3.extracting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
            Re-extraer
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Precio HP Facturado (V. Unitario)</Label>
            <Input type="number" step="any" value={h3.precio_hp_facturado || ""} onChange={e => update("precio_hp_facturado", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Precio HFP Facturado (V. Unitario)</Label>
            <Input type="number" step="any" value={h3.precio_hfp_facturado || ""} onChange={e => update("precio_hfp_facturado", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
        </div>

        {(h3.precio_hp_facturado === 0 || h3.precio_hfp_facturado === 0) && (
          <div className="border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 space-y-2">
            <p className="text-[10px] text-yellow-700 dark:text-yellow-400 font-medium">
              ⚠ No se reconocieron los precios. Indica el nombre del concepto y presiona "Re-extraer":
            </p>
            {h3.precio_hp_facturado === 0 && (
              <div>
                <Label className="text-xs">Concepto Energía HP (como aparece en factura)</Label>
                <Input value={h3.nombre_hp} onChange={e => update("nombre_hp", e.target.value)} className="h-8 text-sm" placeholder="ENERGÍA ACTIVA EN HORA PUNTA" />
              </div>
            )}
            {h3.precio_hfp_facturado === 0 && (
              <div>
                <Label className="text-xs">Concepto Energía HFP (como aparece en factura)</Label>
                <Input value={h3.nombre_hfp} onChange={e => update("nombre_hfp", e.target.value)} className="h-8 text-sm" placeholder="ENERGÍA ACTIVA EN HORA FUERA DE PUNTA" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hoja3Factura;
