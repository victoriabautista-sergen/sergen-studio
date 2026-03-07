
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requiredBuckets = ['invoices', 'contracts', 'profile_images'];
    const results = [];

    // Check and create each required bucket
    for (const bucketName of requiredBuckets) {
      try {
        // Check if bucket exists
        const { data: existingBucket, error: checkError } = await supabaseAdmin
          .storage
          .getBucket(bucketName);

        if (checkError) {
          console.log(`Bucket ${bucketName} not found. Creating...`);
          
          // Create the bucket
          const { data: newBucket, error: createError } = await supabaseAdmin
            .storage
            .createBucket(bucketName, {
              public: true,
              fileSizeLimit: 10485760, // 10MB
            });

          if (createError) {
            results.push({ bucket: bucketName, status: 'error', message: createError.message });
          } else {
            results.push({ bucket: bucketName, status: 'created' });
            
            // Create public policies for the bucket
            await supabaseAdmin.rpc('create_storage_policy', { 
              bucket_name: bucketName,
              definition: 'true'
            });
          }
        } else {
          results.push({ bucket: bucketName, status: 'exists' });
        }
      } catch (error) {
        results.push({ bucket: bucketName, status: 'error', message: error.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
