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
import { mergeExtractionRules, resolveExtractedInvoicePrices, splitStoredRuleEntries } from "../utils/invoiceExtractionRules";

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
  const [savingRules, setSavingRules] = useState(false);
  const keywordsLoadedRef = useRef(false);

  const update = (field: string, value: any) => {
    updateSheet("hoja3_data", { ...h3, [field]: value });
  };

  // Load saved rules from DB for this concesionaria
  const getReglas = useCallback((): string => {
    if (h3.reglas_extraccion) return h3.reglas_extraccion;
    return REGLAS_DEFAULT[concesionaria] || "";
  }, [h3.reglas_extraccion, concesionaria]);

  // Auto-load persisted config for this concesionaria (only once)
  useEffect(() => {
    keywordsLoadedRef.current = false;
  }, [concesionaria]);

  useEffect(() => {
    if (!concesionaria || keywordsLoadedRef.current) return;
    keywordsLoadedRef.current = true;
    supabase
      .from("concesionaria_potencia_keywords")
      .select("inafecto_keywords, reglas_extraccion")
      .eq("concesionaria", concesionaria)
      .maybeSingle()
      .then(({ data: row }) => {
        if (!row) return;

        const savedRules = typeof (row as any).reglas_extraccion === "string" ? (row as any).reglas_extraccion : "";
        const { taxKeywords, ruleHints } = splitStoredRuleEntries((row as any).inafecto_keywords || []);
        const mergedRules = mergeExtractionRules(savedRules, ...ruleHints);

        if (mergedRules && !h3.reglas_extraccion) {
          update("reglas_extraccion", mergedRules);
        }

        if (taxKeywords.length > 0 && (!h4.conceptos_exonerados || h4.conceptos_exonerados.length === 0)) {
          updateSheet("hoja4_data", {
            ...h4,
            conceptos_exonerados: taxKeywords,
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
      toast.success(`Conceptos no gravados guardados para ${concesionaria}`);
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

  const eliminarExonerado = async (idx: number) => {
    const updated = [...(h4.conceptos_exonerados || [])];
    updated.splice(idx, 1);
    updateSheet("hoja4_data", { ...h4, conceptos_exonerados: updated });
    // If all removed, also clear in DB so they don't reload
    if (updated.length === 0 && concesionaria) {
      const { data: existing } = await supabase
        .from("concesionaria_potencia_keywords")
        .select("id")
        .eq("concesionaria", concesionaria)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("concesionaria_potencia_keywords")
          .update({ inafecto_keywords: [] } as any)
          .eq("concesionaria", concesionaria);
        toast.info("Reglas eliminadas para " + concesionaria);
      }
    }
  };

  async function saveRulesToDB(rules: string, showToast = false) {
    if (!concesionaria) return;

    const cleanedRules = rules.trim();
    setSavingRules(true);

    try {
      const { data: existing } = await supabase
        .from("concesionaria_potencia_keywords")
        .select("id")
        .eq("concesionaria", concesionaria)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("concesionaria_potencia_keywords")
          .update({ reglas_extraccion: cleanedRules } as any)
          .eq("concesionaria", concesionaria);
      } else if (cleanedRules) {
        await supabase
          .from("concesionaria_potencia_keywords")
          .insert({ concesionaria, reglas_extraccion: cleanedRules } as any);
      }

      if (showToast) {
        toast.success(cleanedRules ? `Reglas de extracción guardadas para ${concesionaria}` : `Reglas de extracción limpiadas para ${concesionaria}`);
      }
    } catch (err: any) {
      if (showToast) {
        toast.error("Error al guardar reglas: " + (err.message || ""));
      } else {
        console.error("Error saving rules to DB:", err);
      }
    } finally {
      setSavingRules(false);
    }
  }

  const extractData = async (fileUrl: string, reglas?: string) => {
    updateSheet("hoja3_data", { ...h3, extracting: true });
    try {
      const { taxKeywords, ruleHints } = splitStoredRuleEntries(data.hoja4_data?.conceptos_exonerados || []);
      const reglasToUse = mergeExtractionRules(reglas || getReglas(), ...ruleHints);

      await saveRulesToDB(reglasToUse);

      const { data: result, error } = await supabase.functions.invoke("extract-invoice-data", {
        body: {
          image_url: fileUrl,
          nombre_hp: h3.nombre_hp,
          nombre_hfp: h3.nombre_hfp,
          reglas_concesionario: reglasToUse,
          concesionaria,
          exonerado_keywords: taxKeywords,
        },
      });
      if (error) throw error;
      const extracted = result?.data || {};
      const { precioHp, precioHfp, adjusted } = resolveExtractedInvoicePrices({
        items: extracted.items,
        precioHp: extracted.precio_hp,
        precioHfp: extracted.precio_hfp,
        rules: reglasToUse,
      });

      updateSheet("hoja3_data", {
        ...h3,
        extracting: false,
        factura_file_url: fileUrl,
        numero_factura: extracted.numero_factura || h3.numero_factura,
        fecha_factura: extracted.fecha_factura || h3.fecha_factura,
        ruc: extracted.ruc || h3.ruc,
        razon_social: extracted.razon_social || h3.razon_social,
        precio_hp_facturado: precioHp ?? extracted.precio_hp ?? h3.precio_hp_facturado,
        precio_hfp_facturado: precioHfp ?? extracted.precio_hfp ?? h3.precio_hfp_facturado,
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
      if (adjusted) {
        toast.info("Se ajustaron los precios HP/HFP según tus reglas de extracción");
      }
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
      await saveRulesToDB(newRules);
      toast.success("Reglas actualizadas y guardadas. Re-extrayendo datos...");
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
              <div className="border border-border bg-muted/40 rounded-lg p-3 space-y-2">
                <p className="text-[10px] text-foreground font-medium">
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

      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">⚙ Reglas de extracción</p>
            <p className="text-[10px] text-muted-foreground">
              Estas reglas sí afectan los precios HP/HFP y se guardan por concesionaria.
            </p>
          </div>
          {concesionaria && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => saveRulesToDB(h3.reglas_extraccion, true)}
              disabled={savingRules}
              className="h-7 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              {savingRules ? "Guardando..." : `Guardar para ${concesionaria}`}
            </Button>
          )}
        </div>
        <Textarea
          value={h3.reglas_extraccion}
          onChange={(e) => update("reglas_extraccion", e.target.value)}
          rows={4}
          className="text-xs"
          placeholder={REGLAS_DEFAULT[concesionaria] || "Ej: ambos precios deben ser mayores a 0.10 y si hay varios cargos de energía debe sumarse el valor unitario del bloque correspondiente."}
        />
      </div>

      {/* Reglas Exonerados por Concesionaria */}
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">⚙ Conceptos no gravados</p>
        <p className="text-[10px] text-muted-foreground">
          Estos conceptos solo clasifican ítems como inafecta/exonerado para <strong>{concesionaria || "esta concesionaria"}</strong>. No cambian los precios HP/HFP.
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
  );
};

export default Hoja3Factura;
