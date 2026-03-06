import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { PowerData } from "../types";

export const fetchPowerData = async (): Promise<PowerData[]> => {
  try {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const formattedToday = format(today, 'yyyy-MM-dd');
    const formattedThirtyDaysAgo = format(thirtyDaysAgo, 'yyyy-MM-dd');

    // Try direct query first
    let { data, error } = await supabase
      .from('coes_historical')
      .select('fecha, ejecutado')
      .gte('fecha', formattedThirtyDaysAgo)
      .lte('fecha', formattedToday)
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error in query:', error);
      throw new Error(`Database query error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      // Fallback: try without date filters
      const { data: allData, error: allError } = await supabase
        .from('coes_historical')
        .select('fecha, ejecutado')
        .limit(1000);

      if (allError || !allData || allData.length === 0) {
        return [];
      }
      data = allData;
    }

    const result: PowerData[] = (data as any[])
      .filter(item => {
        if (!item.fecha || item.ejecutado === null || item.ejecutado === undefined) return false;
        try {
          const date = new Date(item.fecha);
          const hour = date.getUTCHours();
          return hour >= 18 && hour <= 23;
        } catch {
          return false;
        }
      })
      .map(item => ({
        fecha: item.fecha,
        ejecutado: typeof item.ejecutado === 'number' ? item.ejecutado : 0
      }));

    return result;
  } catch (err: any) {
    console.error('Error in fetchPowerData:', err);
    throw err;
  }
};
