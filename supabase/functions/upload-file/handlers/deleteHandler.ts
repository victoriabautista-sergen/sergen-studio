
import { corsHeaders } from "../corsHeaders.ts";
import { createSupabaseClient } from "../supabaseClient.ts";

export async function handleDeleteRequest(req: Request): Promise<Response> {
  try {
    console.log('Processing DELETE request to mark document as deleted');
    
    // Initialize Supabase client
    const supabase = createSupabaseClient();
    
    // Get document ID from URL
    const url = new URL(req.url);
    const documentId = url.searchParams.get('id');
    
    if (!documentId) {
      console.error('Missing document ID parameter');
      return new Response(
        JSON.stringify({ error: 'Missing document ID parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Marking document ${documentId} as deleted`);
    
    // Update the document to mark as deleted
    const { error } = await supabase
      .from('documents')
      .update({ deleted: true })
      .eq('id', documentId);
    
    if (error) {
      console.error('Error marking document as deleted:', error);
      throw new Error(`Error marking document as deleted: ${error.message}`);
    }
    
    console.log(`Successfully marked document ${documentId} as deleted`);
    
    return new Response(
      JSON.stringify({ success: true }),
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
