import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CoesData } from "../../types/forecast";
import { toast } from "sonner";
import { startOfDay, endOfDay, subDays } from "date-fns";

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

      const { data: rows, error } = await supabase
        .from('coes_demand_data')
        .select('date, executed_power, daily_forecast, weekly_forecast')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar datos de pronóstico');
        throw error;
      }

      if (!rows || rows.length === 0) {
        setData([]);
        return;
      }

      setData(rows as unknown as CoesData[]);
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
