import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useTableExport } from "@/hooks/useTableExport";
import { usePagination } from "@/hooks/usePagination";
import { Bell, Download, Trash2, ArrowUpRight, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface AlertRow {
  id: string;
  metric_key: string;
  label: string;
  value: number;
  threshold: number;
  tone: string;
  created_at: string;
  user_id: string;
  assigned_to: string | null;
  assigned_department_id: string | null;
  action_status: "pendente" | "em_curso" | "resolvido";
  action_notes: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
}

interface Profile { user_id: string; full_name: string }
interface Department { id: string; name: string }

const METRICS = [
  { key: "all", label: "Todas as métricas" },
  { key: "lowStock", label: "Stock Crítico" },
  { key: "expiringSoon", label: "Lotes a Expirar" },
  { key: "ncOpen", label: "Não Conformidades" },
  { key: "analysesPending", label: "Análises Pendentes" },
];

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_curso: "Em curso",
  resolvido: "Resolvido",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "destructive",
  em_curso: "secondary",
  resolvido: "default",
};

const STATUS_FILTERS = [
  { key: "all", label: "Todos os estados" },
  { key: "pendente", label: "Pendente" },
  { key: "em_curso", label: "Em curso" },
  { key: "resolvido", label: "Resolvido" },
];

export default function HistoricoAlertas() {
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [trend, setTrend] = useState<{ day: string; total: number }[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Assignment dialog
  const [editing, setEditing] = useState<AlertRow | null>(null);
  const [draftAssignee, setDraftAssignee] = useState<string>("none");
  const [draftDept, setDraftDept] = useState<string>("none");
  const [draftStatus, setDraftStatus] = useState<string>("pendente");
  const [draftNotes, setDraftNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const pag = usePagination(20);
  const { exportCSV } = useTableExport();

  useEffect(() => {
    (async () => {
      const [p, d] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").order("full_name"),
        supabase.from("departments").select("id, name").order("name"),
      ]);
      setProfiles((p.data as Profile[]) ?? []);
      setDepartments((d.data as Department[]) ?? []);
    })();
  }, []);

  const profileName = (id: string | null) =>
    id ? profiles.find((p) => p.user_id === id)?.full_name ?? "—" : "—";
  const deptName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name ?? "—" : "—";

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let q = supabase
        .from("dashboard_alert_history")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(pag.from, pag.to);
      if (metric !== "all") q = q.eq("metric_key", metric);
      if (status !== "all") q = q.eq("action_status", status);
      if (from) q = q.gte("created_at", new Date(from).toISOString());
      if (to) {
        const t = new Date(to);
        t.setHours(23, 59, 59, 999);
        q = q.lte("created_at", t.toISOString());
      }
      const { data, count } = await q;
      setRows((data as AlertRow[]) ?? []);
      pag.setTotal(count ?? 0);
      setLoading(false);
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pag.page, pag.pageSize, metric, status, from, to]);

  useEffect(() => {
    const fetchTrend = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      let q = supabase
        .from("dashboard_alert_history")
        .select("created_at, metric_key")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      if (metric !== "all") q = q.eq("metric_key", metric);
      const { data } = await q;
      const byDay: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        byDay[d.toISOString().slice(0, 10)] = 0;
      }
      (data ?? []).forEach((r: any) => {
        const k = r.created_at.slice(0, 10);
        if (k in byDay) byDay[k]++;
      });
      setTrend(Object.entries(byDay).map(([k, v]) => ({ day: k.slice(5), total: v })));
    };
    fetchTrend();
  }, [metric]);

  const openAssign = (row: AlertRow) => {
    setEditing(row);
    setDraftAssignee(row.assigned_to ?? "none");
    setDraftDept(row.assigned_department_id ?? "none");
    setDraftStatus(row.action_status ?? "pendente");
    setDraftNotes(row.action_notes ?? "");
  };

  const saveAssign = async () => {
    if (!editing) return;
    setSaving(true);
    const assignee = draftAssignee === "none" ? null : draftAssignee;
    const dept = draftDept === "none" ? null : draftDept;
    const patch: any = {
      assigned_to: assignee,
      assigned_department_id: dept,
      action_status: draftStatus,
      action_notes: draftNotes || null,
    };
    if (assignee && !editing.assigned_at) patch.assigned_at = new Date().toISOString();
    if (draftStatus === "resolvido" && !editing.resolved_at) patch.resolved_at = new Date().toISOString();
    if (draftStatus !== "resolvido") patch.resolved_at = null;

    const { error } = await supabase
      .from("dashboard_alert_history")
      .update(patch)
      .eq("id", editing.id);

    // Notify assignee
    if (!error && assignee && assignee !== editing.assigned_to) {
      await supabase.from("notifications").insert({
        user_id: assignee,
        title: "Alerta atribuído a si",
        message: `${editing.label} · valor ${editing.value} (limiar ${editing.threshold})`,
        type: "info",
        link: "/admin/historico-alertas",
      });
    }
    setSaving(false);
    if (error) return toast.error("Erro ao guardar atribuição");
    toast.success("Atribuição guardada");
    setEditing(null);
    setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...patch } : r)));
  };

  const clearAll = async () => {
    if (!confirm("Apagar todo o seu histórico de alertas? Esta ação não pode ser revertida.")) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("dashboard_alert_history").delete().eq("user_id", u.user.id);
    if (error) return toast.error("Erro ao limpar histórico");
    toast.success("Histórico limpo");
    pag.setPage(0);
    setRows([]);
    pag.setTotal(0);
  };

  const handleExport = () => {
    exportCSV(
      rows.map((r) => ({
        data: format(new Date(r.created_at), "dd/MM/yyyy HH:mm"),
        metrica: r.label,
        valor: r.value,
        limiar: r.threshold,
        severidade: r.tone,
        estado: STATUS_LABEL[r.action_status] ?? r.action_status,
        responsavel: profileName(r.assigned_to),
        departamento: deptName(r.assigned_department_id),
        notas: r.action_notes ?? "",
      })),
      "historico-alertas",
      {
        headers: {
          data: "Data/Hora", metrica: "Métrica", valor: "Valor", limiar: "Limiar",
          severidade: "Severidade", estado: "Estado", responsavel: "Responsável",
          departamento: "Departamento", notas: "Notas",
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Bell} title="Histórico de Alertas" description="Acompanhe recorrências, tendências e responsáveis pela ação">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0} className="gap-2">
          <Download className="h-4 w-4" /> Exportar
        </Button>
        <Button variant="outline" size="sm" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" /> Limpar
        </Button>
      </AdminPageHeader>

      {/* Filtros */}
      <AdminCard title="Filtros" icon={Bell}>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Métrica</label>
            <Select value={metric} onValueChange={(v) => { setMetric(v); pag.setPage(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METRICS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
            <Select value={status} onValueChange={(v) => { setStatus(v); pag.setPage(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">De</label>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); pag.setPage(0); }} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Até</label>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); pag.setPage(0); }} />
          </div>
        </div>
      </AdminCard>

      {/* Tendência */}
      <AdminCard title="Tendência (últimos 30 dias)" icon={Bell}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
            <Area type="monotone" dataKey="total" name="Alertas" stroke="hsl(38, 75%, 50%)" fill="hsl(38, 75%, 50%)" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </AdminCard>

      {/* Tabela */}
      <AdminCard title="Registos" icon={Bell} loading={loading} isEmpty={rows.length === 0} emptyMessage="Sem alertas registados para os filtros selecionados.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Métrica</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Limiar</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{r.label}</TableCell>
                  <TableCell className="text-right font-semibold">{r.value}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.threshold}</TableCell>
                  <TableCell className="text-sm">{profileName(r.assigned_to)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{deptName(r.assigned_department_id)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.action_status] ?? "outline"}>
                      {STATUS_LABEL[r.action_status] ?? r.action_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 whitespace-nowrap">
                    <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => openAssign(r)}>
                      <UserPlus className="h-3 w-3" /> Atribuir
                    </Button>
                    <Link to={`/admin/painel/${r.metric_key}`} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      Detalhes <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          page={pag.page}
          pageSize={pag.pageSize}
          total={pag.total}
          totalPages={pag.totalPages}
          canPrev={pag.canPrev}
          canNext={pag.canNext}
          onPageChange={pag.setPage}
          onPageSizeChange={pag.setPageSize}
        />
      </AdminCard>

      {/* Assignment Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Atribuir Alerta</DialogTitle>
            <DialogDescription>
              {editing && `${editing.label} · valor ${editing.value} (limiar ${editing.threshold})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Departamento</label>
              <Select value={draftDept} onValueChange={setDraftDept}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem departamento —</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Responsável</label>
              <Select value={draftAssignee} onValueChange={setDraftAssignee}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem responsável —</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Estado da ação</label>
              <Select value={draftStatus} onValueChange={setDraftStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_curso">Em curso</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Notas da ação</label>
              <Textarea
                rows={3}
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                placeholder="Descreva a ação prevista ou tomada..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveAssign} disabled={saving}>
              {saving ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
