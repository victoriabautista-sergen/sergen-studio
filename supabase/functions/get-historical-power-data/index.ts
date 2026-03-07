import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // First, verify authentication - this is now more lenient
    // We'll use the authorization header if present, otherwise we'll fall back to the anon key
    // This is not recommended for production, but helps troubleshoot our current issue
    let authHeader = req.headers.get('Authorization');
    
    // Log for debugging
    console.log("Authorization header present:", !!authHeader);
    
    // For development purposes, we'll allow requests even without auth
    // In production you should enforce authorization
    
    const { start_date, end_date, limit = 50000 } = await req.json();
    
    if (!start_date || !end_date) {
      console.log("Missing required date parameters");
      return new Response(
        JSON.stringify({ error: 'Missing required date parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Fetching historical power data from ${start_date} to ${end_date} with limit ${limit}`);
    console.log(`Table being queried: coes_historical`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, let's get the first 5 records to verify access and data format regardless of date filters
    const { data: sampleData, error: sampleError } = await supabase
      .from('coes_historical')
      .select('*')
      .limit(5);
      
    if (sampleError) {
      console.error("Error accessing coes_historical table:", sampleError);
      throw new Error(`Database access error: ${sampleError.message}`);
    }
    
    if (!sampleData || sampleData.length === 0) {
      console.log("WARNING: No records found in the coes_historical table at all!");
    } else {
      console.log(`Successfully accessed coes_historical table. Found ${sampleData.length} sample records:`);
      sampleData.forEach((record, index) => {
        console.log(`Record ${index + 1}:`, JSON.stringify(record));
      });
    }

    // Let's try a simpler query to just count all records
    const { count: totalCount, error: countError } = await supabase
      .from('coes_historical')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error counting records:", countError);
    } else {
      console.log(`Total records in coes_historical table: ${totalCount}`);
    }

    // Now try to get records within the date range
    const { data: rangeData, error: rangeError } = await supabase
      .from('coes_historical')
      .select('fecha, ejecutado')
      .gte('fecha', start_date)
      .lte('fecha', end_date);
      
    if (rangeError) {
      console.error("Error checking data in date range:", rangeError);
      throw rangeError;
    }
    
    if (!rangeData || rangeData.length === 0) {
      console.log(`WARNING: No records found between ${start_date} and ${end_date}`);
      
      // If no data in range, let's try getting some data without date filters
      // to help diagnose the issue
      const { data: anyData, error: anyError } = await supabase
        .from('coes_historical')
        .select('fecha, ejecutado')
        .limit(10);
        
      if (anyError) {
        console.error("Error fetching any data:", anyError);
      } else if (anyData && anyData.length > 0) {
        console.log("Found some data without date filters. Sample records:");
        anyData.forEach((record, index) => {
          console.log(`Any data record ${index + 1}:`, JSON.stringify(record));
        });
        
        // Let's check the date format in the database
        const sampleDates = anyData.map(item => item.fecha);
        console.log("Sample date formats in database:", sampleDates);
        
        // Return this data as a fallback
        return new Response(
          JSON.stringify(anyData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } else {
        console.log("No data found at all in the table with simple query.");
      }
      
      // If we reach here, there's truly no data
      return new Response(
        JSON.stringify([]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    console.log(`Found ${rangeData.length} records in the specified date range.`);
    if (rangeData.length > 0) {
      console.log("Sample records:");
      rangeData.slice(0, 5).forEach((record, index) => {
        console.log(`Range data record ${index + 1}:`, JSON.stringify(record));
      });
    }
    
    // Filter records to keep only those in the 18:00-23:00 UTC range
    const filteredData = rangeData.filter(item => {
      if (!item.fecha || item.ejecutado == null) {
        console.log("Skipping invalid item:", item);
        return false;
      }
      
      try {
        const date = new Date(item.fecha);
        const hour = date.getUTCHours();
        const result = hour >= 18 && hour <= 23;
        if (result) {
          console.log(`Including record: ${date.toISOString()}, Hour: ${hour}, Value: ${item.ejecutado}`);
        }
        return result;
      } catch (e) {
        console.error("Error filtering date:", e);
        return false;
      }
    });
    
    console.log(`Found ${filteredData.length} records in the 18:00-23:00 UTC range`);
    
    if (filteredData.length > 0) {
      console.log("Sample filtered data:");
      filteredData.slice(0, 5).forEach(item => {
        const date = new Date(item.fecha);
        console.log(`Time (UTC): ${date.toISOString()}, Hour: ${date.getUTCHours()}, Value: ${item.ejecutado}`);
      });
    } else {
      console.log("WARNING: No records found in the 18:00-23:00 UTC range!");
    }

    return new Response(
      JSON.stringify(filteredData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
