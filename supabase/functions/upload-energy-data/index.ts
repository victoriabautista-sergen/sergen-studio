
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

function parseExcelDate(serial: number | string | Date): string {
  if (serial instanceof Date) {
    return serial.toISOString().split('T')[0];
  }
  if (typeof serial === 'string') {
    if (serial.includes('T')) {
      return serial.split('T')[0];
    }
    const parts = serial.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const date = new Date(Math.round((serial as number - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

function getTimeFromDate(date: string | Date): string {
  if (typeof date === 'string' && date.includes('T')) {
    return date.split('T')[1].substring(0, 5);
  }
  if (date instanceof Date) {
    return date.toTimeString().substring(0, 5);
  }
  return "00:00";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) {
      throw new Error('No file uploaded');
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const processedData = jsonData.reduce((acc: any[], row: any) => {
      if (!row.FECHA || (!row.EJECUTADO && row.EJECUTADO !== 0) || (!row["PRONÓSTICO"] && row["PRONÓSTICO"] !== 0)) {
        return acc;
      }

      try {
        const date = parseExcelDate(row.FECHA);
        const time = getTimeFromDate(row.FECHA);

        acc.push({
          date,
          time,
          forecasted_power: parseFloat(row["PRONÓSTICO"].toString()) || 0,
          executed_power: parseFloat(row.EJECUTADO.toString()) || 0,
          user_id: user.id,
        });
      } catch (error) {
        console.error('Error processing row:', error);
      }

      return acc;
    }, []);

    if (processedData.length === 0) {
      throw new Error('No valid data found in the file');
    }

    // Borrar datos existentes
    const { error: deleteError } = await supabase
      .from('energy_data')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    // Insertar datos en lotes más pequeños
    const BATCH_SIZE = 25;
    for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
      const batch = processedData.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from('energy_data')
        .insert(batch);

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, rowsProcessed: processedData.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  } catch (error) {
    console.error('Error in upload-energy-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
