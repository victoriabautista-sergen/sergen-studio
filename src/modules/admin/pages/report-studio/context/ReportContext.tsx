import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { ReportData, defaultReportData } from "../types";
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

  // Autosave debounced
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
    <ReportContext.Provider value={{ data, activeSheet, setActiveSheet, updateSheet, saving, loadReport, createNew }}>
      {children}
    </ReportContext.Provider>
  );
};
