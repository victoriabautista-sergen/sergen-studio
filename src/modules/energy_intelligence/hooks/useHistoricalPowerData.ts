import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { processMaximumData } from '../utils/processMaximumData';
import type { ChartData, PowerData } from '../types';

export const useHistoricalPowerData = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaxPowerData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);

        const { data: dbData, error: dbError } = await supabase
          .from('coes_historical')
          .select('fecha, ejecutado')
          .gte('fecha', format(thirtyDaysAgo, 'yyyy-MM-dd'))
          .lte('fecha', format(today, 'yyyy-MM-dd'))
          .order('fecha', { ascending: true });

        if (dbError) throw new Error(dbError.message);

        let rawData: any[] | null = dbData;

        if (!rawData || rawData.length === 0) {
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
            'get-historical-power-data',
            { body: { start_date: format(thirtyDaysAgo, 'yyyy-MM-dd'), end_date: format(today, 'yyyy-MM-dd'), limit: 10000 } }
          );
          if (edgeError) throw new Error(edgeError.message);
          rawData = edgeData;
        }

        if (!rawData || rawData.length === 0) {
          setError('No se encontraron datos de potencia');
          return;
        }

        const powerData: PowerData[] = (rawData as any[])
          .filter(item => item.fecha && item.ejecutado !== null && item.ejecutado !== undefined)
          .map(item => ({ fecha: item.fecha, ejecutado: Number(item.ejecutado) }));

        const processed = processMaximumData(powerData);

        if (processed.length === 0) {
          setError('No hay datos en el rango 18:00-23:00');
          return;
        }

        setChartData(processed);
      } catch (err: any) {
        console.error('Error fetching historical power data:', err);
        setError(`Error: ${err.message}`);
        toast.error('Error al cargar datos históricos de potencia');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaxPowerData();
    const interval = setInterval(fetchMaxPowerData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { chartData, isLoading, error };
};
