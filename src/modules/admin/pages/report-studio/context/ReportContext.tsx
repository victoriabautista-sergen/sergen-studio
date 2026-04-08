import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"; // v2
import { ReportData, defaultReportData, Hoja4Item } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import { toast } from "sonner";

interface ReportContextType {
  data: ReportData;
  activeSheet: number;
  setActiveSheet: (s: number) => void;
  updateSheet: <K extends keyof ReportData>(key: K, value: ReportData[K]) => void;
  saving: boolean;
  loadReport: (id: string) => Promise<void>;
  createNew: () => void;
  hiddenPages: Set<number>;
  togglePageVisibility: (page: number) => void;
}

const ReportContext = createContext<ReportContextType | null>(null);

export const useReportContext = () => {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error("useReportContext must be used within ReportProvider");
  return ctx;
};

export const ReportProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<ReportData>(defaultReportData);
  const [activeSheet, setActiveSheet] = useState(1);
  const [saving, setSaving] = useState(false);
  const [hiddenPages, setHiddenPages] = useState<Set<number>>(new Set());

  const togglePageVisibility = useCallback((page: number) => {
    setHiddenPages(prev => {
      const next = new Set(prev);
      if (next.has(page)) {
        next.delete(page);
      } else {
        next.add(page);
      }
      return next;
    });
  }, []);
  const { session } = useAuthContext();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSheet = useCallback(<K extends keyof ReportData>(key: K, value: ReportData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  // === Hoja4 auto-computation (moved from Hoja4Comparacion editor) ===
  useEffect(() => {
    const h2 = data.hoja2_data;
    const h3 = data.hoja3_data;
    const h4 = data.hoja4_data;

    if (!h3.items || h3.items.length === 0) return;

    const calc_hp = h2.precio_calculado_hp;
    const calc_hfp = h2.precio_calculado_hfp;
    const fact_hp = h3.precio_hp_facturado;
    const fact_hfp = h3.precio_hfp_facturado;
    const diff_hp = +(fact_hp - calc_hp).toFixed(5);
    const diff_hfp = +(fact_hfp - calc_hfp).toFixed(5);

    const items_recalculados: Hoja4Item[] = h3.items.map((item) => {
      const descUpper = item.descripcion.toUpperCase();
      const isHP = descUpper.includes(h3.nombre_hp.toUpperCase());
      const isHFP = descUpper.includes(h3.nombre_hfp.toUpperCase());
      const isEnergy = isHP || isHFP;

      let tipo: "gravado" | "exonerado" = "gravado";
      if (item.tipo === "exonerado" || (item.tipo as string) === "inafecto") {
        tipo = "exonerado";
      }

      let valor_unitario_calc = item.valor_unitario;
      let valor_venta_calc = item.valor_venta;

      if (isHP) {
        valor_unitario_calc = calc_hp;
        valor_venta_calc = +(item.cantidad * calc_hp).toFixed(2);
      } else if (isHFP) {
        valor_unitario_calc = calc_hfp;
        valor_venta_calc = +(item.cantidad * calc_hfp).toFixed(2);
      }

      return {
        descripcion: item.descripcion,
        unidad: item.unidad,
        cantidad: item.cantidad,
        tipo,
        valor_unitario_original: item.valor_unitario,
        valor_venta_original: item.valor_venta,
        valor_unitario_calc,
        valor_venta_calc,
        is_energy: isEnergy,
      };
    });

    const subtotal_afecto = +items_recalculados
      .filter(i => i.tipo === "gravado")
      .reduce((sum, i) => sum + i.valor_venta_calc, 0)
      .toFixed(2);
    const igv_recalculado = +(subtotal_afecto * 0.18).toFixed(2);
    const total_recalculado = +(subtotal_afecto + igv_recalculado).toFixed(2);

    const energiaHP = h3.items.find(i => i.descripcion.toUpperCase().includes(h3.nombre_hp.toUpperCase()));
    const energiaHFP = h3.items.find(i => i.descripcion.toUpperCase().includes(h3.nombre_hfp.toUpperCase()));
    const cantHP = energiaHP?.cantidad || 0;
    const cantHFP = energiaHFP?.cantidad || 0;

    const impactoHP = +(cantHP * diff_hp).toFixed(2);
    const impactoHFP = +(cantHFP * diff_hfp).toFixed(2);
    const impacto = +(Math.abs(impactoHP) + Math.abs(impactoHFP)).toFixed(3);

    const pagoMas = impacto > 0;
    const conclusion = `Considerando las cantidades facturadas de ${cantHP.toLocaleString("es-PE")} kWh (HP) y ${cantHFP.toLocaleString("es-PE")} kWh (HFP), la diferencia de precios representa un impacto económico de S/ ${impacto.toLocaleString("es-PE", { minimumFractionDigits: 2 })} que el cliente ${pagoMas ? "pagó de más" : "ahorró"} respecto al precio calculado según contrato.`;

    setData(prev => ({
      ...prev,
      hoja4_data: {
        ...prev.hoja4_data,
        items_recalculados,
        subtotal_afecto,
        igv_recalculado,
        total_recalculado,
        precio_calculado_hp: calc_hp,
        precio_calculado_hfp: calc_hfp,
        precio_facturado_hp: fact_hp,
        precio_facturado_hfp: fact_hfp,
        diferencia_hp: diff_hp,
        diferencia_hfp: diff_hfp,
        impacto_economico: impacto,
        conclusion,
      },
    }));
  }, [data.hoja2_data.precio_actualizado_hp, data.hoja2_data.precio_actualizado_hfp, data.hoja3_data.precio_hp_facturado, data.hoja3_data.precio_hfp_facturado, data.hoja3_data.items, data.hoja3_data.nombre_hp, data.hoja3_data.nombre_hfp]);


  useEffect(() => {
    if (!data.client_id || !session?.user?.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const payload = {
          client_id: data.client_id,
          mes: data.mes,
          anio: data.anio,
          datos_generales: data.datos_generales as any,
          hoja2_data: data.hoja2_data as any,
          hoja3_data: data.hoja3_data as any,
          hoja4_data: data.hoja4_data as any,
          hoja5_data: data.hoja5_data as any,
          hoja6_data: data.hoja6_data as any,
          hoja7_data: data.hoja7_data as any,
          created_by: session.user.id,
        };

        if (data.id) {
          await supabase
            .from("reportes_control_demanda" as any)
            .update(payload)
            .eq("id", data.id);
        } else {
          const { data: inserted } = await supabase
            .from("reportes_control_demanda" as any)
            .insert(payload)
            .select("id")
            .single();
          if (inserted) {
            setData(prev => ({ ...prev, id: (inserted as any).id }));
          }
        }

        // Persist base values to clients.contract_info for this company
        const h2 = data.hoja2_data;
        const contractInfo = {
          concesionaria: data.datos_generales.concesionaria || "",
          ultimo_correlativo: data.datos_generales.numero_informe || "",
          hoja2_defaults: {
            precio_base_hp: h2.precio_base_hp,
            precio_base_hfp: h2.precio_base_hfp,
            precio_potencia: h2.precio_potencia,
            moneda: h2.moneda,
            png_moneda: h2.png_moneda,
            png_actual_moneda: h2.png_actual_moneda,
            pngo: h2.pngo,
            tco: h2.tco,
            ippo: h2.ippo,
            factor_perdida: h2.factor_perdida,
            formula: h2.formula,
            formula_calculo: h2.formula_calculo,
          },
        };
        await supabase
          .from("clients")
          .update({ contract_info: contractInfo })
          .eq("id", data.client_id);
      } catch (e) {
        console.error("Autosave error:", e);
      } finally {
        setSaving(false);
      }
    }, 2000);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, session?.user?.id]);

  const loadReport = useCallback(async (id: string) => {
    const { data: row } = await supabase
      .from("reportes_control_demanda" as any)
      .select("*")
      .eq("id", id)
      .single();
    if (row) {
      const r = row as any;
      setData({
        id: r.id,
        client_id: r.client_id,
        mes: r.mes,
        anio: r.anio,
        datos_generales: r.datos_generales || defaultReportData.datos_generales,
        hoja2_data: r.hoja2_data || defaultReportData.hoja2_data,
        hoja3_data: r.hoja3_data || defaultReportData.hoja3_data,
        hoja4_data: r.hoja4_data || defaultReportData.hoja4_data,
        hoja5_data: r.hoja5_data || defaultReportData.hoja5_data,
        hoja6_data: r.hoja6_data || defaultReportData.hoja6_data,
        hoja7_data: r.hoja7_data || defaultReportData.hoja7_data,
      });
    }
  }, []);

  const createNew = useCallback(() => {
    setData(defaultReportData);
    setActiveSheet(1);
  }, []);

  return (
    <ReportContext.Provider value={{ data, activeSheet, setActiveSheet, updateSheet, saving, loadReport, createNew, hiddenPages, togglePageVisibility }}>
      {children}
    </ReportContext.Provider>
  );
};
