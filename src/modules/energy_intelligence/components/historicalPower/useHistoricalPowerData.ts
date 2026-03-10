import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { externalSupabase } from "../../lib/externalSupabase";

export interface PotenciaHoraPunta {
  fecha: string;
  potencia_maxima: number;
}

export interface ChartData {
  date: string;
  value: number;
  fullDate: string;
  color: string;
}

export const useHistoricalPowerData = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await externalSupabase
        .from('potencia_hora_punta')
        .select('fecha, potencia_maxima')
        .order('fecha', { ascending: true });

      if (dbError) throw new Error(dbError.message);

      if (!data || data.length === 0) {
        setError("No se encontraron datos de potencia en hora punta");
        return;
      }

      // Find max value
      let maxValue = -Infinity;
      data.forEach((item: PotenciaHoraPunta) => {
        if (item.potencia_maxima > maxValue) maxValue = item.potencia_maxima;
      });

      const processed: ChartData[] = data.map((item: PotenciaHoraPunta) => {
        const fecha = new Date(item.fecha);
        const dd = String(fecha.getDate()).padStart(2, '0');
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');

        return {
          date: `${dd}/${mm}`,
          value: item.potencia_maxima,
          fullDate: item.fecha,
          color: item.potencia_maxima === maxValue ? '#8B0000' : '#1f77b4',
        };
      });

      setChartData(processed);
    } catch (err: any) {
      console.error('Error fetching potencia_hora_punta:', err);
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

  return { chartData, isLoading, error, refetch: fetchData };
};
