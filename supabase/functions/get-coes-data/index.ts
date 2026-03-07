
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchMainPage, downloadExcelFile } from './coesApi.ts';
import { processExcelData } from './excelProcessor.ts';
import { saveToDatabase } from './database.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simular sesión web completa para obtener cookies
    const cookies = await fetchMainPage();

    // Esperar antes de hacer la siguiente petición
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Descargar el archivo Excel
    const arrayBuffer = await downloadExcelFile(cookies);

    // Procesar el archivo Excel
    let processedData;
    try {
      processedData = processExcelData(arrayBuffer);
    } catch (excelError) {
      console.error('Error procesando Excel:', excelError);
      throw new Error(`Error procesando archivo Excel: ${excelError.message}`);
    }

    // Guardar datos en la base de datos
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    await saveToDatabase(processedData, supabaseUrl, supabaseKey);

    return new Response(JSON.stringify(processedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
