
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file uploaded')
    }

    console.log(`Processing file ${file.name} (${file.size} bytes)`)

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawData = XLSX.utils.sheet_to_json(worksheet)

    console.log(`Raw data from Excel: ${rawData.length} rows`)
    console.log('First few rows:', rawData.slice(0, 3))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Primero eliminamos datos existentes para evitar duplicados
    const { error: deleteError } = await supabase
      .from('coes_historical')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); 

    if (deleteError) {
      console.error('Error al eliminar datos existentes:', deleteError);
      throw deleteError;
    }

    console.log('Existing data deleted successfully')

    // Determinar los nombres de las columnas en el Excel
    // Basándonos en la imagen proporcionada, las columnas son:
    // FECHA, EJECUTADO, PROG. DIARIA, PROG. SEMANAL
    
    // Formatea los datos antes de insertarlos
    const formattedData = rawData.map((row: any) => {
      try {
        // Obtener valores de las columnas usando los nombres exactos del Excel
        // Los nombres de las columnas pueden estar en mayúsculas o minúsculas
        const fechaRaw = row["FECHA"] || row["fecha"] || null;
        const ejecutadoRaw = row["EJECUTADO"] || row["ejecutado"] || null;
        const progDiariaRaw = row["PROG. DIARIA"] || row["prog. diaria"] || null;
        const progSemanalRaw = row["PROG. SEMANAL"] || row["prog. semanal"] || null;
        
        if (!fechaRaw) {
          console.error('Row missing date:', row);
          return null;
        }
        
        // Parsear la fecha correctamente
        let fecha;
        if (typeof fechaRaw === 'number') {
          // Si es un número de serie de Excel
          const excelEpoch = new Date(1899, 11, 30);
          fecha = new Date(excelEpoch.getTime() + fechaRaw * 24 * 60 * 60 * 1000);
        } else if (typeof fechaRaw === 'string') {
          // Si es una cadena de fecha
          if (fechaRaw.includes('/')) {
            // Formato tipo: 01/03/2025 00:30
            const [datePart, timePart] = fechaRaw.split(' ');
            const [day, month, year] = datePart.split('/');
            const [hours, minutes] = (timePart || '00:00').split(':');
            
            fecha = new Date(
              parseInt(year), 
              parseInt(month) - 1, 
              parseInt(day),
              parseInt(hours),
              parseInt(minutes)
            );
          } else {
            // Otros formatos
            fecha = new Date(fechaRaw);
          }
        } else {
          // Si es un objeto Date de JavaScript
          fecha = new Date(fechaRaw);
        }
        
        if (isNaN(fecha.getTime())) {
          console.error('Invalid date format:', fechaRaw);
          return null;
        }
        
        // Convertir a ISO string
        const formattedDate = fecha.toISOString();
        
        // Parsear los valores numéricos
        const ejecutado = parseFloat(String(ejecutadoRaw).replace(',', '.')) || null;
        const demandaProgramada = parseFloat(String(progDiariaRaw).replace(',', '.')) || null;
        const progSemanal = parseFloat(String(progSemanalRaw).replace(',', '.')) || null;
        
        // Registrar para depuración
        console.log(`Processed row: date=${formattedDate}, ejecutado=${ejecutado}, prog_diaria=${demandaProgramada}, prog_semanal=${progSemanal}`);
        
        return {
          fecha: formattedDate,
          ejecutado: ejecutado,
          demanda_programada: demandaProgramada,
          prog_semanal: progSemanal,
          reprogramacion_diaria: demandaProgramada // Usamos PROG. DIARIA como reprogramacion_diaria
        };
      } catch (error) {
        console.error('Error processing row:', row, error);
        return null;
      }
    }).filter(Boolean);

    console.log(`Formatted ${formattedData.length} rows for database insertion`);

    if (formattedData.length === 0) {
      throw new Error('No valid data could be extracted from the Excel file');
    }

    // Realizar la inserción en lotes para evitar problemas con archivos grandes
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < formattedData.length; i += batchSize) {
      const batch = formattedData.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('coes_historical')
        .insert(batch);

      if (insertError) {
        console.error('Insert error for batch:', insertError);
        throw insertError;
      }
      
      insertedCount += batch.length;
      console.log(`Inserted batch ${i/batchSize + 1}, total records so far: ${insertedCount}`);
    }

    console.log(`Successfully inserted ${insertedCount} records`)

    // Verificar que los datos se insertaron correctamente
    const { count, error: countError } = await supabase
      .from('coes_historical')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error al verificar conteo final:', countError);
    } else {
      console.log(`Final record count in database: ${count}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Datos históricos actualizados correctamente',
        count: insertedCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: any) {
    console.error('Error processing file:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error procesando el archivo',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Mantenemos 200 para evitar errores CORS
      }
    )
  }
})
