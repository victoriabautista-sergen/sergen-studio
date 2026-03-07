
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getDefaultDates() {
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - 3);
  const endDate = new Date(currentDate);
  endDate.setDate(currentDate.getDate() - 1);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

serve(async (req) => {
  console.log('🚀 Iniciando función get-coes-historical');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Obtener fechas del request o usar las predeterminadas
    console.log('📥 Procesando request body...');
    let { startDate, endDate } = await req.json().catch((e) => {
      console.error('❌ Error al procesar request body:', e);
      return {};
    });
    
    if (!startDate || !endDate) {
      console.log('⚠️ No se proporcionaron fechas, usando fechas por defecto');
      const defaultDates = getDefaultDates();
      startDate = startDate || defaultDates.startDate;
      endDate = endDate || defaultDates.endDate;
    }
    console.log('📅 Fechas a usar:', { startDate, endDate });

    // Primera petición para obtener cookies y token
    console.log('🔄 Obteniendo página inicial...');
    const initialResponse = await fetch('https://www.coes.org.pe/Portal/portalinformacion/demanda', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3'
      }
    });

    if (!initialResponse.ok) {
      console.error('❌ Error en respuesta inicial:', initialResponse.status);
      throw new Error(`Error al acceder a la página inicial: ${initialResponse.status}`);
    }

    const cookies = initialResponse.headers.get('set-cookie');
    console.log('🍪 Cookies obtenidas:', cookies ? 'Sí' : 'No');
    
    const htmlContent = await initialResponse.text();
    console.log('📄 Contenido HTML recibido:', htmlContent.length, 'caracteres');

    // Extraer el token de verificación
    const tokenMatch = htmlContent.match(/<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]*)"[^>]*>/);
    const verificationToken = tokenMatch ? tokenMatch[1] : '';
    console.log('🔑 Token de verificación:', verificationToken ? 'Obtenido' : 'No encontrado');

    // Preparar el formulario con las fechas
    const formData = new URLSearchParams();
    formData.append('txtFechaInicial', startDate);
    formData.append('txtFechaFinal', endDate);
    if (verificationToken) {
      formData.append('__RequestVerificationToken', verificationToken);
    }
    formData.append('btnConsultar', 'Consultar');

    console.log('📝 Datos del formulario:', formData.toString());

    // Simular el clic en el botón Consultar
    console.log('🔄 Enviando formulario de consulta...');
    const searchResponse = await fetch('https://www.coes.org.pe/Portal/portalinformacion/demanda', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cookie': cookies || '',
        'Origin': 'https://www.coes.org.pe',
        'Referer': 'https://www.coes.org.pe/Portal/portalinformacion/demanda'
      },
      body: formData.toString()
    });

    if (!searchResponse.ok) {
      console.error('❌ Error en búsqueda:', searchResponse.status);
      throw new Error(`Error al enviar formulario: ${searchResponse.status}`);
    }

    // Esperar un momento para que los datos se carguen
    console.log('⏳ Esperando procesamiento...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Obtener datos exportados
    console.log('📥 Solicitando exportación de datos...');
    const exportResponse = await fetch('https://www.coes.org.pe/Portal/portalinformacion/demanda/exportardemandamaximadiaria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/vnd.ms-excel',
        'Cookie': cookies || '',
        'Origin': 'https://www.coes.org.pe',
        'Referer': 'https://www.coes.org.pe/Portal/portalinformacion/demanda'
      },
      body: formData.toString()
    });

    if (!exportResponse.ok) {
      console.error('❌ Error en exportación:', exportResponse.status);
      throw new Error(`Error al exportar datos: ${exportResponse.status}`);
    }

    const exportData = await exportResponse.text();
    console.log('📊 Datos exportados recibidos:', exportData.length, 'caracteres');
    console.log('📄 Primeras líneas:', exportData.split('\n').slice(0, 3));

    if (!exportData || exportData.trim() === '') {
      throw new Error('Los datos exportados están vacíos');
    }

    // Procesar el CSV
    const lines = exportData.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log('📋 Número de líneas encontradas:', lines.length);

    if (lines.length < 2) {
      throw new Error('El archivo exportado no contiene datos suficientes');
    }

    // Procesar encabezados
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('📑 Encabezados encontrados:', headers);

    // Procesar datos
    const rawData = lines.slice(1).map((line, index) => {
      console.log(`Procesando línea ${index + 1}:`, line);
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    console.log('🔄 Datos crudos procesados:', rawData.length, 'filas');
    if (rawData.length > 0) {
      console.log('📝 Ejemplo de fila:', rawData[0]);
    }

    // Formatear los datos para Supabase
    const formattedData = rawData.map((row, index) => {
      const fechaStr = row.Fecha || row.fecha;
      console.log(`Procesando fecha de fila ${index + 1}:`, fechaStr);
      
      let fecha;
      try {
        const [day, month, year] = fechaStr.split('/');
        fecha = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;
      } catch (e) {
        console.error('❌ Error al parsear fecha:', fechaStr, e);
        return null;
      }

      const reprogramacion = parseFloat(row['Reprogramación Diaria']?.replace(',', '.') || '0');
      const ejecutado = parseFloat(row['Ejecutado']?.replace(',', '.') || '0');

      console.log(`Valores procesados - Fecha: ${fecha}, Reprogramación: ${reprogramacion}, Ejecutado: ${ejecutado}`);

      return {
        fecha,
        reprogramacion_diaria: reprogramacion,
        ejecutado: ejecutado,
        created_at: new Date().toISOString()
      };
    }).filter(row => row !== null);

    console.log('✨ Datos formateados:', formattedData.length, 'filas válidas');
    if (formattedData.length === 0) {
      throw new Error('No se pudieron procesar los datos correctamente');
    }

    // Guardar en Supabase
    console.log('💾 Configurando conexión a Supabase...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables de entorno de Supabase no configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📤 Insertando datos en Supabase...');
    const { error: insertError } = await supabase
      .from('coes_historical')
      .upsert(formattedData);

    if (insertError) {
      console.error('❌ Error al insertar en Supabase:', insertError);
      throw new Error(`Error al insertar datos: ${insertError.message}`);
    }

    console.log('✅ Operación completada con éxito');
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Datos históricos obtenidos y guardados correctamente',
        count: formattedData.length,
        data: formattedData
      }),
      { 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error detallado:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al obtener datos históricos',
        details: error.message,
        stack: error.stack
      }),
      { 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 500 
      }
    );
  }
});
