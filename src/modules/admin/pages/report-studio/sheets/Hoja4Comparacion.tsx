import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useReportContext } from "../context/ReportContext";
import { X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Hoja4Comparacion = () => {
  const { data, updateSheet } = useReportContext();
  const h4 = data.hoja4_data;
  const h3 = data.hoja3_data;
  const concesionaria = data.datos_generales.concesionaria || "";

  const [nuevoExonerado, setNuevoExonerado] = useState("");
  const [savingKeywords, setSavingKeywords] = useState(false);

  useEffect(() => {
    if (!concesionaria) return;

    supabase
      .from("concesionaria_potencia_keywords")
      .select("inafecto_keywords")
      .eq("concesionaria", concesionaria)
      .maybeSingle()
      .then(({ data: row }) => {
        if (
          row &&
          (row as any).inafecto_keywords?.length > 0 &&
          (!h4.conceptos_exonerados || h4.conceptos_exonerados.length === 0)
        ) {
          updateSheet("hoja4_data", {
            ...h4,
            conceptos_exonerados: (row as any).inafecto_keywords,
          });
        }
      });
  }, [concesionaria]);

  const saveKeywordsForConcesionaria = async () => {
    if (!concesionaria || !h4.conceptos_exonerados?.length) return;

    setSavingKeywords(true);
    try {
      const { data: existing } = await supabase
        .from("concesionaria_potencia_keywords")
        .select("id")
        .eq("concesionaria", concesionaria)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("concesionaria_potencia_keywords")
          .update({ inafecto_keywords: h4.conceptos_exonerados } as any)
          .eq("concesionaria", concesionaria);
      } else {
        await supabase
          .from("concesionaria_potencia_keywords")
          .insert({ concesionaria, inafecto_keywords: h4.conceptos_exonerados } as any);
      }

      toast.success(`Reglas exonerados guardadas para ${concesionaria}`);
    } catch (err: any) {
      toast.error("Error al guardar: " + (err.message || ""));
    } finally {
      setSavingKeywords(false);
    }
  };

  const agregarExonerado = () => {
    if (!nuevoExonerado.trim()) return;

    updateSheet("hoja4_data", {
      ...h4,
      conceptos_exonerados: [...(h4.conceptos_exonerados || []), nuevoExonerado.trim().toUpperCase()],
    });
    setNuevoExonerado("");
  };

  const eliminarExonerado = (idx: number) => {
    const updated = [...(h4.conceptos_exonerados || [])];
    updated.splice(idx, 1);
    updateSheet("hoja4_data", { ...h4, conceptos_exonerados: updated });
  };

  const itemsNoGravados = h3.items.filter(
    (item) => item.tipo === "exonerado" || item.tipo === "inafecta" || (item.tipo as string) === "inafecto"
  );

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2">⚙ Reglas Exonerados por Concesionaria</h3>
      <p className="text-xs text-muted-foreground">
        Estos conceptos se usan como regla para la extracción IA de futuras facturas de <strong>{concesionaria || "esta concesionaria"}</strong>.
      </p>

      <div className="flex gap-2">
        <Input
          placeholder="Ej: FISE, INTERES MORATORIO"
          value={nuevoExonerado}
          onChange={(e) => setNuevoExonerado(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && agregarExonerado()}
        />
        <Button onClick={agregarExonerado} size="sm">Agregar</Button>
      </div>

      {(h4.conceptos_exonerados || []).length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {h4.conceptos_exonerados.map((c, i) => (
              <span key={i} className="bg-muted px-2 py-1 rounded text-xs flex items-center gap-1">
                {c}
                <X className="w-3 h-3 cursor-pointer" onClick={() => eliminarExonerado(i)} />
              </span>
            ))}
          </div>

          {concesionaria && (
            <Button
              onClick={saveKeywordsForConcesionaria}
              size="sm"
              variant="outline"
              disabled={savingKeywords}
              className="text-xs h-7"
            >
              <Save className="w-3 h-3 mr-1" />
              {savingKeywords ? "Guardando..." : `Guardar para ${concesionaria}`}
            </Button>
          )}
        </div>
      )}

      {itemsNoGravados.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">📋 Ítems No Gravados Detectados</h3>
          <p className="text-xs text-muted-foreground">
            Ítems clasificados como exonerados o inafectos en la factura actual. Esta clasificación puede variar entre concesionarias.
          </p>
          <div className="space-y-1">
            {itemsNoGravados.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-muted rounded px-2 py-1.5 text-xs">
                <div className="flex items-center gap-2 truncate max-w-[250px]">
                  <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">
                    {item.tipo === "inafecta" || (item.tipo as string) === "inafecto" ? "inafecta" : "exonerado"}
                  </span>
                  <span title={item.descripcion}>{item.descripcion}</span>
                </div>
                <span className="font-mono ml-2 whitespace-nowrap">
                  {item.valor_venta?.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Hoja4Comparacion;
