import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[AUTH] No Authorization header");
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isServiceRole = token === serviceRoleKey;

    if (!isServiceRole) {
      // Validate as user JWT
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        console.error("[AUTH] User auth failed:", authError?.message);
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log(`[AUTH] User: ${user.email}`);
    } else {
      console.log("[AUTH] Service role access");
    }

    const { emails, bccEmails, htmlContent } = await req.json();

    console.log(`[INPUT] emails: ${JSON.stringify(emails)}`);
    console.log(`[INPUT] bccEmails: ${JSON.stringify(bccEmails)}`);
    console.log(`[INPUT] htmlContent length: ${htmlContent?.length ?? 0}`);

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      console.error("[VALIDATION] No emails provided");
      return new Response(JSON.stringify({ error: "No se proporcionaron correos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!htmlContent) {
      console.error("[VALIDATION] No HTML content");
      return new Response(JSON.stringify({ error: "No se proporcionó contenido HTML" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      console.error("[CONFIG] BREVO_API_KEY not set");
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const subject = `⚡ Pronóstico de potencia | ${dd}/${mm}/${yy} ⚡`;

    const emailPayload: Record<string, unknown> = {
      sender: { name: "SERGEN", email: "info@sergen.pe" },
      to: emails.map((email: string) => ({ email })),
      subject,
      htmlContent,
    };

    if (bccEmails && Array.isArray(bccEmails) && bccEmails.length > 0) {
      emailPayload.bcc = bccEmails.map((email: string) => ({ email }));
    }

    console.log(`[BREVO] Sending to ${emails.length} TO + ${bccEmails?.length ?? 0} BCC`);

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await res.json();
    const success = res.status >= 200 && res.status < 300;

    console.log(`[BREVO] Response status: ${res.status}, success: ${success}`);
    if (!success) {
      console.error(`[BREVO] Error response:`, JSON.stringify(data));
    }

    return new Response(JSON.stringify({ success, data }), {
      status: success ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[FATAL] Error en send-email-alert:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
