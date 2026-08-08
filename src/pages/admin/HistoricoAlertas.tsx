import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { axisTickStyle, buildChartConfig, chartColors, formatAxisNumber, NoDataOverlay } from "@/components/charts";
import { useTableExport } from "@/hooks/useTableExport";
import { fadeIn } from "@/lib/motion";
import { Bell, Download, Trash2, ArrowUpRight, UserPlus, Clock, RefreshCw, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  useAlertHistoryList,
  useUpdateAlertHistory,
  useClearAlertHistory,
} from "@/hooks/queries/useDashboardAlertHistory";
import { useUsersList } from "@/hooks/queries/useUsers";
import { useDepartamentosList } from "@/hooks/queries/useDepartamentos";
import type { AlertHistoryDto, AlertActionStatus } from "@/types/dto/dashboardAlertHistory";
import i18n from "@/i18n";
import ptHistorico from "@/i18n/locales/pt/admin/historico-alertas.json";
import enHistorico from "@/i18n/locales/en/admin/historico-alertas.json";

// Namespace autónomo registado em runtime (padrão de ProcessosAnalitica.tsx).
if (!i18n.hasResourceBundle("pt", "admin-historico-alertas"))
  i18n.addResourceBundle("pt", "admin-historico-alertas", ptHistorico, true, true);
if (!i18n.hasResourceBundle("en", "admin-historico-alertas"))
  i18n.addResourceBundle("en", "admin-historico-alertas", enHistorico, true, true);

const METRIC_KEYS = ["lowStock", "expiringSoon", "ncOpen", "analysesPending"] as const;
const STATUS_KEYS: AlertActionStatus[] = ["pendente", "em_curso", "resolvido"];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "destructive",
  em_curso: "secondary",
  resolvido: "default",
};

