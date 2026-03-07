import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { CoesData } from '../types';

export const useForecastData = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CoesData[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const twoDaysAgo = subDays(today, 2);
      const startDate = startOfDay(twoDaysAgo).toISOString();
      const endDate = endOfDay(today).toISOString();

      const { data: forecastData, error } = await supabase
        .from('coes_forecast')
        .select('fecha, reprogramado, pronostico, rango_inferior, rango_superior, ejecutado')
        .gte('fecha', startDate)
        .lte('fecha', endDate)
        .order('fecha', { ascending: true });

      if (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar datos de pronóstico');
        throw error;
      }

      setData(forecastData || []);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading };
};
