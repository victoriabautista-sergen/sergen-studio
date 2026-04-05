import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { externalSupabase } from "@/integrations/externalSupabase/client";

export type ViewMode = "current" | "previous";

export interface PowerDataPoint {
  fecha: string;
  ejecutado: number;
  hora?: number;
  minuto?: number;
}

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const getMonthRange = (mode: ViewMode): { from: string; to: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (mode === "current") {
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    return { from, to: "2099-12-31" };
  } else {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const from = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    const to = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { from, to };
  }
};

export const getMonthLabel = (mode: ViewMode): string => {
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();
  if (mode === "previous") {
    month = month === 0 ? 11 : month - 1;
    year = month === 11 && now.getMonth() === 0 ? year - 1 : year;
  }
  return `${MONTH_NAMES[month]} ${year}`;
};

export const useHistoricalPowerData = (viewMode: ViewMode = "current") => {
  const [data, setData] = useState<PowerDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (viewMode === "current") {
        const { from, to } = getMonthRange("current");

        const { data: rows, error: dbError } = await externalSupabase
          .from("potencia_hora_punta" as any)
          .select("fecha, max_demanda, hora, minuto")
          .gte("fecha", from)
          .lte("fecha", to)
          .order("fecha", { ascending: true });

        if (dbError) throw new Error(dbError.message);

        if (!rows || rows.length === 0) {
          setError("Sin datos disponibles");
          return;
        }

        const seen = new Set<string>();
        const converted: PowerDataPoint[] = [];
        for (const item of rows as any[]) {
          const fecha = item.fecha.split("T")[0];
          if (seen.has(fecha)) continue;
          seen.add(fecha);
          converted.push({
            fecha,
            ejecutado: Number(item.max_demanda),
            hora: item.hora != null ? Number(item.hora) : undefined,
            minuto: item.minuto != null ? Number(item.minuto) : undefined,
          });
        }
        setData(converted);
      } else {
        // Mes anterior: tabla potencia_hora_punta_historica
        const { data: rows, error: dbError } = await externalSupabase
          .from("potencia_hora_punta_historica" as any)
          .select("fecha, potencia_maxima, hora, minuto")
          .order("fecha", { ascending: true });

        if (dbError) throw new Error(dbError.message);

        if (!rows || rows.length === 0) {
          setError("Sin datos disponibles");
          return;
        }

        const seen = new Set<string>();
        const converted: PowerDataPoint[] = [];
        for (const item of rows as any[]) {
          const fecha = String(item.fecha).split("T")[0];
          if (seen.has(fecha)) continue;
          seen.add(fecha);
          converted.push({
            fecha,
            ejecutado: Number(item.potencia_maxima),
            hora: item.hora != null ? Number(item.hora) : undefined,
            minuto: item.minuto != null ? Number(item.minuto) : undefined,
          });
        }
        setData(converted);
      }
    } catch (err: any) {
      console.error("Error fetching power data:", err);
      setError(`Error: ${err.message}`);
      toast.error("Error al cargar datos de potencia");
    } finally {
      setIsLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};