export default function HistoricoAlertas() {
  const { t } = useTranslation("admin-historico-alertas");
  const prefersReduced = useReducedMotion();

  const [metric, setMetric] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // Assignment dialog
  const [editing, setEditing] = useState<AlertHistoryDto | null>(null);
  const [draftAssignee, setDraftAssignee] = useState<string>("none");
  const [draftDept, setDraftDept] = useState<string>("none");
  const [draftStatus, setDraftStatus] = useState<string>("pendente");
  const [draftNotes, setDraftNotes] = useState<string>("");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const { exportCSV } = useTableExport();

  const usersQuery = useUsersList({});
  const departmentsQuery = useDepartamentosList({ page: 1, perPage: 1000 });
  const users = usersQuery.data ?? [];
  const departments = useMemo(() => departmentsQuery.data?.data ?? [], [departmentsQuery.data]);

  const listQuery = useAlertHistoryList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    metricKey: metric !== "all" ? metric : undefined,
    actionStatus: status !== "all" ? status : undefined,
    from: from || undefined,
    to: to || undefined,
  });
  const rows = useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);

  // Query de tendência: últimos 30 dias (não paginada).
  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);
  const trendQuery = useAlertHistoryList({
    page: 1,
    perPage: 1000,
    metricKey: metric !== "all" ? metric : undefined,
    from: since,
  });

  const trend = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      byDay[d.toISOString().slice(0, 10)] = 0;
    }
    (trendQuery.data?.data ?? []).forEach((r) => {
      const k = r.createdAt.slice(0, 10);
      if (k in byDay) byDay[k]++;
    });
    return Object.entries(byDay).map(([k, v]) => ({ day: k.slice(5), total: v }));
  }, [trendQuery.data]);
  const trendHasData = useMemo(() => trend.some((d) => d.total > 0), [trend]);
  const trendConfig = useMemo(() => buildChartConfig(["total"], { total: t("trend.series") }), [t]);

  // Query sem filtros — panorama global do módulo, independente dos filtros
  // aplicados à tabela (mesmo padrão usado em Utilizadores.tsx para os KPIs).
  const statsQuery = useAlertHistoryList({ page: 1, perPage: 1000 });
  const statsRows = useMemo(() => statsQuery.data?.data ?? [], [statsQuery.data]);
  const kpis = useMemo(
    () => ({
      total: statsQuery.data?.meta.total ?? statsRows.length,
      pendente: statsRows.filter((r) => r.actionStatus === "pendente").length,
      emCurso: statsRows.filter((r) => r.actionStatus === "em_curso").length,
      resolvido: statsRows.filter((r) => r.actionStatus === "resolvido").length,
    }),
    [statsQuery.data, statsRows],
  );

  const updateMutation = useUpdateAlertHistory();
  const clearMutation = useClearAlertHistory();

  const metricLabel = (key: string) => t(`metrics.${key}`, { defaultValue: key });
  const statusLabel = (key: string) => t(`status.${key}`, { defaultValue: key });

  const openAssign = (row: AlertHistoryDto) => {
    setEditing(row);
    setDraftAssignee(row.assignedTo ?? "none");
    setDraftDept(row.assignedDepartmentId ?? "none");
    setDraftStatus(row.actionStatus ?? "pendente");
    setDraftNotes(row.actionNotes ?? "");
  };

  const saveAssign = async () => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({
        id: editing.id,
        payload: {
          assignedTo: draftAssignee === "none" ? null : draftAssignee,
          assignedDepartmentId: draftDept === "none" ? null : draftDept,
          actionStatus: draftStatus as AlertActionStatus,
          actionNotes: draftNotes || null,
        },
      });
      toast.success(t("toast.saved"));
      setEditing(null);
    } catch {
      toast.error(t("toast.saveError"));
    }
  };

  const clearAll = async () => {
    if (!confirm(t("confirmClear"))) return;
    try {
      await clearMutation.mutateAsync();
      toast.success(t("toast.cleared"));
      resetPage();
    } catch {
      toast.error(t("toast.clearError"));
    }
  };

  const handleExport = () => {
    exportCSV(
      rows.map((r) => ({
        data: format(new Date(r.createdAt), "dd/MM/yyyy HH:mm"),
        metrica: r.label,
        valor: r.value,
        limiar: r.threshold,
        severidade: r.tone,
        estado: statusLabel(r.actionStatus),
        responsavel: r.assignedToName ?? "—",
        departamento: r.assignedDepartmentName ?? "—",
        notas: r.actionNotes ?? "",
      })),
      t("export.filename"),
      {
        headers: {
          data: t("export.datetime"), metrica: t("export.metric"), valor: t("export.value"),
          limiar: t("export.threshold"), severidade: t("export.severity"), estado: t("export.state"),
          responsavel: t("export.assignee"), departamento: t("export.department"), notas: t("export.notes"),
        },
      },
    );
  };

  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const columns = useMemo<ColumnDef<AlertHistoryDto>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.datetime")} />,
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap">
            {format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
          </span>
        ),
      },
      {
        accessorKey: "label",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.metric")} />,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.label}</span>,
      },
      {
        accessorKey: "value",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.value")} />,
        cell: ({ row }) => <span className="text-right font-semibold block">{row.original.value}</span>,
      },
      {
        accessorKey: "threshold",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.threshold")} />,
        cell: ({ row }) => <span className="text-right text-muted-foreground block">{row.original.threshold}</span>,
      },
      {
        accessorKey: "assignedToName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.assignee")} />,
        cell: ({ row }) => <span className="text-sm">{row.original.assignedToName ?? t("table.emptyCell")}</span>,
      },
      {
        accessorKey: "assignedDepartmentName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.department")} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.assignedDepartmentName ?? t("table.emptyCell")}
          </span>
        ),
      },
      {
        accessorKey: "actionStatus",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.state")} />,
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.actionStatus] ?? "outline"}>
            {statusLabel(row.original.actionStatus)}
          </Badge>
        ),
      },
    ],
    [t],
  );

  const renderRowActions = (row: AlertHistoryDto) => (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => openAssign(row)}>
        <UserPlus className="h-3 w-3" /> {t("table.assign")}
      </Button>
      <Link
        to={`/admin/painel/${row.metricKey}`}
        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
      >
        {t("table.details")} <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );

  const motionProps = prefersReduced
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const, variants: fadeIn };

  return (
    <motion.div className="space-y-6" {...motionProps}>
      <AdminPageHeader icon={Bell} title={t("page.title")} description={t("page.description")}>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0} className="gap-2">
          <Download className="h-4 w-4" /> {t("actions.export")}
        </Button>
        <Button variant="outline" size="sm" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" /> {t("actions.clear")}
        </Button>
      </AdminPageHeader>

      {/* KPIs — panorama global do módulo, independente dos filtros da tabela */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <AdminCard icon={Bell} metric={kpis.total} title={t("kpi.total")} variant="gradient-green" />
        <AdminCard icon={Clock} metric={kpis.pendente} title={t("kpi.pendente")} variant="gradient-gold" />
        <AdminCard icon={RefreshCw} metric={kpis.emCurso} title={t("kpi.emCurso")} variant="glass" />
        <AdminCard icon={CheckCircle2} metric={kpis.resolvido} title={t("kpi.resolvido")} variant="glass" />
      </div>

      {/* Filtros */}
      <AdminCard title={t("filters.title")} icon={Bell}>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("filters.metric")}</label>
            <Select value={metric} onValueChange={(v) => { setMetric(v); resetPage(); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("metrics.all")}</SelectItem>
                {METRIC_KEYS.map((m) => <SelectItem key={m} value={m}>{metricLabel(m)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("filters.status")}</label>
            <Select value={status} onValueChange={(v) => { setStatus(v); resetPage(); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("status.all")}</SelectItem>
                {STATUS_KEYS.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("filters.from")}</label>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); resetPage(); }} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("filters.to")}</label>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); resetPage(); }} />
          </div>
        </div>
      </AdminCard>

      {/* Tendência */}
      <AdminCard title={t("trend.title")} icon={Bell}>
        {trendHasData ? (
          <ChartContainer config={trendConfig} className="h-[220px] w-full">
            <AreaChart data={trend} margin={{ left: 4, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={axisTickStyle} />
              <YAxis allowDecimals={false} tick={axisTickStyle} tickFormatter={formatAxisNumber} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="total"
                name={t("trend.series")}
                stroke={chartColors[1]}
                fill={chartColors[1]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <NoDataOverlay message={t("trend.empty")} height={220} />
        )}
      </AdminCard>

      {/* Tabela */}
      <AdminCard title={t("table.title")} icon={Bell}>
        <DataTable
          columns={columns}
          data={rows}
          loading={listQuery.isLoading}
          pageCount={listQuery.data?.meta.totalPages ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          rowCount={listQuery.data?.meta.total}
          emptyMessage={t("table.empty")}
          renderRowActions={renderRowActions}
          hideToolbar
        />
      </AdminCard>

      {/* Assignment Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{t("dialog.title")}</DialogTitle>
            <DialogDescription>
              {editing && t("dialog.summary", { label: editing.label, value: editing.value, threshold: editing.threshold })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium mb-1 block">{t("dialog.department")}</label>
              <Select value={draftDept} onValueChange={setDraftDept}>
                <SelectTrigger><SelectValue placeholder={t("dialog.select")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("dialog.noDepartment")}</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">{t("dialog.assignee")}</label>
              <Select value={draftAssignee} onValueChange={setDraftAssignee}>
                <SelectTrigger><SelectValue placeholder={t("dialog.select")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("dialog.noAssignee")}</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.fullName || u.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">{t("dialog.state")}</label>
              <Select value={draftStatus} onValueChange={setDraftStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_KEYS.map((s) => (
                    <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">{t("dialog.notes")}</label>
              <Textarea
                rows={3}
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                placeholder={t("dialog.notesPlaceholder")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{t("dialog.cancel")}</Button>
            <Button onClick={saveAssign} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("dialog.saving") : t("dialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
