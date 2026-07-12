import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis,
} from "recharts";
import { ChevronLeft, BarChart3, Timer, Workflow, FolderOpen, CheckCircle2, Clock } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  axisTickStyle, buildChartConfig, chartColors, formatAxisNumber, getChartColor, NoDataOverlay,
} from "@/components/charts";
import { useProcessesList } from "@/hooks/queries/useProcesses";
import { useProcessTypesList } from "@/hooks/queries/useProcessTypes";
import { formatNumber } from "@/lib/format";
import { fadeIn, fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptAnalitica from "@/i18n/locales/pt/admin/processos-analitica.json";
import enAnalitica from "@/i18n/locales/en/admin/processos-analitica.json";

// Namespace autónomo registado em runtime (o bundle central só regista common/nav).
if (!i18n.hasResourceBundle("pt", "admin-processos-analitica"))
  i18n.addResourceBundle("pt", "admin-processos-analitica", ptAnalitica, true, true);
if (!i18n.hasResourceBundle("en", "admin-processos-analitica"))
  i18n.addResourceBundle("en", "admin-processos-analitica", enAnalitica, true, true);

const STATUS_KEYS = ["aberto", "em_curso", "concluido", "cancelado"] as const;

export default function ProcessosAnalitica() {
  const { t } = useTranslation("admin-processos-analitica");
  const prefersReduced = useReducedMotion();

  // perPage alto: obtemos todos os processos/tipos para agregação client-side.
  const { data: processesPage, isLoading } = useProcessesList({ page: 1, perPage: 1000 });
  const { data: typesPage } = useProcessTypesList({ perPage: 200 });

  const rows = useMemo(() => processesPage?.data ?? [], [processesPage]);
  const typeName = (id: string) => typesPage?.data.find((ty) => ty.id === id)?.name ?? "—";

  const today = new Date().toISOString().slice(0, 10);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.status, (map.get(r.status) ?? 0) + 1));
    return STATUS_KEYS.filter((k) => map.has(k)).map((k) => ({
      name: t(`status.${k}`),
      value: map.get(k) ?? 0,
    }));
  }, [rows, t]);

  const byTypeData = useMemo(() => {
    const map = new Map<string, { name: string; aberto: number; em_curso: number; concluido: number; cancelado: number }>();
    rows.forEach((r) => {
      if (!map.has(r.typeId)) {
        map.set(r.typeId, { name: typeName(r.typeId), aberto: 0, em_curso: 0, concluido: 0, cancelado: 0 });
      }
      const row = map.get(r.typeId)!;
      if (r.status in row) (row as unknown as Record<string, number>)[r.status]++;
    });
    return Array.from(map.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, typesPage]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; opened: number; completed: number }>();
    const ensure = (m: string) => {
      if (!map.has(m)) map.set(m, { month: m, opened: 0, completed: 0 });
      return map.get(m)!;
    };
    rows.forEach((r) => ensure(r.openedAt.slice(0, 7)).opened++);
    rows
      .filter((r) => r.closedAt && r.status === "concluido")
      .forEach((r) => ensure(r.closedAt!.slice(0, 7)).completed++);
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [rows]);

  const avgCycleDays = useMemo(() => {
    const closed = rows.filter((r) => r.closedAt && r.status === "concluido");
    if (closed.length === 0) return 0;
    const total = closed.reduce((sum, r) => {
      const ms = new Date(r.closedAt!).getTime() - new Date(r.openedAt).getTime();
      return sum + ms / 86_400_000;
    }, 0);
    return Math.round((total / closed.length) * 10) / 10;
  }, [rows]);

  const overdue = rows.filter(
    (r) => r.dueDate && r.dueDate < today && (r.status === "aberto" || r.status === "em_curso"),
  ).length;

  const slaCompliance = useMemo(() => {
    const closed = rows.filter((r) => r.status === "concluido" && r.dueDate && r.closedAt);
    if (closed.length === 0) return null;
    const ok = closed.filter((r) => r.closedAt!.slice(0, 10) <= r.dueDate!).length;
    return Math.round((ok / closed.length) * 100);
  }, [rows]);

  const overdueByType = useMemo(() => {
    const map = new Map<string, number>();
    rows
      .filter((r) => r.dueDate && r.dueDate < today && (r.status === "aberto" || r.status === "em_curso"))
      .forEach((r) => map.set(r.typeId, (map.get(r.typeId) ?? 0) + 1));
    return Array.from(map.entries()).map(([k, v]) => ({ name: typeName(k), value: v }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, typesPage, today]);

  const statusConfig = useMemo(() => buildChartConfig(statusData.map((d) => d.name)), [statusData]);
  const byTypeConfig = useMemo(
    () =>
      buildChartConfig([...STATUS_KEYS], {
        aberto: t("status.aberto"),
        em_curso: t("status.em_curso"),
        concluido: t("status.concluido"),
        cancelado: t("status.cancelado"),
      }),
    [t],
  );
  const monthlyConfig = useMemo(
    () => buildChartConfig(["opened", "completed"], { opened: t("charts.opened"), completed: t("charts.completed") }),
    [t],
  );

  const kpiCards = [
    { key: "total", icon: FolderOpen, label: t("kpi.total"), value: formatNumber(rows.length), caption: t("kpi.totalCaption"), variant: "gradient-green" as const },
    { key: "cycle", icon: Clock, label: t("kpi.avgCycle"), value: formatNumber(avgCycleDays), caption: t("kpi.avgCycleCaption"), variant: "gradient-teal" as const },
    { key: "sla", icon: CheckCircle2, label: t("kpi.sla"), value: slaCompliance === null ? "—" : `${slaCompliance}%`, caption: t("kpi.slaCaption"), variant: "gradient-green-gold" as const },
    { key: "overdue", icon: Timer, label: t("kpi.overdue"), value: formatNumber(overdue), caption: t("kpi.overdueCaption"), variant: "gradient-gold" as const },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader icon={BarChart3} title={t("page.title")} />
        <AdminCard loading />
      </div>
    );
  }

  const motionProps = prefersReduced
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const, variants: fadeIn };

  return (
    <motion.div className="space-y-6" {...motionProps}>
      <div>
        <Button asChild size="sm" variant="ghost" className="mb-2 gap-1">
          <Link to="/admin/processos"><ChevronLeft className="h-4 w-4" /> {t("back")}</Link>
        </Button>
      </div>

      <AdminPageHeader icon={BarChart3} title={t("page.title")} description={t("page.description")} />

      <motion.div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        variants={prefersReduced ? undefined : staggerContainer}
        initial={prefersReduced ? undefined : "hidden"}
        animate={prefersReduced ? undefined : "visible"}
      >
        {kpiCards.map((c) => (
          <motion.div key={c.key} variants={prefersReduced ? undefined : fadeInUp}>
            <AdminCard
              title={c.label}
              icon={c.icon}
              metric={c.value}
              caption={c.caption}
              variant={c.variant}
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard title={t("charts.byStatus")}>
          {statusData.length > 0 ? (
            <ChartContainer config={statusConfig} className="h-[280px] w-full">
              {/* aria-hidden: fatias do Pie recebem role="img" sem nome do Recharts (axe
                  svg-img-alt); a ChartLegend abaixo já dá o texto acessível equivalente. */}
              <PieChart aria-hidden="true" accessibilityLayer={false}>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={95} innerRadius={55} paddingAngle={2} rootTabIndex={-1}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={getChartColor(i)} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <NoDataOverlay message={t("charts.empty")} height={280} />
          )}
        </AdminCard>

        <AdminCard title={t("charts.monthly")}>
          {monthlyData.length > 0 ? (
            <ChartContainer config={monthlyConfig} className="h-[280px] w-full">
              <LineChart data={monthlyData} margin={{ left: 4, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={axisTickStyle} />
                <YAxis allowDecimals={false} tick={axisTickStyle} tickFormatter={formatAxisNumber} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="opened" name={t("charts.opened")} stroke={chartColors[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" name={t("charts.completed")} stroke={chartColors[1]} strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          ) : (
            <NoDataOverlay message={t("charts.empty")} height={280} />
          )}
        </AdminCard>

        <AdminCard title={t("charts.byType")} className="lg:col-span-2">
          {byTypeData.length > 0 ? (
            <ChartContainer config={byTypeConfig} className="h-[320px] w-full">
              <BarChart data={byTypeData} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={axisTickStyle} interval={0} />
                <YAxis allowDecimals={false} tick={axisTickStyle} tickFormatter={formatAxisNumber} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {STATUS_KEYS.map((k, i) => (
                  <Bar key={k} dataKey={k} name={t(`status.${k}`)} stackId="a" fill={getChartColor(i)} radius={i === STATUS_KEYS.length - 1 ? [4, 4, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ChartContainer>
          ) : (
            <NoDataOverlay message={t("charts.empty")} height={320} />
          )}
        </AdminCard>
      </div>

      <AdminCard title={t("overdue.title")}>
        {overdueByType.length === 0 ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Timer className="h-4 w-4" /> {t("overdue.none")}
          </p>
        ) : (
          <ul className="space-y-2">
            {overdueByType.map((l) => (
              <li key={l.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-muted-foreground" /> {l.name}
                </span>
                <Badge variant="destructive">{l.value}</Badge>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </motion.div>
  );
}
