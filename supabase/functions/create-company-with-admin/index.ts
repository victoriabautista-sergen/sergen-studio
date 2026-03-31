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

    // Verify caller identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await userClient.auth.getUser();
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

    const body = await req.json();

    // Validate required fields
    const { company_name, ruc, industry, admin_name, admin_email, admin_password, module_ids, plan } = body;

    if (!company_name?.trim()) {
      return new Response(JSON.stringify({ error: "Nombre de empresa requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasAdmin = admin_email?.trim();
    if (hasAdmin) {
      if (!admin_password || admin_password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Contraseña debe tener al menos 6 caracteres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!admin_name?.trim()) {
        return new Response(JSON.stringify({ error: "Nombre del administrador requerido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check RUC uniqueness if provided
    if (ruc?.trim()) {
      const { data: existingRuc } = await adminClient
        .from("clients")
        .select("id")
        .eq("ruc", ruc.trim())
        .maybeSingle();
      if (existingRuc) {
        return new Response(JSON.stringify({ error: "Ya existe una empresa con ese RUC" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check email uniqueness
    const { data: existingEmail } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", admin_email.trim().toLowerCase())
      .maybeSingle();
    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: "Ya existe un usuario con ese email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create company
    const { data: company, error: companyError } = await adminClient
      .from("clients")
      .insert({
        company_name: company_name.trim(),
        ruc: ruc?.trim() || null,
        industry: industry?.trim() || null,
      })
      .select("id")
      .single();

    if (companyError) {
      return new Response(JSON.stringify({ error: "Error al crear empresa: " + companyError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create company modules
    const validModuleIds: string[] = module_ids ?? [];
    if (validModuleIds.length > 0) {
      const { error: cmError } = await adminClient.from("company_modules").insert(
        validModuleIds.map((mid: string) => ({
          company_id: company.id,
          module_id: mid,
          enabled: true,
          assigned_by: caller.id,
        }))
      );
      if (cmError) {
        console.error("Error creating company_modules:", cmError);
      }
    }

    // 3. Create auth user (trigger will create profile + client_user role)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: admin_email.trim().toLowerCase(),
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_name.trim() },
    });

    if (authError) {
      // Rollback company
      await adminClient.from("company_modules").delete().eq("company_id", company.id);
      await adminClient.from("clients").delete().eq("id", company.id);
      return new Response(
        JSON.stringify({ error: "Error al crear usuario: " + authError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = authData.user.id;

    // 4. Link user to company
    const { error: cuError } = await adminClient.from("client_users").insert({
      client_id: company.id,
      user_id: newUserId,
    });
    if (cuError) {
      console.error("Error linking user to company:", cuError);
    }

    // 5. Update role from client_user (set by trigger) to admin
    // First delete the trigger-created role, then insert admin
    await adminClient.from("user_roles").delete().eq("user_id", newUserId);
    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: newUserId,
      role: "admin",
    });
    if (roleError) {
      console.error("Error setting admin role:", roleError);
    }

    // 6. Create user modules (same as company modules)
    if (validModuleIds.length > 0) {
      const { error: umError } = await adminClient.from("user_modules").insert(
        validModuleIds.map((mid: string) => ({
          user_id: newUserId,
          module_id: mid,
          enabled: true,
        }))
      );
      if (umError) {
        console.error("Error creating user_modules:", umError);
      }
    }

    // 7. Create subscription if plan was selected
    if (plan && plan !== "none") {
      const today = new Date().toISOString().split("T")[0];
      // Trial: 30 days, basic/advanced: 1 year
      const endDate = new Date();
      if (plan === "trial") {
        endDate.setDate(endDate.getDate() + 30);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      const { error: subError } = await adminClient.from("subscriptions").insert({
        client_id: company.id,
        plan,
        start_date: today,
        end_date: endDate.toISOString().split("T")[0],
        status: "active",
      });
      if (subError) {
        console.error("Error creating subscription:", subError);
      }
    }

    return new Response(
      JSON.stringify({
        company_id: company.id,
        admin_user_id: newUserId,
        message: "Empresa y administrador creados correctamente",
      }),
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
