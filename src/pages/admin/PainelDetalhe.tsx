import { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
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
import { useAnalisesList } from "@/hooks/queries/useAnalises";
import { useLotesList } from "@/hooks/queries/useLotes";
import { useNaoConformidadesList } from "@/hooks/queries/useNaoConformidades";
import { useInsumosList } from "@/hooks/queries/useInsumos";
import { useDistribuicaoList } from "@/hooks/queries/useDistribuicao";
import { useProdutosList } from "@/hooks/queries/useProdutos";
import { useUsersList } from "@/hooks/queries/useUsers";
import { fmtDate, fmtDateTime, isExpiringSoon, isCurrentMonth } from "@/lib/dashboard-metrics";

type Row = Record<string, any>;
type Col = { key: string; label: string; render?: (r: Row) => React.ReactNode; className?: string };

type StatusOpt = { value: string; label: string };

/** Fontes de dados subjacentes a cada métrica (hooks já migrados). */
type Source = "analises" | "lotes" | "nc" | "insumos" | "distribuicao" | "produtos" | "users";

type MetricConfig = {
  title: string;
  description: string;
  icon: LucideIcon;
  source: Source;
  /** Filtro client-side aplicado à fonte (ex: só stock crítico). */
  filter?: (r: Row) => boolean;
  columns: Col[];
  searchKeys?: string[];
  statusKey?: string;
  statusOptions?: StatusOpt[];
  emptyMessage?: string;
};

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

// Colunas em camelCase (DTOs Laravel via API Resources).
const analysisColumns: Col[] = [
  { key: "clientName", label: "Cliente" },
  { key: "analysisType", label: "Tipo" },
  { key: "sampleType", label: "Amostra" },
  { key: "scheduledDate", label: "Agendada", render: (r) => fmtDate(r.scheduledDate) },
  { key: "status", label: "Estado", render: (r) => statusBadge(STATUS_ANALYSIS[r.status] || r.status) },
];

const batchColumns: Col[] = [
  { key: "batchNumber", label: "Lote" },
  { key: "quantityProduced", label: "Produzido" },
  { key: "quantityDistributed", label: "Distribuído" },
  { key: "productionDate", label: "Produção", render: (r) => fmtDate(r.productionDate) },
  { key: "expiryDate", label: "Expira", render: (r) => fmtDate(r.expiryDate) },
  { key: "status", label: "Estado", render: (r) => statusBadge(STATUS_BATCH[r.status] || r.status) },
];

const CONFIG: Record<string, MetricConfig> = {
  // ---------- KPIs ----------
  analysesPending: {
    title: "Análises Pendentes",
    description: "Análises agendadas ou em progresso",
    icon: Activity,
    source: "analises",
    filter: (r) => r.status === "agendada" || r.status === "em_progresso",
    columns: analysisColumns,
    searchKeys: ["clientName", "analysisType", "sampleType"],
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
    source: "analises",
    columns: analysisColumns,
    searchKeys: ["clientName", "analysisType"],
    statusKey: "status",
    statusOptions: Object.entries(STATUS_ANALYSIS).map(([value, label]) => ({ value, label })),
  },
  batchesActive: {
    title: "Lotes Ativos",
    description: "Lotes em produção ou planeados",
    icon: Boxes,
    source: "lotes",
    filter: (r) => r.status === "em_producao" || r.status === "planeada",
    columns: batchColumns,
    searchKeys: ["batchNumber"],
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
    source: "distribuicao",
    filter: (r) => isCurrentMonth(r.distributionDate),
    columns: [
      { key: "destination", label: "Destino" },
      { key: "quantity", label: "Quantidade" },
      { key: "distributionDate", label: "Data", render: (r) => fmtDate(r.distributionDate) },
      { key: "notes", label: "Notas", render: (r) => r.notes || "—" },
    ],
    searchKeys: ["destination", "notes"],
  },
  ncOpen: {
    title: "Não Conformidades Abertas",
    description: "Não conformidades abertas ou em resolução",
    icon: AlertTriangle,
    source: "nc",
    filter: (r) => r.status === "aberta" || r.status === "em_resolucao",
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
    source: "insumos",
    filter: (r) => (r.quantity ?? 0) <= (r.minStock ?? 0),
    columns: [
      { key: "name", label: "Insumo" },
      { key: "quantity", label: "Quantidade" },
      { key: "minStock", label: "Mínimo" },
      { key: "unit", label: "Unidade" },
      { key: "expiryDate", label: "Expira", render: (r) => fmtDate(r.expiryDate) },
    ],
    searchKeys: ["name", "unit"],
  },
  expiringSoon: {
    title: "Lotes a Expirar",
    description: "Lotes que expiram nos próximos 30 dias",
    icon: CalendarClock,
    source: "lotes",
    filter: (r) => isExpiringSoon(r.expiryDate),
    columns: batchColumns,
    searchKeys: ["batchNumber"],
  },
  users: {
    title: "Utilizadores",
    description: "Todos os utilizadores registados",
    icon: Users,
    source: "users",
    columns: [
      { key: "fullName", label: "Nome", render: (r) => r.fullName || "—" },
      { key: "phone", label: "Telefone", render: (r) => r.phone || "—" },
      { key: "createdAt", label: "Registado", render: (r) => fmtDateTime(r.createdAt) },
    ],
    searchKeys: ["fullName", "phone"],
  },

  // ---------- Charts ----------
  monthlyAnalyses: {
    title: "Análises por Mês",
    description: "Todas as análises com data agendada",
    icon: BarChart3,
    source: "analises",
    columns: analysisColumns,
    searchKeys: ["clientName", "analysisType"],
    statusKey: "status",
    statusOptions: Object.entries(STATUS_ANALYSIS).map(([value, label]) => ({ value, label })),
  },
  analysisStatus: {
    title: "Estado das Análises",
    description: "Distribuição de análises por estado",
    icon: PieChart,
    source: "analises",
    columns: analysisColumns,
    searchKeys: ["clientName", "analysisType"],
    statusKey: "status",
    statusOptions: Object.entries(STATUS_ANALYSIS).map(([value, label]) => ({ value, label })),
  },
  monthlyProduction: {
    title: "Produção vs Distribuição",
    description: "Lotes produzidos e quantidades distribuídas",
    icon: BarChart3,
    source: "lotes",
    columns: batchColumns,
    searchKeys: ["batchNumber"],
    statusKey: "status",
    statusOptions: Object.entries(STATUS_BATCH).map(([value, label]) => ({ value, label })),
  },
  productionStatus: {
    title: "Estado dos Lotes",
    description: "Distribuição de lotes por estado",
    icon: PieChart,
    source: "lotes",
    columns: batchColumns,
    searchKeys: ["batchNumber"],
    statusKey: "status",
    statusOptions: Object.entries(STATUS_BATCH).map(([value, label]) => ({ value, label })),
  },
  productTypes: {
    title: "Produtos por Tipo",
    description: "Catálogo de produtos agrupado por tipo",
    icon: Pill,
    source: "produtos",
    columns: [
      { key: "name", label: "Produto" },
      { key: "productType", label: "Tipo", render: (r) => <Badge variant="outline">{TYPE_PRODUCT[r.productType] || r.productType}</Badge> },
      { key: "unit", label: "Unidade" },
      { key: "isArchived", label: "Ativo", render: (r) => (r.isArchived ? "Não" : "Sim") },
    ],
    searchKeys: ["name"],
    statusKey: "productType",
    statusOptions: Object.entries(TYPE_PRODUCT).map(([value, label]) => ({ value, label })),
  },
};

export default function PainelDetalhe() {
  const { metric = "" } = useParams();
  const config = CONFIG[metric];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Reset filtros ao trocar de métrica.
  useEffect(() => {
    setSearch("");
    setStatusFilter("all");
  }, [metric]);

  // Fontes subjacentes — perPage alto para trazer tudo e filtrar client-side,
  // à semelhança das páginas de detalhe/agregação já migradas.
  const analisesQuery = useAnalisesList({ page: 1, perPage: 1000 });
  const lotesQuery = useLotesList({ page: 1, perPage: 1000 });
  const ncQuery = useNaoConformidadesList({ page: 1, perPage: 1000 });
  const insumosQuery = useInsumosList({ page: 1, perPage: 1000 });
  const distribuicaoQuery = useDistribuicaoList({ page: 1, perPage: 1000 });
  const produtosQuery = useProdutosList({ page: 1, perPage: 1000 });
  const usersQuery = useUsersList({});

  const sources: Record<Source, { rows: Row[]; loading: boolean }> = {
    analises: { rows: analisesQuery.data?.data ?? [], loading: analisesQuery.isLoading },
    lotes: { rows: lotesQuery.data?.data ?? [], loading: lotesQuery.isLoading },
    nc: { rows: ncQuery.data?.data ?? [], loading: ncQuery.isLoading },
    insumos: { rows: insumosQuery.data?.data ?? [], loading: insumosQuery.isLoading },
    distribuicao: { rows: distribuicaoQuery.data?.data ?? [], loading: distribuicaoQuery.isLoading },
    produtos: { rows: produtosQuery.data?.data ?? [], loading: produtosQuery.isLoading },
    users: { rows: usersQuery.data ?? [], loading: usersQuery.isLoading },
  };

  const { rows, loading } = config
    ? sources[config.source]
    : { rows: [] as Row[], loading: false };

  const baseRows = useMemo(() => {
    if (!config) return [];
    return config.filter ? rows.filter(config.filter) : rows;
  }, [rows, config]);

  const filtered = useMemo(() => {
    if (!config) return [];
    let out = baseRows;
    if (statusFilter !== "all" && config.statusKey) {
      out = out.filter((r) => r[config.statusKey!] === statusFilter);
    }
    if (search.trim() && config.searchKeys?.length) {
      const q = search.toLowerCase();
      out = out.filter((r) =>
        config.searchKeys!.some((k) => String(r[k] ?? "").toLowerCase().includes(q)),
      );
    }
    return out;
  }, [baseRows, search, statusFilter, config]);

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
