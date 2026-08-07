import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const nowIso = new Date().toISOString();
  const todayStr = nowIso.slice(0, 10);

  // 1) Overdue processes (due_date passed, still open/in progress)
  const { data: overdueProc } = await supabase
    .from("processes")
    .select("id, code, title, requester_id, due_date")
    .lt("due_date", todayStr)
    .in("status", ["aberto", "em_curso"]);

  // 2) Overdue process steps (due_at passed, not concluded/returned)
  const { data: overdueSteps } = await supabase
    .from("process_steps")
    .select("id, process_id, name, assignee_user_id, assignee_role, due_at, status")
    .lt("due_at", nowIso)
    .in("status", ["pendente", "em_curso"]);

  interface PendingNotification {
    user_id: string;
    title: string;
    message: string;
    link: string;
    type: "warning";
  }

  const notifications: PendingNotification[] = [];

  for (const p of overdueProc ?? []) {
    if (!p.requester_id) continue;
    notifications.push({
      user_id: p.requester_id,
      title: `Processo ${p.code} em atraso`,
      message: `${p.title} · prazo: ${p.due_date}`,
      link: `/admin/processos/${p.id}`,
      type: "warning",
    });
  }

  for (const s of overdueSteps ?? []) {
    const recipients = new Set<string>();
    if (s.assignee_user_id) recipients.add(s.assignee_user_id);
    if (s.assignee_role) {
      const { data: users } = await supabase
        .from("user_roles").select("user_id").eq("role", s.assignee_role);
      (users ?? []).forEach((u: { user_id: string }) => recipients.add(u.user_id));
    }
    for (const uid of recipients) {
      notifications.push({
        user_id: uid,
        title: "Etapa em atraso",
        message: `${s.name} · prazo: ${new Date(s.due_at!).toLocaleDateString("pt-PT")}`,
        link: `/admin/processos/${s.process_id}`,
        type: "warning",
      });
    }
  }

  if (notifications.length) {
    await supabase.from("notifications").insert(notifications);
  }

  return new Response(
    JSON.stringify({
      processes: overdueProc?.length ?? 0,
      steps: overdueSteps?.length ?? 0,
      notifications: notifications.length,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
