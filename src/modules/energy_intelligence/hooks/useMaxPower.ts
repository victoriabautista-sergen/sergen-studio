import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const useMaxPower = (date: Date | undefined) => {
  const [maxPower, setMaxPower] = useState<number>(0);

  useEffect(() => {
    if (!date) return;

    const fetchMaxPower = async () => {
      try {
        const formattedDate = format(date, 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('coes_demand_data')
          .select('date, executed_power, daily_forecast')
          .filter('date', 'gte', `${formattedDate}T18:00:00`)
          .filter('date', 'lt', `${formattedDate}T24:00:00`);

        if (error) return;

        if (data && data.length > 0) {
          let maxValue = 0;
          (data as any[]).forEach(record => {
            const val = record.executed_power ?? record.daily_forecast ?? 0;
            if (val > maxValue) maxValue = val;
          });
          if (maxValue > 0) setMaxPower(Number(maxValue.toFixed(2)));
        }
      } catch (error) {
        console.error('Error fetching max power:', error);
      }
    };

    fetchMaxPower();
  }, [date]);

  return maxPower;
};
