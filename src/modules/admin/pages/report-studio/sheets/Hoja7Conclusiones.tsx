import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useReportContext } from "../context/ReportContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Hoja7Conclusiones = () => {
  const { data, updateSheet } = useReportContext();
  const h7 = data.hoja7_data;
  const [nuevaConclusion, setNuevaConclusion] = useState("");
  const [uploading, setUploading] = useState(false);

  const update = (field: string, value: any) => {
    updateSheet("hoja7_data", { ...h7, [field]: value });
  };

  // Auto-generate conclusions
  useEffect(() => {
    const conclusions: string[] = [];
    const h4 = data.hoja4_data;
    const h6 = data.hoja6_data;

    if (Math.abs(h4.impacto_economico) < 500) {
      conclusions.push("El precio de la energía facturado coincide con el cálculo efectuado según contrato para el periodo evaluado.");
    } else {
      conclusions.push(`Se identificó una diferencia de S/ ${h4.impacto_economico.toFixed(2)} en la facturación que requiere atención.`);
    }

    if (h6.diferencia < 0) {
      const mesStr = data.datos_generales.mes?.toLowerCase() || "";
      const anioStr = data.datos_generales.anio || "";
      conclusions.push(`Realizando el control de demanda **logramos ahorrar un promedio de S/ ${Math.abs(h6.diferencia).toFixed(2)}** para el periodo de ${mesStr}-${anioStr.slice(-2)}.`);
    }

    update("conclusiones_auto", conclusions);
  }, [data.hoja4_data.impacto_economico, data.hoja6_data.diferencia, data.datos_generales.mes, data.datos_generales.anio]);

  const handleCalendarioUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `calendario_${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("chart-images").upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("chart-images").getPublicUrl(fileName);
      update("calendario_url", urlData.publicUrl);
      toast.success("Imagen del calendario subida");
    } catch (err: any) {
      toast.error("Error al subir imagen: " + err.message);
    } finally {
      setUploading(false);
    }
  }, [h7]);

  const agregarConclusion = () => {
    if (nuevaConclusion.trim()) {
      const manuales = h7.conclusiones_manuales
        ? h7.conclusiones_manuales + "\n" + nuevaConclusion.trim()
        : nuevaConclusion.trim();
      update("conclusiones_manuales", manuales);
      setNuevaConclusion("");
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2">📅 Modulaciones y Conclusiones</h3>

      {/* Modulación del mes */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <p className="text-sm font-semibold">Modulación del mes</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Días modulados (rojos)</Label>
            <Input
              type="number"
              value={h7.dias_modulados || ""}
              onChange={e => update("dias_modulados", parseInt(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Días libre (verdes)</Label>
            <Input
              type="number"
              value={h7.dias_libres || ""}
              onChange={e => update("dias_libres", parseInt(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Imagen del calendario (se analizará automáticamente)</Label>
          {h7.calendario_url ? (
            <div className="mt-2 space-y-2">
              <img src={h7.calendario_url} alt="Calendario" className="w-full rounded border max-h-[200px] object-contain" />
              <Button variant="outline" size="sm" className="text-xs" onClick={() => update("calendario_url", "")}>
                Cambiar imagen
              </Button>
            </div>
          ) : (
            <label className="mt-2 border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                {uploading ? "Subiendo..." : "Subir imagen del calendario"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCalendarioUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      {/* Conclusiones */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <p className="text-sm font-semibold">Conclusiones adicionales</p>
        <p className="text-xs text-muted-foreground">
          Las conclusiones 1 (factura) y 2 (ahorro) se generan automáticamente. Aquí puede agregar más.
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="Escribir conclusión adicional..."
            value={nuevaConclusion}
            onChange={(e) => setNuevaConclusion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarConclusion()}
            className="text-sm"
          />
          <Button onClick={agregarConclusion} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>

        {h7.conclusiones_manuales && (
          <div className="bg-background rounded p-3 border text-sm space-y-1">
            {h7.conclusiones_manuales.split("\n").filter(Boolean).map((c, i) => (
              <p key={i} className="text-foreground">• {c}</p>
            ))}
            <Button variant="ghost" size="sm" className="text-xs text-destructive mt-1" onClick={() => update("conclusiones_manuales", "")}>
              Limpiar conclusiones manuales
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hoja7Conclusiones;
