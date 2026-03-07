
import { corsHeaders } from "../corsHeaders.ts";
import { createSupabaseClient } from "../supabaseClient.ts";

export async function handleGetRequest(req: Request): Promise<Response> {
  try {
    console.log('Processing GET request to fetch documents');
    
    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Get parameters from URL query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const documentType = url.searchParams.get('type') || 'invoice';
    
    console.log('URL parameters - userId:', userId, 'type:', documentType);
    
    if (!userId) {
      console.error('Missing userId parameter');
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Fetching ${documentType} documents for user ${userId}`);

    // Query the documents table
    const { data, error } = await supabase
      .from('documents')
      .select('id, filename, file_path, document_type, created_at, deleted')
      .eq('user_id', userId)
      .eq('document_type', documentType)
      .eq('deleted', false);

    if (error) {
      console.error('Error fetching documents:', error);
      throw new Error(`Error fetching documents: ${error.message}`);
    }

    console.log(`Successfully retrieved ${data?.length || 0} ${documentType} documents`);
    
    return new Response(
      JSON.stringify(data || []),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
