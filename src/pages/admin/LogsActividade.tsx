import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Shield,
  Filter,
  Download,
  X,
  LogIn,
  Pencil,
  Plus,
  Trash2,
  AlertOctagon,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { RowActions } from "@/components/admin/RowActions";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLogsList } from "@/hooks/queries/useLogs";
import type { LogDto } from "@/types/dto/log";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptLogs from "@/i18n/locales/pt/logs.json";
import enLogs from "@/i18n/locales/en/logs.json";

// Namespace "logs" (já existente em src/i18n/locales/{pt,en}/logs.json) registado em
// runtime — mesmo padrão de Departamentos.tsx/Estacoes.tsx: o bundle central
// (src/i18n/index.ts) só regista "common"/"nav", cada página admin regista o seu próprio
// namespace autónomo guardado por `hasResourceBundle` para evitar registo duplicado em
// re-renders/HMR.
if (!i18n.hasResourceBundle("pt", "logs")) i18n.addResourceBundle("pt", "logs", ptLogs, true, true);
if (!i18n.hasResourceBundle("en", "logs")) i18n.addResourceBundle("en", "logs", enLogs, true, true);

/** Espelha `LogAction` (types/dto/log.ts) — usado para gerar as opções do filtro e o mapeamento ícone/cor. */
const ACTION_KEYS = ["create", "update", "delete", "login", "logout", "critical"] as const;

/** Espelha as chaves de `logs.json#entityTypes` — tipos de entidade cobertos pelas fixtures. */
const ENTITY_TYPE_KEYS = [
  "auth",
  "sincronizacao",
  "departamentos",
  "laboratorios",
  "analises",
  "resultados",
  "lotes",
  "planeamento",
  "distribuicao",
  "users",
  "noticias",
  "legislacao",
] as const;

const ACTION_ICON: Record<string, LucideIcon> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  login: LogIn,
  logout: LogIn,
  critical: AlertOctagon,
};

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  login: "outline",
  logout: "outline",
  critical: "destructive",
};

/** Sentinela de "sem filtro" — o <Select> shadcn não aceita valor "". */
const ALL = "all";

/**
 * Visualizador de auditoria do sistema — página só-leitura (sem create/update/delete).
 * Migrado de Supabase (`activity_logs` + join manual a `profiles`) para `useLogsList`
 * (MSW), que já devolve `userName` denormalizado por registo (ver nota em
 * `types/dto/log.ts`), eliminando o segundo pedido a `profiles` da versão antiga.
 */
