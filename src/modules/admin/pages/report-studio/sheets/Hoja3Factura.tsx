import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReportContext } from "../context/ReportContext";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Search, Loader2, MessageSquareWarning, X, Save } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState, useEffect, useCallback } from "react";

const REGLAS_DEFAULT: Record<string, string> = {
  "Luz del Sur": `Factura de Luz del Sur S.A.A. El concepto de energía en hora punta aparece como "CARGO POR ENERGÍA ACTIVA EN HORAS PUNTA". Fuera de punta: "CARGO POR ENERGÍA ACTIVA EN HORAS FUERA DE PUNTA". Totales: OP. GRAVADAS, OP. INAFECTAS, OP. EXONERADA, OP. GRATUITA, OTROS CARGOS, OTROS DESCUENTOS, SUBTOTAL, ISC, IGV, IMPORTE TOTAL DE LA VENTA.`,
  "Enel": `Factura de Enel Distribución Perú S.A.A. HP: "ENERGÍA HORA PUNTA" o "ENERGÍA ACTIVA HP". HFP: "ENERGÍA HORA FUERA PUNTA" o "ENERGÍA ACTIVA HFP". Totales: OP. GRAVADAS, OP. INAFECTAS, OP. EXONERADA, OP. GRATUITA, OTROS CARGOS, OTROS DESCUENTOS, SUBTOTAL, ISC, IGV, IMPORTE TOTAL DE LA VENTA.`,
  "Electrocentro": `Factura de Electrocentro S.A. Buscar conceptos de energía activa en hora punta y fuera de punta. Totales: OP. GRAVADAS, OP. INAFECTAS, OP. EXONERADA, SUBTOTAL, IGV, IMPORTE TOTAL.`,
};

