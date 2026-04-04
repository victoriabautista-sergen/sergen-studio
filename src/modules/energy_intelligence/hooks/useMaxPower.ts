import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { externalSupabase } from '@/integrations/externalSupabase/client';
import { supabase } from '@/integrations/supabase/client';

export const useMaxPower = (date: Date | undefined) => {
  const [maxPower, setMaxPower] = useState<number>(0);

  const fetchFromFallback = useCallback(async (formattedDate: string) => {
    try {
      const { data, error } = await supabase
        .from('coes_forecast')
        .select('fecha, reprogramado')
        .filter('fecha', 'gte', `${formattedDate}T18:00:00`)
        .filter('fecha', 'lt', `${formattedDate}T24:00:00`);

      if (error) {
        console.error('Error fetching fallback max power:', error);
        return;
      }

      if (data && data.length > 0) {
        let maxValue = 0;
        data.forEach((record: any) => {
          const val = Number(record.reprogramado);
          if (val > maxValue) maxValue = val;
        });
        if (maxValue > 0) {
          setMaxPower(Number(maxValue.toFixed(2)));
        }
      }
    } catch (error) {
      console.error('Error in fallback fetchMaxPower:', error);
    }
  }, []);

  const fetchMaxPower = useCallback(async () => {
    if (!date) return;

    const formattedDate = format(date, 'yyyy-MM-dd');

    try {
      const { data, error } = await externalSupabase
        .from('potencia_hora_punta' as any)
        .select('potencia_maxima')
        .eq('fecha', formattedDate)
        .order('potencia_maxima', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching max power from external, using fallback:', error);
        await fetchFromFallback(formattedDate);
        return;
      }

      if (data && data.length > 0) {
        const value = Number((data[0] as any).potencia_maxima);
        if (value > 0) {
          setMaxPower(Number(value.toFixed(2)));
          return;
        }
      }

      // No data in external, try fallback
      await fetchFromFallback(formattedDate);
    } catch (error) {
      console.error('Error in fetchMaxPower, using fallback:', error);
      await fetchFromFallback(formattedDate);
    }
  }, [date, fetchFromFallback]);

  useEffect(() => {
    fetchMaxPower();
    const interval = setInterval(fetchMaxPower, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMaxPower]);

  return maxPower;
};
