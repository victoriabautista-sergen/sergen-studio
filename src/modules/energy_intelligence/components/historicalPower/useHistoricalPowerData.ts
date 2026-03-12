import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { externalSupabase } from "@/integrations/externalSupabase/client";

export interface PowerDataPoint {
  fecha: string;
  ejecutado: number;
}

export const useHistoricalPowerData = () => {
  const [data, setData] = useState<PowerDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: rows, error: dbError } = await externalSupabase
        .from("potencia_hora_punta" as any)
        .select("fecha, potencia_maxima")
        .order("fecha", { ascending: true });

      if (dbError) throw new Error(dbError.message);

      if (!rows || rows.length === 0) {
        setError("No se encontraron datos de potencia en hora punta");
        return;
      }

      const converted: PowerDataPoint[] = (rows as any[]).map((item) => ({
        fecha: item.fecha,
        ejecutado: Number(item.potencia_maxima),
      }));

      setData(converted);
    } catch (err: any) {
      console.error("Error fetching potencia_hora_punta:", err);
      setError(`Error: ${err.message}`);
      toast.error("Error al cargar datos de potencia en hora punta");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};
