import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { EnergyData } from "../../../types/energy";

export const useMaxPower = (date: Date | undefined, energyData: EnergyData[]) => {
  const [maxPower, setMaxPower] = useState<number>(0);

  useEffect(() => {
    const fetchMaxPower = async () => {
      if (!date) return;

      try {
        const formattedDate = format(date, 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('coes_forecast')
          .select('fecha, reprogramado')
          .filter('fecha', 'gte', `${formattedDate}T18:00:00`)
          .filter('fecha', 'lt', `${formattedDate}T24:00:00`);

        if (error) {
          console.error('Error fetching max power:', error);
          calculateMaxPower();
          return;
        }

        if (data && data.length > 0) {
          let maxValue = 0;
          data.forEach((record: any) => {
            if (record.reprogramado && record.reprogramado > maxValue) {
              maxValue = record.reprogramado;
            }
          });

          if (maxValue > 0) {
            setMaxPower(Number(maxValue.toFixed(2)));
            return;
          }
        }

        calculateMaxPower();
      } catch (error) {
        console.error('Error in fetchMaxPower:', error);
        calculateMaxPower();
      }
    };

    fetchMaxPower();
  }, [date, energyData]);

  const calculateMaxPower = () => {
    if (!date || !energyData.length) return;

    const selectedDateStr = format(date, 'yyyy-MM-dd');
    const dayData = energyData.find(data => data.date === selectedDateStr);

    if (!dayData) return;

    const intervals = [];
    for (let hour = 18; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        intervals.push(dayData.forecasted_power * (0.85 + Math.random() * 0.3));
      }
    }

    const maxValue = Math.max(...intervals);
    setMaxPower(Number(maxValue.toFixed(2)));
  };

  return maxPower;
};
