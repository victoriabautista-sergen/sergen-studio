import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { ModulationDay } from '../types';

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

        if (error) return;
        setModulationData(data || []);
      } catch (error) {
        console.error('Error fetching modulation data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModulationData();
  }, [selectedMonth]);

  useEffect(() => {
    const count = modulationData.filter(d => d.is_modulated).length;
    setModulatedDays(count);
  }, [modulationData]);

  const isDateModulated = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return modulationData.find(d => d.date === dateStr)?.is_modulated || false;
  };

  return { modulationData, modulatedDays, isLoading, isDateModulated };
};
