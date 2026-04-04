import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { externalSupabase } from '@/integrations/externalSupabase/client';

export const useMaxPower = (date: Date | undefined) => {
  const [maxPower, setMaxPower] = useState<number>(0);

  const fetchMaxPower = useCallback(async () => {
    if (!date) return;

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');

      const { data, error } = await externalSupabase
        .from('potencia_hora_punta' as any)
        .select('potencia_maxima')
        .eq('fecha', formattedDate)
        .order('potencia_maxima', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching max power:', error);
        return;
      }

      if (data && data.length > 0) {
        const value = Number((data[0] as any).potencia_maxima);
        if (value > 0) {
          setMaxPower(Number(value.toFixed(2)));
        }
      }
    } catch (error) {
      console.error('Error in fetchMaxPower:', error);
    }
  }, [date]);

  useEffect(() => {
    fetchMaxPower();
    const interval = setInterval(fetchMaxPower, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMaxPower]);

  return maxPower;
};
