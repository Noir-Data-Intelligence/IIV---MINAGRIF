import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useUserRole } from "@/hooks/useUserRole";
import { useTableExport } from "@/hooks/useTableExport";
import { Workflow, Plus, Eye, AlertTriangle, Settings, Download, User as UserIcon, BarChart3 } from "lucide-react";
import type { AppRole } from "@/lib/permissions";

interface ProcessType { id: string; name: string; description: string | null; sla_days: number | null }
interface TypeStep { id: string; process_type_id: string; order_index: number; name: string; default_role: AppRole | null; sla_days: number | null }
interface Process {
  id: string; code: string; type_id: string; title: string; description: string | null;
  requester_id: string; status: "aberto"|"em_curso"|"concluido"|"cancelado";
  priority: "baixa"|"normal"|"alta"|"urgente"; due_date: string | null;
  opened_at: string; closed_at: string | null;
}

const statusVariant: Record<string, "default"|"secondary"|"destructive"|"outline"> = {
  aberto: "secondary", em_curso: "default", concluido: "outline", cancelado: "destructive",
};
const statusLabel: Record<string, string> = {
  aberto: "Aberto", em_curso: "Em curso", concluido: "Concluído", cancelado: "Cancelado",
};
const priorityVariant: Record<string, "default"|"secondary"|"destructive"|"outline"> = {
  baixa: "outline", normal: "secondary", alta: "default", urgente: "destructive",
};

