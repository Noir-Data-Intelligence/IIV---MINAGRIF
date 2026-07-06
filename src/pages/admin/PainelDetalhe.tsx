import { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, TrendingUp, Boxes, Truck, AlertTriangle, PackageX,
  CalendarClock, Users, BarChart3, PieChart, Pill, ArrowLeft, Search,
  type LucideIcon,
} from "lucide-react";

type Row = Record<string, any>;
type Col = { key: string; label: string; render?: (r: Row) => React.ReactNode; className?: string };

type StatusOpt = { value: string; label: string };

type MetricConfig = {
  title: string;
  description: string;
  icon: LucideIcon;
  fetch: () => Promise<Row[]>;
  columns: Col[];
  searchKeys?: string[];
  statusKey?: string;
  statusOptions?: StatusOpt[];
  emptyMessage?: string;
};

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("pt-PT") : "—");
const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }) : "—";

const STATUS_ANALYSIS: Record<string, string> = {
  agendada: "Agendada", em_progresso: "Em Progresso", concluida: "Concluída", cancelada: "Cancelada",
};
const STATUS_BATCH: Record<string, string> = {
  planeada: "Planeada", em_producao: "Em Produção", concluida: "Concluída", suspensa: "Suspensa",
};
const STATUS_NC: Record<string, string> = {
  aberta: "Aberta", em_resolucao: "Em Resolução", resolvida: "Resolvida", encerrada: "Encerrada",
};
const TYPE_PRODUCT: Record<string, string> = { vacina: "Vacina", soro: "Soro", reagente: "Reagente" };

function statusBadge(label: string, tone: "default" | "secondary" | "destructive" | "outline" = "secondary") {
  return <Badge variant={tone}>{label}</Badge>;
}

const analysisColumns: Col[] = [
  { key: "client_name", label: "Cliente" },
  { key: "analysis_type", label: "Tipo" },
  { key: "sample_type", label: "Amostra" },
  { key: "scheduled_date", label: "Agendada", render: (r) => fmtDate(r.scheduled_date) },
  { key: "status", label: "Estado", render: (r) => statusBadge(STATUS_ANALYSIS[r.status] || r.status) },
];

const batchColumns: Col[] = [
  { key: "batch_number", label: "Lote" },
  { key: "quantity_produced", label: "Produzido" },
  { key: "quantity_distributed", label: "Distribuído" },
  { key: "production_date", label: "Produção", render: (r) => fmtDate(r.production_date) },
  { key: "expiry_date", label: "Expira", render: (r) => fmtDate(r.expiry_date) },
  { key: "status", label: "Estado", render: (r) => statusBadge(STATUS_BATCH[r.status] || r.status) },
];