export default function LogsActividade() {
  const { t, i18n: i18nInstance } = useTranslation("logs");
  const reduceMotion = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [actionFilter, setActionFilter] = useState<string>(ALL);
  const [entityFilter, setEntityFilter] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [viewItem, setViewItem] = useState<LogDto | null>(null);

  // Repõe a primeira página sempre que um filtro muda — mesmo padrão de paginação
  // server-side usado nas restantes páginas admin (evita ficar numa página vazia).
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [actionFilter, entityFilter, dateFrom, dateTo]);

  const { data, isLoading } = useLogsList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    action: actionFilter !== ALL ? actionFilter : undefined,
    entityType: entityFilter !== ALL ? entityFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // Query paralela, sempre forçada a `action=critical` independentemente do filtro de
  // acção seleccionado (mas respeitando entidade/intervalo de datas), só para alimentar
  // o KPI de "eventos críticos" — mesma técnica de query dedicada para estatísticas
  // agregadas usada em Estacoes.tsx (`statsData`).
  const { data: criticalData } = useLogsList({
    page: 1,
    perPage: 1,
    action: "critical",
    entityType: entityFilter !== ALL ? entityFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const rows = data?.data ?? [];
  const kpiTotal = data?.meta.total ?? 0;
  const kpiCritical = criticalData?.meta.total ?? 0;

  const clearFilters = () => {
    setActionFilter(ALL);
    setEntityFilter(ALL);
    setDateFrom("");
    setDateTo("");
  };
  const hasFilters = actionFilter !== ALL || entityFilter !== ALL || !!dateFrom || !!dateTo;

  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString(i18nInstance.language === "en" ? "en-GB" : "pt-AO");

  const actionLabel = (action: string) =>
    (ACTION_KEYS as readonly string[]).includes(action) ? t(`actions.${action}`) : action;
  const entityLabel = (entityType: string) =>
    (ENTITY_TYPE_KEYS as readonly string[]).includes(entityType) ? t(`entityTypes.${entityType}`) : entityType;

  // Exporta apenas a página actualmente carregada — mesmo âmbito da versão anterior
  // (que exportava o array de estado local `logs`, também limitado à página corrente).
  const exportCsv = () => {
    const header = t("export.header", { returnObjects: true }) as string[];
    const csvRows = rows.map((l) => [
      format(new Date(l.createdAt), "yyyy-MM-dd HH:mm:ss"),
      l.userName ?? l.userId ?? t("table.system"),
      actionLabel(l.action),
      entityLabel(l.entityType),
      l.entityId ?? "",
      l.ipAddress ?? "",
      l.details ? JSON.stringify(l.details).replace(/"/g, '""') : "",
    ]);
    const csv = [header, ...csvRows].map((r) => r.map((c) => `"${String(c)}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t("export.filenamePrefix")}-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<LogDto>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.dateTime")} />,
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap">{fmtDateTime(row.original.createdAt)}</span>
        ),
      },
      {
        accessorKey: "userName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.user")} />,
        cell: ({ row }) => {
          const l = row.original;
          if (l.userName) return <span className="text-sm">{l.userName}</span>;
          if (l.userId)
            return <span className="text-sm text-muted-foreground">{l.userId.slice(0, 8)}…</span>;
          return <span className="text-sm text-muted-foreground italic">{t("table.system")}</span>;
        },
      },
      {
        accessorKey: "action",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.action")} />,
        cell: ({ row }) => {
          const action = row.original.action;
          const Icon = ACTION_ICON[action] ?? Shield;
          const variant = ACTION_VARIANT[action] ?? "outline";
          return (
            <Badge variant={variant} className="gap-1">
              <Icon className="h-3 w-3" />
              {actionLabel(action)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "entityType",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.entity")} />,
        cell: ({ row }) => <span className="text-sm">{entityLabel(row.original.entityType)}</span>,
      },
      {
        accessorKey: "ipAddress",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.ip")} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {row.original.ipAddress ?? t("table.emptyCell")}
          </span>
        ),
      },
      {
        accessorKey: "details",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.details")} />,
        cell: ({ row }) => {
          const details = row.original.details;
          const text = details ? JSON.stringify(details) : t("table.emptyCell");
          return (
            <span className="text-xs text-muted-foreground max-w-sm truncate block" title={details ? text : undefined}>
              {text}
            </span>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18nInstance.language],
  );

  const renderRowActions = (row: LogDto) => (
    <RowActions primary={{ label: t("rowActions.viewDetails"), icon: Eye, onClick: () => setViewItem(row) }} actions={[]} />
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Shield} title={t("page.title")} description={t("page.description")} />

      <motion.div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2"
        variants={reduceMotion ? undefined : staggerContainer}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "visible"}
      >
        <motion.div variants={reduceMotion ? undefined : fadeInUp}>
          <AdminCard
            variant="gradient-green-gold"
            icon={Shield}
            metric={kpiTotal}
            title={t("kpi.total.title")}
            caption={t("kpi.total.caption")}
          />
        </motion.div>
        <motion.div variants={reduceMotion ? undefined : fadeInUp}>
          <AdminCard
            variant="glass"
            icon={AlertOctagon}
            metric={kpiCritical}
            title={t("kpi.critical.title")}
            caption={t("kpi.critical.caption")}
          />
        </motion.div>
      </motion.div>

      <AdminCard title={t("filters.title")} icon={Filter}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>{t("filters.action")}</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("filters.actionAll")}</SelectItem>
                {ACTION_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`actions.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("filters.entityType")}</Label>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("filters.entityTypeAll")}</SelectItem>
                {ENTITY_TYPE_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`entityTypes.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("filters.dateFrom")}</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("filters.dateTo")}</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilters}>
            <X className="h-4 w-4 mr-1" /> {t("filters.clear")}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="h-4 w-4 mr-1" /> {t("filters.export")}
          </Button>
        </div>
      </AdminCard>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        pageCount={data?.meta.lastPage ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={data?.meta.total}
        emptyMessage={t("table.empty")}
        renderRowActions={renderRowActions}
      />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{t("detailsDialog.title")}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">{t("detailsDialog.dateTime")}:</span>
                  <p className="font-medium">{fmtDateTime(viewItem.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("detailsDialog.user")}:</span>
                  <p className="font-medium">{viewItem.userName ?? viewItem.userId ?? t("table.system")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("detailsDialog.action")}:</span>
                  <p>
                    <Badge variant={ACTION_VARIANT[viewItem.action] ?? "outline"}>
                      {actionLabel(viewItem.action)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("detailsDialog.entity")}:</span>
                  <p className="font-medium">{entityLabel(viewItem.entityType)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("detailsDialog.entityId")}:</span>
                  <p className="font-medium">{viewItem.entityId ?? t("table.emptyCell")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("detailsDialog.ip")}:</span>
                  <p className="font-medium font-mono text-xs">{viewItem.ipAddress ?? t("table.emptyCell")}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">{t("detailsDialog.details")}:</span>
                <pre className="font-medium mt-1 whitespace-pre-wrap break-all bg-muted/40 rounded p-2 text-xs">
                  {viewItem.details ? JSON.stringify(viewItem.details, null, 2) : t("detailsDialog.noDetails")}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
