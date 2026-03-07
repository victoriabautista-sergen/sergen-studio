
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0';
import { ProcessedData } from './excelProcessor.ts';

export const saveToDatabase = async (data: ProcessedData[], supabaseUrl: string, supabaseKey: string) => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const item of data) {
    const { error: insertError } = await supabase
      .from('coes_demand_data')
      .upsert({
        date: item.Fecha,
        executed_power: item.Ejecutado,
        daily_forecast: item["Prog. Diaria"],
        weekly_forecast: item["Prog. Semanal"],
        created_at: new Date()
      });

    if (insertError) {
      console.error('Error al insertar datos:', insertError);
    }
  }
};