const CONFIG: Record<string, MetricConfig> = {
  // ---------- KPIs ----------
  analysesPending: {
    title: "Análises Pendentes",
    description: "Análises agendadas ou em progresso",
    icon: Activity,
    fetch: async () => {
      const { data } = await supabase
        .from("lab_analyses")
        .select("*")
        .in("status", ["agendada", "em_progresso"])
        .order("scheduled_date", { ascending: true });
      return data ?? [];
    },
    columns: analysisColumns,
    searchKeys: ["client_name", "analysis_type", "sample_type"],
    statusKey: "status",
    statusOptions: [
      { value: "agendada", label: "Agendada" },
      { value: "em_progresso", label: "Em Progresso" },
    ],
  },
  completionRate: {
    title: "Taxa de Conclusão",
    description: "Todas as análises agrupadas por estado",
    icon: TrendingUp,
    fetch: async () => {
      const { data } = await supabase.from("lab_analyses").select("*").order("scheduled_date", { ascending: false });
      return data ?? [];
    },
    columns: analysisColumns,
    searchKeys: ["client_name", "analysis_type"],
    statusKey: "status",
    statusOptions: Object.entries(STATUS_ANALYSIS).map(([value, label]) => ({ value, label })),
  },
  batchesActive: {
    title: "Lotes Ativos",
    description: "Lotes em produção ou planeados",
    icon: Boxes,
    fetch: async () => {
      const { data } = await supabase
        .from("production_batches")
        .select("*")
        .in("status", ["em_producao", "planeada"])
        .order("production_date", { ascending: false });
      return data ?? [];
    },
    columns: batchColumns,
    searchKeys: ["batch_number"],
    statusKey: "status",
    statusOptions: [
      { value: "planeada", label: "Planeada" },
      { value: "em_producao", label: "Em Produção" },
    ],
  },
  distributionsMonth: {
    title: "Distribuído no Mês",
    description: "Distribuições do mês corrente",
    icon: Truck,
    fetch: async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("batch_distributions")
        .select("*")
        .gte("distribution_date", start)
        .lt("distribution_date", end)
        .order("distribution_date", { ascending: false });
      return data ?? [];
    },
    columns: [
      { key: "destination", label: "Destino" },
      { key: "quantity", label: "Quantidade" },
      { key: "distribution_date", label: "Data", render: (r) => fmtDate(r.distribution_date) },
      { key: "notes", label: "Notas", render: (r) => r.notes || "—" },
    ],
    searchKeys: ["destination", "notes"],
  },
  ncOpen: {
    title: "Não Conformidades Abertas",
    description: "Não conformidades abertas ou em resolução",
    icon: AlertTriangle,
    fetch: async () => {
      const { data } = await supabase
        .from("nonconformities")
        .select("*")
        .in("status", ["aberta", "em_resolucao"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    columns: [
      { key: "title", label: "Título" },
      { key: "severity", label: "Severidade", render: (r) => <Badge variant="outline">{r.severity}</Badge> },
      { key: "deadline", label: "Prazo", render: (r) => fmtDate(r.deadline) },
      { key: "status", label: "Estado", render: (r) => statusBadge(STATUS_NC[r.status] || r.status) },
    ],
    searchKeys: ["title", "description"],
    statusKey: "status",
    statusOptions: [
      { value: "aberta", label: "Aberta" },
      { value: "em_resolucao", label: "Em Resolução" },
    ],
  },
  lowStock: {
    title: "Stock Crítico",
    description: "Insumos com quantidade abaixo do mínimo",
    icon: PackageX,
    fetch: async () => {
      const { data } = await supabase.from("lab_supplies").select("*");
      return (data ?? []).filter((s: any) => (s.quantity ?? 0) <= (s.min_stock ?? 0));
    },
    columns: [
      { key: "name", label: "Insumo" },
      { key: "quantity", label: "Quantidade" },
      { key: "min_stock", label: "Mínimo" },
      { key: "unit", label: "Unidade" },
      { key: "expiry_date", label: "Expira", render: (r) => fmtDate(r.expiry_date) },
    ],
    searchKeys: ["name", "unit"],
  },
  expiringSoon: {
    title: "Lotes a Expirar",
    description: "Lotes que expiram nos próximos 30 dias",
    icon: CalendarClock,
    fetch: async () => {
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 86400000);
      const { data } = await supabase
        .from("production_batches")
        .select("*")
        .gte("expiry_date", now.toISOString().slice(0, 10))
        .lte("expiry_date", in30.toISOString().slice(0, 10))
        .order("expiry_date", { ascending: true });
      return data ?? [];
    },
    columns: batchColumns,
    searchKeys: ["batch_number"],
  },
  users: {
    title: "Utilizadores",
    description: "Todos os utilizadores registados",
    icon: Users,
    fetch: async () => {
      const { data } = await (supabase as any).rpc("admin_list_profiles");
      return (data ?? []) as any[];
    },
    columns: [
      { key: "full_name", label: "Nome", render: (r) => r.full_name || "—" },
      { key: "phone", label: "Telefone", render: (r) => r.phone || "—" },
      { key: "created_at", label: "Registado", render: (r) => fmtDateTime(r.created_at) },
    ],
    searchKeys: ["full_name", "phone"],
  },

  // ---------- Charts ----------
  monthlyAnalyses: {
    title: "Análises por Mês",
    description: "Todas as análises com data agendada",
    icon: BarChart3,
    fetch: async () => {
      const { data } = await supabase.from("lab_analyses").select("*").order("scheduled_date", { ascending: false });
      return data ?? [];
    },
    columns: analysisColumns,
    searchKeys: ["client_name", "analysis_type"],
    statusKey: "status",
    statusOptions: Object.entries(STATUS_ANALYSIS).map(([value, label]) => ({ value, label })),
  },
  analysisStatus: {
    title: "Estado das Análises",
    description: "Distribuição de análises por estado",
    icon: PieChart,
    fetch: async () => {
      const { data } = await supabase.from("lab_analyses").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
    columns: analysisColumns,
    searchKeys: ["client_name", "analysis_type"],
    statusKey: "status",
    statusOptions: Object.entries(STATUS_ANALYSIS).map(([value, label]) => ({ value, label })),
  },
  monthlyProduction: {
    title: "Produção vs Distribuição",
    description: "Lotes produzidos e quantidades distribuídas",
    icon: BarChart3,
    fetch: async () => {
      const { data } = await supabase
        .from("production_batches")
        .select("*")
        .order("production_date", { ascending: false });
      return data ?? [];
    },
    columns: batchColumns,
    searchKeys: ["batch_number"],
    statusKey: "status",
    statusOptions: Object.entries(STATUS_BATCH).map(([value, label]) => ({ value, label })),
  },
  productionStatus: {
    title: "Estado dos Lotes",
    description: "Distribuição de lotes por estado",
    icon: PieChart,
    fetch: async () => {
      const { data } = await supabase
        .from("production_batches")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    columns: batchColumns,
    searchKeys: ["batch_number"],
    statusKey: "status",
    statusOptions: Object.entries(STATUS_BATCH).map(([value, label]) => ({ value, label })),
  },
  productTypes: {
    title: "Produtos por Tipo",
    description: "Catálogo de produtos agrupado por tipo",
    icon: Pill,
    fetch: async () => {
      const { data } = await supabase.from("products").select("*").order("name", { ascending: true });
      return data ?? [];
    },
    columns: [
      { key: "name", label: "Produto" },
      { key: "product_type", label: "Tipo", render: (r) => <Badge variant="outline">{TYPE_PRODUCT[r.product_type] || r.product_type}</Badge> },
      { key: "unit", label: "Unidade" },
      { key: "is_active", label: "Ativo", render: (r) => (r.is_active ? "Sim" : "Não") },
    ],
    searchKeys: ["name"],
    statusKey: "product_type",
    statusOptions: Object.entries(TYPE_PRODUCT).map(([value, label]) => ({ value, label })),
  },
};

export default function PainelDetalhe() {
  const { metric = "" } = useParams();
  const config = CONFIG[metric];

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!config) return;
    setLoading(true);
    setSearch("");
    setStatusFilter("all");
    config.fetch().then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, [metric]);

  const filtered = useMemo(() => {
    if (!config) return [];
    let out = rows;
    if (statusFilter !== "all" && config.statusKey) {
      out = out.filter((r) => r[config.statusKey!] === statusFilter);
    }
    if (search.trim() && config.searchKeys?.length) {
      const q = search.toLowerCase();
      out = out.filter((r) =>
        config.searchKeys!.some((k) => String(r[k] ?? "").toLowerCase().includes(q))
      );
    }
    return out;
  }, [rows, search, statusFilter, config]);

  if (!config) return <Navigate to="/admin" replace />;

  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Icon} title={config.title} description={config.description}>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/admin">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
          </Link>
        </Button>
      </AdminPageHeader>

      <Card className="glass-card shadow-elegant rounded-xl">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {config.searchKeys && config.searchKeys.length > 0 && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Procurar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
            {config.statusOptions && config.statusKey && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-56">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {config.statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center text-sm text-muted-foreground sm:ml-auto">
              <Badge variant="secondary" className="font-normal">
                {filtered.length} {filtered.length === 1 ? "registo" : "registos"}
              </Badge>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {config.emptyMessage ?? "Sem registos para os filtros selecionados."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    {config.columns.map((c) => (
                      <TableHead key={c.key} className={c.className}>{c.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, i) => (
                    <TableRow key={r.id ?? i}>
                      {config.columns.map((c) => (
                        <TableCell key={c.key} className={c.className}>
                          {c.render ? c.render(r) : (r[c.key] ?? "—")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
