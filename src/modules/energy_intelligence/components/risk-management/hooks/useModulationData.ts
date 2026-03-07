import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { ModulationDay } from "../types";

export const useModulationData = (selectedMonth: Date) => {
  const [modulationData, setModulationData] = useState<ModulationDay[]>([]);
  const [modulatedDays, setModulatedDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModulationData = async () => {
      setIsLoading(true);
      try {
        const start = startOfMonth(selectedMonth).toISOString().split('T')[0];
        const end = endOfMonth(selectedMonth).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('modulation_days')
          .select('date, is_modulated')
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error al cargar datos de modulación:', error);
          return;
        }

        setModulationData((data as any[]) || []);
      } catch (error) {
        console.error('Error en fetchModulationData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModulationData();
  }, [selectedMonth]);

  useEffect(() => {
    let count = 0;
    modulationData.forEach(data => {
      if (data.is_modulated) count++;
    });
    setModulatedDays(count);
  }, [modulationData, selectedMonth]);

  const isDateModulated = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = modulationData.find(data => data.date === dateStr);
    return dayData?.is_modulated || false;
  };

  return { modulationData, modulatedDays, isLoading, isDateModulated };
};
