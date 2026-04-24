
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

export function createSupabaseClient() {
  console.log('Supabase URL:', Deno.env.get('SUPABASE_URL'));
  console.log('Service role key length:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.length);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { persistSession: false } }
  );

  console.log('Supabase client created successfully');
  
  return supabase;
}
