
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "./corsHeaders.ts";
import { handleGetRequest } from "./handlers/getHandler.ts";
import { handleDeleteRequest } from "./handlers/deleteHandler.ts";
import { handlePostRequest } from "./handlers/postHandler.ts";

serve(async (req) => {
  console.log("--------------------------------------------------");
  console.log(`Request received: ${req.method} ${new URL(req.url).pathname}`);
  console.log("Headers:", JSON.stringify([...req.headers.entries()]));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS');
    return new Response(null, { headers: corsHeaders });
  }

  // Route requests to appropriate handlers
  try {
    switch(req.method) {
      case 'GET':
        return await handleGetRequest(req);
      case 'DELETE':
        return await handleDeleteRequest(req);
      case 'POST':
        return await handlePostRequest(req);
      default:
        return new Response(
          JSON.stringify({ error: `Method ${req.method} not allowed` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
        );
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
