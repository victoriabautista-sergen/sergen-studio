import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { ModulationDay } from "../types";

export const useModulationData = (selectedMonth: Date) => {
  const [modulationData, setModulationData] = useState<ModulationDay[]>([]);
  const [modulatedDays, setModulatedDays] = useState(0);
  const [currentMonthModulatedDays, setCurrentMonthModulatedDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch modulation data for the selected month (calendar navigation)
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

  // Always fetch current month modulated days count (independent of calendar)
  useEffect(() => {
    const fetchCurrentMonthCount = async () => {
      try {
        const now = new Date();
        const start = startOfMonth(now).toISOString().split('T')[0];
        const end = endOfMonth(now).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('modulation_days')
          .select('is_modulated')
          .gte('date', start)
          .lte('date', end)
          .eq('is_modulated', true);

        if (!error && data) {
          setCurrentMonthModulatedDays(data.length);
        }
      } catch (error) {
        console.error('Error fetching current month modulation:', error);
      }
    };

    fetchCurrentMonthCount();
  }, []);

  useEffect(() => {
    let count = 0;
    modulationData.forEach(data => {
      if (data.is_modulated) count++;
    });
    setModulatedDays(count);
  }, [modulationData]);

  const isDateModulated = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = modulationData.find(data => data.date === dateStr);
    return dayData?.is_modulated || false;
  };

  return { modulationData, modulatedDays, currentMonthModulatedDays, isLoading, isDateModulated };
};
