import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  // Documents expiring in next 30 days OR already expired today
  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, title, owner_id, reviewer_id, expiry_date, status")
    .not("expiry_date", "is", null)
    .lte("expiry_date", in30)
    .neq("status", "arquivado");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const notifications: any[] = [];
  for (const d of docs ?? []) {
    const expired = d.expiry_date! <= todayStr;
    const recipients = new Set<string>();
    if (d.owner_id) recipients.add(d.owner_id);
    if (d.reviewer_id) recipients.add(d.reviewer_id);
    for (const uid of recipients) {
      notifications.push({
        user_id: uid,
        title: expired ? "Documento expirado" : "Documento perto da validade",
        message: `${d.title} · ${expired ? "expirou" : "expira"} em ${d.expiry_date}`,
        link: "/admin/documentos",
        type: expired ? "warning" : "info",
      });
    }
  }

  if (notifications.length) {
    await supabase.from("notifications").insert(notifications);
  }

  return new Response(
    JSON.stringify({ processed: docs?.length ?? 0, notifications: notifications.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
