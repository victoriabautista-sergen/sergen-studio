
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0'
import { ProcessedData } from './excelProcessor.ts'

export async function saveToDatabase(processedData: ProcessedData[]) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { error } = await supabase
    .from('coes_forecast')
    .upsert(processedData, {
      onConflict: 'fecha',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Error actualizando datos:', error);
    throw error;
  }

  console.log(`Se procesaron ${processedData.length} registros correctamente`);
  return processedData.length;
}
