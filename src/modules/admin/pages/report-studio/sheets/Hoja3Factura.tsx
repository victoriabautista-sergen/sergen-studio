import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReportContext } from "../context/ReportContext";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Search, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState, useEffect, useCallback } from "react";

const REGLAS_DEFAULT: Record<string, string> = {
  "Luz del Sur": `La factura es de Luz del Sur S.A.A.
- El concepto de energía en hora punta aparece como "CARGO POR ENERGÍA ACTIVA EN HORAS PUNTA" o similar.
- El concepto fuera de punta aparece como "CARGO POR ENERGÍA ACTIVA EN HORAS FUERA DE PUNTA" o similar.
- La sección de totales incluye: OP. GRAVADAS, OP. INAFECTAS, OP. EXONERADA, OP. GRATUITA, OTROS CARGOS, OTROS DESCUENTOS, SUBTOTAL, ISC, IGV, IMPORTE TOTAL DE LA VENTA.`,

  "Enel": `La factura es de Enel Distribución Perú S.A.A.
- El concepto de energía en hora punta puede aparecer como "ENERGÍA HORA PUNTA" o "ENERGÍA ACTIVA HP".
- El concepto fuera de punta puede aparecer como "ENERGÍA HORA FUERA PUNTA" o "ENERGÍA ACTIVA HFP".
- La sección de totales incluye: OP. GRAVADAS, OP. INAFECTAS, OP. EXONERADA, OP. GRATUITA, OTROS CARGOS, OTROS DESCUENTOS, SUBTOTAL, ISC, IGV, IMPORTE TOTAL DE LA VENTA.`,

  "Electrocentro": `La factura es de Electrocentro S.A.
- Buscar los conceptos de energía activa en hora punta y fuera de punta.
- La sección de totales incluye: OP. GRAVADAS, OP. INAFECTAS, OP. EXONERADA, SUBTOTAL, IGV, IMPORTE TOTAL.`,
};

const Hoja3Factura = () => {
  const { data, updateSheet } = useReportContext();
  const { session } = useAuthContext();
  const h3 = data.hoja3_data;
  const dg = data.datos_generales;
  const concesionaria = dg.concesionaria || "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showReglas, setShowReglas] = useState(false);
  const [savedRules, setSavedRules] = useState<Record<string, string>>({});

  const update = (field: string, value: any) => {
    updateSheet("hoja3_data", { ...h3, [field]: value });
  };

  // Load saved extraction rules from past reports for this concesionaria
  useEffect(() => {
    if (!concesionaria) return;
    supabase
      .from("reportes_control_demanda" as any)
      .select("hoja3_data, datos_generales")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data: rows }) => {
        if (!rows) return;
        const rules: Record<string, string> = {};
        (rows as any[]).forEach((r) => {
          const c = r.datos_generales?.concesionaria;
          const reglas = r.hoja3_data?.reglas_extraccion;
          if (c && reglas && !rules[c]) {
            rules[c] = reglas;
          }
        });
        setSavedRules(rules);

        // Auto-load rules for current concesionaria if empty
        if (!h3.reglas_extraccion) {
          const saved = rules[concesionaria] || REGLAS_DEFAULT[concesionaria] || "";
          if (saved) {
            update("reglas_extraccion", saved);
          }
        }
      });
  }, [concesionaria]);

  const getReglas = useCallback(() => {
    return h3.reglas_extraccion || savedRules[concesionaria] || REGLAS_DEFAULT[concesionaria] || "";
  }, [h3.reglas_extraccion, savedRules, concesionaria]);

  const extractData = async (fileUrl: string) => {
    updateSheet("hoja3_data", { ...h3, extracting: true });
    try {
      const reglas = getReglas();
      const { data: result, error } = await supabase.functions.invoke("extract-invoice-data", {
        body: {
          image_url: fileUrl,
          nombre_hp: h3.nombre_hp,
          nombre_hfp: h3.nombre_hfp,
          reglas_concesionario: reglas,
          concesionaria,
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
        reglas_extraccion: reglas,
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

      {/* Reglas de extracción por concesionario */}
      <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Reglas de Extracción {concesionaria ? `– ${concesionaria}` : ""}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowReglas(!showReglas)}
            className="h-7 text-xs"
          >
            <Settings2 className="w-3 h-3 mr-1" />
            {showReglas ? "Ocultar" : "Configurar"}
          </Button>
        </div>

        {!concesionaria && (
          <p className="text-[10px] text-yellow-600">⚠ Selecciona una concesionaria en Datos Generales primero.</p>
        )}

        {showReglas && (
          <div className="space-y-2">
            <Label className="text-xs">
              Instrucciones para la IA (describe cómo es la factura de este concesionario)
            </Label>
            <Textarea
              value={h3.reglas_extraccion || getReglas()}
              onChange={e => update("reglas_extraccion", e.target.value)}
              rows={5}
              className="text-xs"
              placeholder={`Describe el formato de la factura de ${concesionaria || "este concesionario"}:\n- Nombre del concepto de energía HP\n- Nombre del concepto de energía HFP\n- Campos de la sección de totales\n- Cualquier particularidad del formato`}
            />
            <p className="text-[9px] text-muted-foreground">
              Estas reglas se guardarán con el informe y se reutilizarán en futuros informes del mismo concesionario.
            </p>
          </div>
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
              ⚠ No se reconocieron los precios. Ajusta las reglas de extracción y presiona "Re-extraer":
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