export default function Processos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const pag = usePagination(20);

  const [items, setItems] = useState<Process[]>([]);
  const [types, setTypes] = useState<ProcessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [scope, setScope] = useState<"todos" | "meus">("todos");
  const [stats, setStats] = useState({ abertos: 0, em_curso: 0, concluidos: 0, atrasados: 0 });
  const { isAdmin } = useUserRole();
  const { exportCSV } = useTableExport();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type_id: "", title: "", description: "",
    priority: "normal", due_date: "",
  });

  const fetchTypes = async () => {
    const { data } = await supabase.from("process_types").select("*").eq("is_active", true).order("name");
    setTypes(data ?? []);
  };

  const fetchStats = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [a, c, x, l] = await Promise.all([
      supabase.from("processes").select("id", { count: "exact", head: true }).eq("status", "aberto"),
      supabase.from("processes").select("id", { count: "exact", head: true }).eq("status", "em_curso"),
      supabase.from("processes").select("id", { count: "exact", head: true }).eq("status", "concluido"),
      supabase.from("processes").select("id", { count: "exact", head: true })
        .in("status", ["aberto", "em_curso"]).lt("due_date", today),
    ]);
    setStats({
      abertos: a.count ?? 0, em_curso: c.count ?? 0,
      concluidos: x.count ?? 0, atrasados: l.count ?? 0,
    });
  };

  const fetchData = async () => {
    setLoading(true);
    let q = supabase.from("processes").select("*", { count: "exact" })
      .order("opened_at", { ascending: false });
    if (statusFilter !== "todos") q = q.eq("status", statusFilter as any);
    if (typeFilter !== "todos") q = q.eq("type_id", typeFilter);
    if (scope === "meus" && user) q = q.eq("requester_id", user.id);
    if (dSearch.trim()) {
      const s = `%${dSearch.trim()}%`;
      q = q.or(`title.ilike.${s},code.ilike.${s},description.ilike.${s}`);
    }
    const { data, count, error } = await q.range(pag.from, pag.to);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    setItems((data ?? []) as Process[]);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchTypes(); fetchStats(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [pag.page, pag.pageSize, dSearch, statusFilter, typeFilter, scope]);

  // Realtime: refresh list and stats whenever processes change
  useEffect(() => {
    const channel = supabase
      .channel("processes-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "processes" }, () => {
        fetchData();
        fetchStats();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dSearch, statusFilter, typeFilter, scope, pag.page, pag.pageSize]);

  const handleExport = () => {
    exportCSV(
      items.map(p => ({
        Codigo: p.code, Titulo: p.title, Tipo: types.find(t => t.id === p.type_id)?.name ?? "",
        Prioridade: p.priority, Estado: statusLabel[p.status],
        Prazo: p.due_date ?? "", Aberto: new Date(p.opened_at).toLocaleDateString("pt-PT"),
      })),
      "processos",
    );
  };

  const openCreate = () => {
    setForm({ type_id: "", title: "", description: "", priority: "normal", due_date: "" });
    setOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.type_id || !form.title.trim()) {
      toast({ title: "Campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // 1) Create process
      const { data: proc, error: pErr } = await supabase.from("processes").insert({
        type_id: form.type_id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        requester_id: user.id,
        priority: form.priority as any,
        due_date: form.due_date || null,
        status: "aberto",
        code: "", // trigger will generate
      } as any).select().single();
      if (pErr) throw pErr;

      // 2) Instantiate steps from type
      const { data: typeSteps } = await supabase.from("process_type_steps")
        .select("*").eq("process_type_id", form.type_id).order("order_index");
      if (typeSteps && typeSteps.length > 0) {
        const rows = (typeSteps as TypeStep[]).map((s, i) => ({
          process_id: proc.id,
          type_step_id: s.id,
          order_index: s.order_index,
          name: s.name,
          assignee_role: s.default_role,
          status: i === 0 ? "em_curso" : "pendente" as any,
          started_at: i === 0 ? new Date().toISOString() : null,
          due_at: s.sla_days ? new Date(Date.now() + s.sla_days * 86400000).toISOString() : null,
        }));
        const { data: insertedSteps, error: sErr } = await supabase.from("process_steps").insert(rows).select();
        if (sErr) throw sErr;
        // Set current_step_id and status
        const firstStep = (insertedSteps ?? []).sort((a: any, b: any) => a.order_index - b.order_index)[0];
        if (firstStep) {
          await supabase.from("processes").update({
            current_step_id: firstStep.id,
            status: "em_curso",
          }).eq("id", proc.id);
        }
      }

      // 3) Event
      await supabase.from("process_events").insert({
        process_id: proc.id, actor_id: user.id, event_type: "aberto",
        payload: { title: form.title },
      });

      toast({ title: "Processo aberto", description: form.title });
      setOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const typeName = (id: string) => types.find(t => t.id === id)?.name ?? "—";
  const isOverdue = (p: Process) =>
    p.due_date && p.status !== "concluido" && p.status !== "cancelado" &&
    new Date(p.due_date).getTime() < Date.now();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Workflow}
        title="Gestão de Processos"
        description="Workflow administrativo com etapas, responsáveis e SLAs."
      >
        <Button asChild variant="outline" className="gap-2">
          <Link to="/admin/processos/analitica"><BarChart3 className="h-4 w-4" /> Analítica</Link>
        </Button>
        {isAdmin && (
          <Button asChild variant="outline" className="gap-2">
            <Link to="/admin/processos/tipos"><Settings className="h-4 w-4" /> Tipos</Link>
          </Button>
        )}
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo processo
        </Button>
      </AdminPageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { k: "abertos", label: "Abertos", value: stats.abertos, tone: "text-secondary-foreground" },
          { k: "em_curso", label: "Em curso", value: stats.em_curso, tone: "text-primary" },
          { k: "concluidos", label: "Concluídos", value: stats.concluidos, tone: "text-emerald-600 dark:text-emerald-400" },
          { k: "atrasados", label: "Em atraso", value: stats.atrasados, tone: "text-destructive" },
        ].map(s => (
          <div key={s.k} className="rounded-lg border border-border/40 bg-card p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <AdminCard>
        <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
          <Input
            placeholder="Pesquisar por código, título ou descrição…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os estados</SelectItem>
              {Object.entries(statusLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={scope} onValueChange={(v) => setScope(v as any)}>
            <SelectTrigger className="sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="meus">Os meus</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 sm:ml-auto" onClick={handleExport} disabled={items.length === 0}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>

        {loading ? (
          <AdminCard loading />
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum processo encontrado.
          </div>
        ) : (
          <div className="rounded-lg border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell className="font-medium max-w-[280px] truncate">{p.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{typeName(p.type_id)}</TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant[p.priority]} className="capitalize">{p.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status]}>{statusLabel[p.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.due_date ? (
                        <span className={isOverdue(p) ? "text-destructive flex items-center gap-1" : ""}>
                          {isOverdue(p) && <AlertTriangle className="h-3.5 w-3.5" />}
                          {new Date(p.due_date).toLocaleDateString("pt-PT")}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost" className="gap-1">
                        <Link to={`/admin/processos/${p.id}`}>
                          <Eye className="h-4 w-4" /> Abrir
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <TablePagination
          page={pag.page} pageSize={pag.pageSize} total={pag.total} totalPages={pag.totalPages}
          canPrev={pag.canPrev} canNext={pag.canNext}
          onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize}
        />
      </AdminCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Novo processo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Tipo de processo *</Label>
              <Select value={form.type_id} onValueChange={(v) => setForm({ ...form, type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prazo</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "A criar…" : "Abrir processo"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
