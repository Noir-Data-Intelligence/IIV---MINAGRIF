import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const demoUsers = [
  { email: "admin@iiv.demo", password: "admin123", full_name: "Admin Demo", role: "admin" },
  { email: "tecnico@iiv.demo", password: "tecnico123", full_name: "Técnico Demo", role: "tecnico" },
  { email: "gestor@iiv.demo", password: "gestor123", full_name: "Gestor Demo", role: "gestor" },
  { email: "diretor@iiv.demo", password: "diretor123", full_name: "Diretor Demo", role: "diretor" },
  { email: "colaborador@iiv.demo", password: "colaborador123", full_name: "Colaborador Demo", role: "colaborador" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results = [];

    for (const user of demoUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const exists = existingUsers?.users?.find((u: { email?: string }) => u.email === user.email);

      if (exists) {
        results.push({ email: user.email, status: "already exists" });
        continue;
      }

      // Create user with auto-confirm
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name },
      });

      if (createError) {
        results.push({ email: user.email, status: "error", message: createError.message });
        continue;
      }

      // Assign role
      if (newUser?.user) {
        await supabaseAdmin.from("user_roles").insert({
          user_id: newUser.user.id,
          role: user.role,
        });
      }

      results.push({ email: user.email, status: "created", role: user.role });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