const Hoja3Factura = () => {
  const { data, updateSheet } = useReportContext();
  const { session } = useAuthContext();
  const h3 = data.hoja3_data;
  const h4 = data.hoja4_data;
  const dg = data.datos_generales;
  const concesionaria = dg.concesionaria || "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [nuevoExonerado, setNuevoExonerado] = useState("");
  const [savingKeywords, setSavingKeywords] = useState(false);

  const update = (field: string, value: any) => {
    updateSheet("hoja3_data", { ...h3, [field]: value });
  };

  // Load saved rules from past reports for this concesionaria
  const getReglas = useCallback((): string => {
    if (h3.reglas_extraccion) return h3.reglas_extraccion;
    return REGLAS_DEFAULT[concesionaria] || "";
  }, [h3.reglas_extraccion, concesionaria]);

  // Load rules from last report of same concesionaria
  useEffect(() => {
    if (!concesionaria || h3.reglas_extraccion) return;
    supabase
      .from("reportes_control_demanda" as any)
      .select("hoja3_data, datos_generales")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data: rows }) => {
        if (!rows) return;
        const match = (rows as any[]).find(
          (r) => r.datos_generales?.concesionaria === concesionaria && r.hoja3_data?.reglas_extraccion
        );
        if (match) {
          update("reglas_extraccion", match.hoja3_data.reglas_extraccion);
        }
      });
  }, [concesionaria]);

  // Auto-load exonerado keywords from DB for this concesionaria
  useEffect(() => {
    if (!concesionaria) return;
    supabase
      .from("concesionaria_potencia_keywords")
      .select("inafecto_keywords")
      .eq("concesionaria", concesionaria)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row && (row as any).inafecto_keywords?.length > 0 && (!h4.conceptos_exonerados || h4.conceptos_exonerados.length === 0)) {
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
    if (nuevoExonerado.trim()) {
      updateSheet("hoja4_data", {
        ...h4,
        conceptos_exonerados: [...(h4.conceptos_exonerados || []), nuevoExonerado.trim().toUpperCase()],
      });
      setNuevoExonerado("");
    }
  };

  const eliminarExonerado = (idx: number) => {
    const updated = [...(h4.conceptos_exonerados || [])];
    updated.splice(idx, 1);
    updateSheet("hoja4_data", { ...h4, conceptos_exonerados: updated });
  };

  const extractData = async (fileUrl: string, reglas?: string) => {
    updateSheet("hoja3_data", { ...h3, extracting: true });
    try {
      const reglasToUse = reglas || getReglas();
      const exoneradoKeywords = data.hoja4_data?.conceptos_exonerados || [];
      const { data: result, error } = await supabase.functions.invoke("extract-invoice-data", {
        body: {
          image_url: fileUrl,
          nombre_hp: h3.nombre_hp,
          nombre_hfp: h3.nombre_hfp,
          reglas_concesionario: reglasToUse,
          concesionaria,
          exonerado_keywords: exoneradoKeywords,
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
        op_gravadas: extracted.op_gravadas ?? h3.op_gravadas,
        op_inafectas: extracted.op_inafectas ?? h3.op_inafectas,
        op_exonerada: extracted.op_exonerada ?? h3.op_exonerada,
        op_gratuita: extracted.op_gratuita ?? h3.op_gratuita,
        otros_cargos: extracted.otros_cargos ?? h3.otros_cargos,
        otros_descuentos: extracted.otros_descuentos ?? h3.otros_descuentos,
        subtotal: extracted.subtotal ?? h3.subtotal,
        isc: extracted.isc ?? h3.isc,
        igv: extracted.igv ?? h3.igv,
        importe_total: extracted.importe_total ?? h3.importe_total,
        reglas_extraccion: reglasToUse,
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
    setShowFeedback(false);
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

  // Use AI to auto-adjust rules based on user feedback
  const handleAdjustRules = async () => {
    if (!feedback.trim()) {
      toast.error("Describe el problema de extracción");
      return;
    }
    setAdjusting(true);
    try {
      const currentRules = getReglas();
      const { data: result, error } = await supabase.functions.invoke("extract-invoice-data", {
        body: {
          adjust_rules: true,
          current_rules: currentRules,
          user_feedback: feedback,
          concesionaria,
        },
      });
      if (error) throw error;
      const newRules = result?.new_rules || currentRules;
      update("reglas_extraccion", newRules);
      toast.success("Reglas actualizadas. Re-extrayendo datos...");
      setShowFeedback(false);
      setFeedback("");

      // Re-extract with updated rules
      if (h3.factura_file_url) {
        await extractData(h3.factura_file_url, newRules);
      }
    } catch (err: any) {
      toast.error("Error al ajustar reglas: " + (err.message || ""));
    } finally {
      setAdjusting(false);
    }
  };

  const isProcessing = uploading || h3.extracting;
  const hasExtractedData = h3.factura_file_url && !isProcessing && (h3.items?.length > 0 || h3.importe_total > 0);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Factura Emitida</h3>

      {/* Concesionario indicator */}
      {concesionaria && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
          <span>Concesionaria:</span>
          <span className="font-semibold text-foreground">{concesionaria}</span>
        </div>
      )}

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

        {/* Feedback section - only after extraction with data */}
        {hasExtractedData && (
          <div className="pt-1">
            {!showFeedback ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedback(true)}
                className="h-7 text-xs text-muted-foreground w-full"
              >
                <MessageSquareWarning className="w-3 h-3 mr-1" />
                ¿Hay errores en la extracción? Reportar
              </Button>
            ) : (
              <div className="border border-orange-300 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 space-y-2">
                <p className="text-[10px] text-orange-700 dark:text-orange-400 font-medium">
                  Describe qué datos no se extrajeron bien o qué nombre tiene el concepto en la factura:
                </p>
                <Textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={3}
                  className="text-xs"
                  placeholder={`Ej: "El precio HP aparece como 'CARGO ENERGÍA PUNTA' y no se extrajo", "El IGV está mal calculado", "No reconoció los ítems de la segunda página"...`}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAdjustRules}
                    disabled={adjusting || !feedback.trim()}
                    className="flex-1 h-7 text-xs"
                  >
                    {adjusting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                    {adjusting ? "Ajustando..." : "Corregir y re-extraer"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowFeedback(false); setFeedback(""); }}
                    className="h-7 text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reglas Exonerados por Concesionaria */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">⚙ Reglas Exonerados</p>
        <p className="text-[10px] text-muted-foreground">
          Conceptos exonerados para <strong>{concesionaria || "esta concesionaria"}</strong>.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Ej: FISE, INTERES MORATORIO"
            value={nuevoExonerado}
            onChange={(e) => setNuevoExonerado(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarExonerado()}
            className="h-8 text-sm"
          />
          <Button onClick={agregarExonerado} size="sm" className="h-8">Agregar</Button>
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
              <Button onClick={saveKeywordsForConcesionaria} size="sm" variant="outline" disabled={savingKeywords} className="text-xs h-7">
                <Save className="w-3 h-3 mr-1" />
                {savingKeywords ? "Guardando..." : `Guardar para ${concesionaria}`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Hoja3Factura;
