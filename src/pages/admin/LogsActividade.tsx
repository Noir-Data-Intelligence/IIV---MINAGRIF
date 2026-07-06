import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Download, Filter, X, LogIn, Pencil, Trash2, Plus, AlertOctagon } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";

interface Log {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
  user_id: string | null;
  ip_address: string | null;
}

interface ProfileLite {
  user_id: string;
  full_name: string;
}

const ACTION_META: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Shield }> = {
  create: { label: "Criação", variant: "default", icon: Plus },
  update: { label: "Alteração", variant: "secondary", icon: Pencil },
  delete: { label: "Eliminação", variant: "destructive", icon: Trash2 },
  login: { label: "Login", variant: "outline", icon: LogIn },
  logout: { label: "Logout", variant: "outline", icon: LogIn },
  critical: { label: "Crítica", variant: "destructive", icon: AlertOctagon },
};

export default function LogsActividade() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [userFilter, setUserFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const debEntity = useDebounce(entityFilter, 350);
  const pag = usePagination(20);

  // Reset to first page when filters change
  useEffect(() => {
    pag.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFilter, actionFilter, debEntity, dateFrom, dateTo]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name").order("full_name");
      setProfiles((data as ProfileLite[]) ?? []);
    };
    load();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      let q = supabase
        .from("activity_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (userFilter !== "all") q = q.eq("user_id", userFilter);
      if (actionFilter !== "all") q = q.eq("action", actionFilter);
      if (debEntity.trim()) q = q.ilike("entity_type", `%${debEntity.trim()}%`);
      if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        q = q.lte("created_at", end.toISOString());
      }

      const { data, count } = await q.range(pag.from, pag.to);
      setLogs((data as Log[]) ?? []);
      pag.setTotal(count ?? 0);
      setLoading(false);
    };
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pag.page, pag.pageSize, userFilter, actionFilter, debEntity, dateFrom, dateTo]);

  const profileMap = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.user_id, p.full_name || "—"));
    return m;
  }, [profiles]);

  const clearFilters = () => {
    setUserFilter("all");
    setActionFilter("all");
    setEntityFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = userFilter !== "all" || actionFilter !== "all" || entityFilter || dateFrom || dateTo;

  const exportCsv = () => {
    const header = ["Data", "Utilizador", "Acção", "Entidade", "ID Entidade", "IP", "Detalhes"];
    const rows = logs.map((l) => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss"),
      l.user_id ? profileMap.get(l.user_id) ?? l.user_id : "Sistema",
      l.action,
      l.entity_type,
      l.entity_id ?? "",
      l.ip_address ?? "",
      l.details ? JSON.stringify(l.details).replace(/"/g, '""') : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c)}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Shield}
        title="Auditoria do Sistema"
        description="Eventos de login, alterações e acções críticas com rastreio completo"
      />

      <AdminCard title="Filtros" icon={Filter}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Utilizador</Label>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Acção</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(ACTION_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Entidade</Label>
            <Input placeholder="ex: lote, análise…" value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>De</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Até</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilters}>
            <X className="h-4 w-4 mr-1" /> Limpar filtros
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
        </div>
      </AdminCard>

      <AdminCard
        title={`Registos (${pag.total})`}
        icon={Shield}
        loading={loading}
        isEmpty={logs.length === 0}
        emptyMessage="Nenhum registo encontrado para os filtros aplicados."
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Utilizador</TableHead>
                <TableHead>Acção</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => {
                const meta = ACTION_META[l.action] ?? { label: l.action, variant: "outline" as const, icon: Shield };
                const Icon = meta.icon;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(l.created_at), "dd/MM/yyyy HH:mm:ss", { locale: pt })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.user_id ? profileMap.get(l.user_id) ?? <span className="text-muted-foreground">{l.user_id.slice(0, 8)}…</span> : <span className="text-muted-foreground italic">Sistema</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{l.entity_type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{l.ip_address ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-sm truncate" title={l.details ? JSON.stringify(l.details) : ""}>
                      {l.details ? JSON.stringify(l.details) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
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
    </div>
  );
}
