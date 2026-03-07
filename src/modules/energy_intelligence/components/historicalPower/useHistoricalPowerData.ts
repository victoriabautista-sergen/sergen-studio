import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ChartData } from "./types";
import { fetchPowerData } from "./services/fetchPowerData";
import { processMaximumData } from "./utils/processMaximumData";

export const useHistoricalPowerData = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionFetched, setSessionFetched] = useState(false);

  useEffect(() => {
    const fetchMaxPowerData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!sessionFetched) {
          setSessionFetched(true);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const powerData = await fetchPowerData();

        if (!powerData || powerData.length === 0) {
          setError("No se encontraron datos de potencia para el período seleccionado");
          return;
        }

        const processedData = processMaximumData(powerData);

        if (processedData.length === 0) {
          setError("No se pudieron procesar los datos de potencia máxima");
          return;
        }

        setChartData(processedData);
      } catch (err: any) {
        console.error('Error processing power data:', err);
        setError(`Error: ${err.message}`);
        toast.error("Error al cargar datos históricos de potencia");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaxPowerData();
    const interval = setInterval(fetchMaxPowerData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sessionFetched]);

  return { chartData, isLoading, error };
};
