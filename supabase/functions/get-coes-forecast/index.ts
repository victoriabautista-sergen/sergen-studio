
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { read, utils } from 'npm:xlsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Iniciando descarga de archivo Excel del COES...");
    
    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Limpieza de datos antiguos
    console.log("Ejecutando limpieza de datos antiguos...");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const { error: cleanError, count: cleanedCount } = await supabaseAdmin
      .from('coes_forecast')
      .delete({ count: 'exact' })
      .lt('fecha', today.toISOString());
    
    if (cleanError) {
      console.error('Error eliminando datos antiguos:', cleanError);
    } else {
      console.log(`Limpieza completada. ${cleanedCount} registros antiguos eliminados.`);
    }
    
    // Continuar con la descarga y procesamiento
    const response = await fetch('https://www.coes.org.pe/Portal/portalinformacion/ExportarPronosticoTiempoReal', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al descargar el archivo: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

    // Log headers and first few rows to verify columns
    console.log("Encabezados del Excel:", jsonData[0]);
    console.log("Primera fila de datos:", jsonData[1]);
    console.log("Segunda fila de datos:", jsonData[2]);

    // Skip header rows and process data
    const processedData = [];
    for (let i = 2; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row[0]) {
        try {
          // Asegurarnos de que la fecha se mantenga en UTC
          let fecha = row[0];
          if (typeof fecha === 'number') {
            // Si es un número Excel, convertirlo a fecha
            fecha = new Date((fecha - 25569) * 86400 * 1000);
          } else if (typeof fecha === 'string') {
            fecha = new Date(fecha);
          }
          
          if (isNaN(fecha.getTime())) {
            console.error('Fecha inválida en fila:', i + 1, row[0]);
            continue;
          }

          // Updated to match the column names in the database
          const data = {
            fecha: fecha.toISOString(),
            reprogramado: parseFloat(row[1]) || null,
            pronostico: parseFloat(row[2]) || null,
            rango_superior: parseFloat(row[3]) || null,
            rango_inferior: parseFloat(row[4]) || null,
            ejecutado: parseFloat(row[5]) || null
          };
          
          processedData.push(data);
          console.log(`Procesado registro: ${data.fecha}`);
        } catch (parseError) {
          console.error('Error procesando fila:', i + 1, parseError);
        }
      }
    }

    console.log(`Procesados ${processedData.length} registros`);

    if (processedData.length === 0) {
      throw new Error('No se encontraron datos para procesar');
    }

    // Delete existing data for today
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    console.log('Eliminando datos existentes entre:', today.toISOString(), 'y', tomorrow.toISOString());

    const { error: deleteError } = await supabaseAdmin
      .from('coes_forecast')
      .delete()
      .gte('fecha', today.toISOString())
      .lt('fecha', tomorrow.toISOString());

    if (deleteError) {
      console.error('Error eliminando datos antiguos:', deleteError);
      throw deleteError;
    }

    // Insert new data
    for (let i = 0; i < processedData.length; i += 100) {
      const batch = processedData.slice(i, i + 100);
      const { error: insertError } = await supabaseAdmin
        .from('coes_forecast')
        .upsert(batch, { 
          onConflict: 'fecha',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error(`Error insertando batch ${i/100 + 1}:`, insertError);
        throw insertError;
      }
      console.log(`Batch ${i/100 + 1} insertado correctamente`);
    }

    console.log('Datos actualizados correctamente');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Datos actualizados correctamente',
        count: processedData.length,
        cleaned: cleanedCount 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
})
