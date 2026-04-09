import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"; // v2
import { ReportData, defaultReportData } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import { toast } from "sonner";
import { calculateHoja4Data } from "../utils/hoja4Calculation";

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

  useEffect(() => {
    const computedHoja4Data = calculateHoja4Data({
      h2: data.hoja2_data,
      h3: data.hoja3_data,
    });

    if (!computedHoja4Data) return;

    setData(prev => ({
      ...prev,
      hoja4_data: {
        ...prev.hoja4_data,
        ...computedHoja4Data,
      },
    }));
  }, [data.hoja2_data, data.hoja3_data]);


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
