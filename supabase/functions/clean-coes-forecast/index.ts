
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Iniciando limpieza de datos antiguos de coes_forecast...");
    
    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calcular la fecha de ayer
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    console.log('Eliminando datos anteriores a:', today.toISOString());

    // Eliminar todos los registros anteriores al día de hoy
    const { error, count } = await supabaseAdmin
      .from('coes_forecast')
      .delete({ count: 'exact' })
      .lt('fecha', today.toISOString());

    if (error) {
      console.error('Error eliminando datos antiguos:', error);
      throw error;
    }

    console.log(`Limpieza completada. ${count} registros eliminados.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Limpieza completada. ${count} registros eliminados.` 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error durante la limpieza:', error);
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
});
