
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS support
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Crear un cliente Supabase con el role service_role para acceso administrativo
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { exemptEmail } = await req.json();
    
    if (!exemptEmail) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing exempt email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Starting cleanup, preserving: ${exemptEmail}`);

    // Obtener lista de usuarios excepto el correo especificado
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

    if (fetchError) {
      console.error("Error fetching users:", fetchError);
      throw new Error(`Error fetching users: ${fetchError.message}`);
    }

    const usersToDelete = users.users.filter(user => 
      user.email !== exemptEmail && 
      user.email?.toLowerCase() !== exemptEmail.toLowerCase()
    );

    console.log(`Found ${usersToDelete.length} users to delete`);

    // Eliminar cada usuario
    const results = [];
    for (const user of usersToDelete) {
      try {
        console.log(`Deleting user: ${user.email} (${user.id})`);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`Error deleting user ${user.id}:`, deleteError);
          results.push({
            id: user.id,
            email: user.email,
            success: false,
            error: deleteError.message
          });
        } else {
          results.push({
            id: user.id,
            email: user.email,
            success: true
          });
          
          // Also delete from user_accounts if exists
          await supabaseAdmin
            .from('user_accounts')
            .delete()
            .eq('id', user.id);
        }
      } catch (err) {
        console.error(`Unexpected error deleting user ${user.id}:`, err);
        results.push({
          id: user.id,
          email: user.email,
          success: false,
          error: err.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully deleted ${successCount} of ${usersToDelete.length} users`,
        deletedCount: successCount,
        preservedEmail: exemptEmail,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in cleanup-users function:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
