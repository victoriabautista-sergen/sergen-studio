import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify super_admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { company_id, full_name, email, password, role } = await req.json();

    if (!company_id || !full_name?.trim() || !email?.trim() || !password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Todos los campos son requeridos (nombre, email, contraseña mín. 6 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Ya existe un usuario con ese email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: "Error al crear usuario: " + authError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = authData.user.id;

    // Link to company
    const { error: cuError } = await adminClient.from("client_users").insert({
      client_id: company_id,
      user_id: newUserId,
    });
    if (cuError) console.error("Error linking user:", cuError);

    // Set role (replace trigger-created client_user if needed)
    const targetRole = role || "client_user";
    if (targetRole !== "client_user") {
      await adminClient.from("user_roles").delete().eq("user_id", newUserId);
      await adminClient.from("user_roles").insert({ user_id: newUserId, role: targetRole });
    }

    // Copy company modules to user
    const { data: companyMods } = await adminClient
      .from("company_modules")
      .select("module_id")
      .eq("company_id", company_id)
      .eq("enabled", true);

    if (companyMods && companyMods.length > 0) {
      await adminClient.from("user_modules").insert(
        companyMods.map((m) => ({
          user_id: newUserId,
          module_id: m.module_id,
          enabled: true,
        }))
      );
    }

    return new Response(
      JSON.stringify({ user_id: newUserId, message: "Usuario creado y asignado correctamente" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
