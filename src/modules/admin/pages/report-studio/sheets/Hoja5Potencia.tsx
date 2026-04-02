import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useReportContext } from "../context/ReportContext";

const Hoja5Potencia = () => {
  const { data, updateSheet } = useReportContext();
  const h5 = data.hoja5_data;
  const [uploading, setUploading] = useState(false);

  const update = (field: string, value: any) => {
    updateSheet("hoja5_data", { ...h5, [field]: value });
  };

  const handleUploadEvidencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se aceptan archivos de imagen");
      return;
    }

    try {
      setUploading(true);
      const fileName = `evidencia-alerta-${Date.now()}.${file.name.split(".").pop()}`;
      const filePath = `reportes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chart-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chart-images")
        .getPublicUrl(filePath);

      update("evidencia_alerta_url", urlData.publicUrl);
      toast.success("Imagen de evidencia subida correctamente");
    } catch (err: any) {
      toast.error(`Error al subir imagen: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Potencia Coincidente</h3>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Fecha</Label>
            <Input type="date" value={h5.fecha} onChange={e => update("fecha", e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Hora</Label>
            <Input value={h5.hora} onChange={e => update("hora", e.target.value)} className="h-8 text-sm" placeholder="18:30" />
          </div>
        </div>

        <div>
          <Label className="text-xs">SEIN (MW)</Label>
          <Input type="number" step="any" value={h5.sein_mw || ""} onChange={e => update("sein_mw", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Importación (MW)</Label>
            <Input type="number" step="any" value={h5.importacion || ""} onChange={e => update("importacion", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Exportación (MW)</Label>
            <Input type="number" step="any" value={h5.exportacion || ""} onChange={e => update("exportacion", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
          </div>
        </div>

        <div className="pt-2 border-t">
          <Label className="text-xs">Potencia Coincidente Promedio (kW)</Label>
          <Input
            type="number"
            step="any"
            value={h5.potencia_coincidente_promedio || ""}
            onChange={e => update("potencia_coincidente_promedio", parseFloat(e.target.value) || 0)}
            className="h-8 text-sm font-semibold"
          />
        </div>

        <div className="pt-2 border-t">
          <Label className="text-xs">Evidencia de envío de alerta</Label>
          {h5.evidencia_alerta_url ? (
            <div className="mt-1 space-y-2">
              <img
                src={h5.evidencia_alerta_url}
                alt="Evidencia de alerta"
                className="w-full rounded border object-contain max-h-40"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => update("evidencia_alerta_url", "")}
              >
                <X className="w-3 h-3 mr-1" /> Quitar imagen
              </Button>
            </div>
          ) : (
            <>
              <Input
                type="file"
                id="evidencia-alerta"
                className="hidden"
                accept="image/*"
                onChange={handleUploadEvidencia}
              />
              <Label
                htmlFor="evidencia-alerta"
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-3 text-center block cursor-pointer hover:border-muted-foreground/50 mt-1"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="w-5 h-5 mx-auto text-muted-foreground" />
                )}
                <p className="text-muted-foreground text-xs mt-1">
                  Subir captura del correo de alerta
                </p>
              </Label>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hoja5Potencia;
