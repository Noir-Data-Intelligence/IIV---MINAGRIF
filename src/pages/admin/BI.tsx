import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis,
} from "recharts";
import { BarChart3, FileText, TrendingUp, Wallet, Users, FlaskConical, Rabbit, Plane, Target } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  axisTickStyle, buildChartConfig, chartColors, formatAxisNumber, formatCompactNumber, getChartColor, NoDataOverlay,
} from "@/components/charts";
import { useAnimaisList } from "@/hooks/queries/useAnimais";
import { useAnalisesList } from "@/hooks/queries/useAnalises";
import { useMissionsList } from "@/hooks/queries/useMissoes";
import { useEmployeesList } from "@/hooks/queries/useRecursosHumanos";
import { useProjectsList, usePublicationsList } from "@/hooks/queries/useInvestigacao";
import { useTransactionsList, useBudgetsList } from "@/hooks/queries/useFinanceiro";
import { useHarvestsList, useFieldsList, useCropsList } from "@/hooks/queries/useAgricultura";
import { useUsersList } from "@/hooks/queries/useUsers";
import { formatKwanza, formatNumber } from "@/lib/format";
import { generateInstitutionalPdf } from "@/lib/generateInstitutionalPdf";
import { fadeIn } from "@/lib/motion";
import type { AppRole } from "@/lib/permissions";
import i18n from "@/i18n";
import ptBi from "@/i18n/locales/pt/admin/bi.json";
import enBi from "@/i18n/locales/en/admin/bi.json";

// Namespace autónomo registado em runtime (o bundle central só regista common/nav).
if (!i18n.hasResourceBundle("pt", "bi")) i18n.addResourceBundle("pt", "bi", ptBi, true, true);
if (!i18n.hasResourceBundle("en", "bi")) i18n.addResourceBundle("en", "bi", enBi, true, true);

// Dataset completo para agregação client-side (mesmo padrão de Financeiro.tsx/Documentos.tsx).
const BIG = { page: 1, perPage: 1000 } as const;

const ROLE_ORDER: AppRole[] = ["admin", "diretor", "gestor", "tecnico", "colaborador"];

export default function BI() {
  const { t, i18n: i18nInstance } = useTranslation("bi");
  const prefersReduced = useReducedMotion();
  const locale = i18nInstance.language === "en" ? "en-GB" : "pt-AO";
  const year = new Date().getFullYear();

  // --- Leitura: reutiliza os hooks já existentes de cada módulo migrado ------
  const animalsQuery = useAnimaisList(BIG);
  const analysesQuery = useAnalisesList(BIG);
  const missionsQuery = useMissionsList(BIG);
  const employeesQuery = useEmployeesList(BIG);
  const projectsQuery = useProjectsList(BIG);
  const publicationsQuery = usePublicationsList(BIG);
  const transactionsQuery = useTransactionsList(BIG);
  const budgetsQuery = useBudgetsList(BIG);
  const harvestsQuery = useHarvestsList(BIG);
  const fieldsQuery = useFieldsList(BIG);
  const cropsQuery = useCropsList(BIG);
  const usersQuery = useUsersList({}); // endpoint de utilizadores devolve array simples (sem paginação)

  // --- Contagens (via meta.total quando disponível) --------------------------
  const animals = animalsQuery.data?.meta.total ?? 0;
  const analyses = analysesQuery.data?.meta.total ?? 0;
  const employees = employeesQuery.data?.meta.total ?? 0;

  const missionsActive = useMemo(
    () =>
      (missionsQuery.data?.data ?? []).filter(
        (m) => m.status === "em_curso" || m.status === "aprovada",
      ).length,
    [missionsQuery.data],
  );

  const projectsActive = useMemo(
    () =>
      (projectsQuery.data?.data ?? []).filter(
        (p) => p.status === "aprovado" || p.status === "em_curso",
      ).length,
    [projectsQuery.data],
  );

  const publications = publicationsQuery.data?.meta.total ?? (publicationsQuery.data?.data.length ?? 0);

  // --- Financeiro: agregação mensal (mesma lógica de Financeiro.tsx) ---------
  const paidTx = useMemo(
    () => (transactionsQuery.data?.data ?? []).filter((tx) => tx.status === "pago"),
    [transactionsQuery.data],
  );
  const allBudgets = useMemo(() => budgetsQuery.data?.data ?? [], [budgetsQuery.data]);

  // Todos os 12 meses do ano corrente (movimentos pagos), para um gráfico institucional completo.
  const finMonthly = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i, 1).toLocaleDateString(locale, { month: "short" }),
      receita: 0,
      despesa: 0,
    }));
    for (const tx of paidTx) {
      const d = new Date(tx.transactionDate);
      if (d.getFullYear() !== year) continue;
      const bucket = months[d.getMonth()];
      if (tx.type === "receita") bucket.receita += tx.amount;
      else if (tx.type === "despesa") bucket.despesa += tx.amount;
    }
    return months;
  }, [paidTx, year, locale]);

  const revenueYTD = useMemo(() => finMonthly.reduce((s, m) => s + m.receita, 0), [finMonthly]);
  const expensesYTD = useMemo(() => finMonthly.reduce((s, m) => s + m.despesa, 0), [finMonthly]);
  const hasFinData = revenueYTD > 0 || expensesYTD > 0;

  // Execução orçamental do ano corrente (replica executedFor/executionPct de Financeiro.tsx).
  const executionPct = useMemo(() => {
    const yearBudgets = allBudgets.filter((b) => b.year === year);
    const planned = yearBudgets.reduce((s, b) => s + b.plannedAmount, 0);
    const executed = yearBudgets.reduce((s, b) => {
      const spent = paidTx
        .filter(
          (tx) =>
            tx.accountId === b.accountId &&
            (b.departmentId ? tx.departmentId === b.departmentId : true) &&
            new Date(tx.transactionDate).getFullYear() === b.year,
        )
        .reduce((a, tx) => a + tx.amount, 0);
      return s + spent;
    }, 0);
    return planned > 0 ? Math.round((executed / planned) * 100) : 0;
  }, [allBudgets, paidTx, year]);

  // --- Publicações por ano ---------------------------------------------------
  const pubsByYear = useMemo(() => {
    const map = new Map<number, number>();
    (publicationsQuery.data?.data ?? []).forEach((p) => {
      if (p.year) map.set(p.year, (map.get(p.year) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([y, count]) => ({ ano: String(y), publications: count }));
  }, [publicationsQuery.data]);

  // --- Colheitas por cultura (cruza HarvestDto.fieldId -> FieldDto.cropId -> CropDto.name) ---
  const harvestByCrop = useMemo(() => {
    const fieldToCrop = new Map<string, string>();
    (fieldsQuery.data?.data ?? []).forEach((f) => fieldToCrop.set(f.id, f.cropId));
    const cropName = new Map<string, string>();
    (cropsQuery.data?.data ?? []).forEach((c) => cropName.set(c.id, c.name));

    const byCrop = new Map<string, number>();
    (harvestsQuery.data?.data ?? []).forEach((h) => {
      const cropId = fieldToCrop.get(h.fieldId);
      const name = (cropId && cropName.get(cropId)) || "—";
      byCrop.set(name, (byCrop.get(name) ?? 0) + Number(h.quantity ?? 0));
    });
    return Array.from(byCrop.entries()).map(([name, quantidade]) => ({ name, quantidade }));
  }, [harvestsQuery.data, fieldsQuery.data, cropsQuery.data]);

  // --- Utilizadores por perfil (UserDto.roles) -------------------------------
  const staffByRole = useMemo(() => {
    const counts = new Map<AppRole, number>();
    (usersQuery.data ?? []).forEach((u) => {
      u.roles.forEach((r) => counts.set(r, (counts.get(r) ?? 0) + 1));
    });
    return ROLE_ORDER.filter((r) => counts.has(r)).map((r) => ({
      name: t(`roles.${r}`),
      value: counts.get(r) ?? 0,
    }));
  }, [usersQuery.data, t]);

  // --- Chart configs ---------------------------------------------------------
  const finConfig = useMemo(
    () => buildChartConfig(["receita", "despesa"], { receita: t("charts.revenue"), despesa: t("charts.expense") }),
    [t],
  );
  const harvestConfig = useMemo(
    () => buildChartConfig(["quantidade"], { quantidade: t("charts.quantity") }),
    [t],
  );
  const roleConfig = useMemo(() => buildChartConfig(staffByRole.map((d) => d.name)), [staffByRole]);
  const pubConfig = useMemo(
    () => buildChartConfig(["publications"], { publications: t("charts.publications") }),
    [t],
  );

  // --- Loading por secção ----------------------------------------------------
  const finLoading = transactionsQuery.isLoading || budgetsQuery.isLoading;
  const harvestLoading = harvestsQuery.isLoading || fieldsQuery.isLoading || cropsQuery.isLoading;
  const rhLoading = usersQuery.isLoading;
  const pubLoading = publicationsQuery.isLoading;

  // --- KPIs ------------------------------------------------------------------
  const kpiCards = [
    { key: "animals", icon: Rabbit, label: t("kpi.animals"), value: formatNumber(animals), caption: t("kpi.animalsCaption"), variant: "gradient-green-gold" as const },
    { key: "analyses", icon: FlaskConical, label: t("kpi.analyses"), value: formatNumber(analyses), caption: t("kpi.analysesCaption"), variant: "glass" as const },
    { key: "missions", icon: Plane, label: t("kpi.missions"), value: formatNumber(missionsActive), caption: t("kpi.missionsCaption"), variant: "glass" as const },
    { key: "employees", icon: Users, label: t("kpi.employees"), value: formatNumber(employees), caption: t("kpi.employeesCaption"), variant: "glass" as const },
    { key: "projects", icon: TrendingUp, label: t("kpi.projects"), value: formatNumber(projectsActive), caption: t("kpi.projectsCaption"), variant: "glass" as const },
    { key: "publications", icon: BarChart3, label: t("kpi.publications"), value: formatNumber(publications), caption: t("kpi.publicationsCaption"), variant: "glass" as const },
    { key: "revenue", icon: TrendingUp, label: t("kpi.revenue"), value: formatKwanza(revenueYTD), caption: t("kpi.revenueCaption"), variant: "gradient-green" as const },
    { key: "expense", icon: Wallet, label: t("kpi.expense"), value: formatKwanza(expensesYTD), caption: t("kpi.expenseCaption"), variant: "gradient-gold" as const },
    { key: "execution", icon: Target, label: t("kpi.execution"), value: `${executionPct}%`, caption: t("kpi.executionCaption"), variant: "gradient-teal" as const },
  ];

  // --- PDF institucional (consolidado via generateInstitutionalPdf) ----------
  const generatePDF = async () => {
    const L = (k: string) => t(`pdf.labels.${k}`);
    await generateInstitutionalPdf({
      title: t("pdf.title"),
      filename: `bi-executivo-${new Date().toISOString().slice(0, 10)}`,
      sections: [
        {
          type: "table",
          title: t("pdf.kpiSection"),
          head: [[t("pdf.indicator"), t("pdf.value")]],
          body: [
            [L("animals"), formatNumber(animals)],
            [L("analyses"), formatNumber(analyses)],
            [L("missions"), formatNumber(missionsActive)],
            [L("employees"), formatNumber(employees)],
            [L("projects"), formatNumber(projectsActive)],
            [L("publications"), formatNumber(publications)],
            [L("revenue"), formatKwanza(revenueYTD)],
            [L("expense"), formatKwanza(expensesYTD)],
            [L("balance"), formatKwanza(revenueYTD - expensesYTD)],
            [L("execution"), `${executionPct}%`],
          ],
        },
        ...(hasFinData
          ? [
              {
                type: "table" as const,
                title: t("pdf.financialSection"),
                accent: "gold" as const,
                head: [[t("pdf.month"), t("charts.revenue"), t("charts.expense")]],
                body: finMonthly.map((m) => [m.month, formatKwanza(m.receita), formatKwanza(m.despesa)]),
              },
            ]
          : []),
        ...(harvestByCrop.length > 0
          ? [
              {
                type: "table" as const,
                title: t("pdf.harvestSection"),
                head: [[t("pdf.crop"), t("pdf.quantity")]],
                body: harvestByCrop.map((h) => [h.name, formatNumber(h.quantidade)]),
              },
            ]
          : []),
      ],
    });
  };

  const motionProps = prefersReduced
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const, variants: fadeIn };

  return (
    <motion.div className="space-y-6" {...motionProps}>
      <AdminPageHeader icon={BarChart3} title={t("page.title")} description={t("page.description")}>
        <Button onClick={generatePDF} variant="outline">
          <FileText className="mr-2 h-4 w-4" /> {t("actions.exportPdf")}
        </Button>
      </AdminPageHeader>

      {/* KPIs institucionais */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {kpiCards.map((c, i) => (
          <AdminCard
            key={c.key}
            title={c.label}
            icon={c.icon}
            metric={c.value}
            caption={c.caption}
            variant={c.variant}
            stagger={(Math.min(i + 1, 8)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
          />
        ))}
      </div>

      <Tabs defaultValue="financeiro" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financeiro"><Wallet className="h-4 w-4 mr-1" /> {t("tabs.financeiro")}</TabsTrigger>
          <TabsTrigger value="producao"><Rabbit className="h-4 w-4 mr-1" /> {t("tabs.producao")}</TabsTrigger>
          <TabsTrigger value="rh"><Users className="h-4 w-4 mr-1" /> {t("tabs.rh")}</TabsTrigger>
          <TabsTrigger value="investigacao"><TrendingUp className="h-4 w-4 mr-1" /> {t("tabs.investigacao")}</TabsTrigger>
        </TabsList>

        {/* --- Financeiro --- */}
        <TabsContent value="financeiro">
          <AdminCard title={t("charts.financeiro.title")} loading={finLoading}>
            <p className="text-xs text-muted-foreground -mt-2 mb-4">{t("charts.financeiro.subtitle")}</p>
            {hasFinData ? (
              <ChartContainer config={finConfig} className="h-[340px] w-full">
                <BarChart data={finMonthly} margin={{ left: 12, right: 16, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={axisTickStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisTickStyle} tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} width={70} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="receita" name={t("charts.revenue")} fill={chartColors[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name={t("charts.expense")} fill={chartColors[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <NoDataOverlay message={t("charts.financeiro.empty")} height={340} />
            )}
          </AdminCard>
        </TabsContent>

        {/* --- Produção --- */}
        <TabsContent value="producao">
          <AdminCard title={t("charts.producao.title")} loading={harvestLoading}>
            <p className="text-xs text-muted-foreground -mt-2 mb-4">{t("charts.producao.subtitle")}</p>
            {harvestByCrop.length > 0 ? (
              <ChartContainer config={harvestConfig} className="h-[340px] w-full">
                <BarChart data={harvestByCrop} margin={{ left: 12, right: 16, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={axisTickStyle} interval={0} />
                  <YAxis tick={axisTickStyle} tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} width={70} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="quantidade" name={t("charts.quantity")} fill={chartColors[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <NoDataOverlay message={t("charts.producao.empty")} height={340} />
            )}
          </AdminCard>
        </TabsContent>

        {/* --- Recursos Humanos --- */}
        <TabsContent value="rh">
          <AdminCard title={t("charts.rh.title")} loading={rhLoading}>
            <p className="text-xs text-muted-foreground -mt-2 mb-4">{t("charts.rh.subtitle")}</p>
            {staffByRole.length > 0 ? (
              <ChartContainer config={roleConfig} className="h-[340px] w-full">
                {/* aria-hidden: fatias do Pie recebem role="img" sem nome do Recharts (axe
                    svg-img-alt); a ChartLegend abaixo já dá o texto acessível equivalente. */}
                <PieChart aria-hidden="true" accessibilityLayer={false}>
                  <Pie data={staffByRole} dataKey="value" nameKey="name" outerRadius={120} innerRadius={64} paddingAngle={2} rootTabIndex={-1}>
                    {staffByRole.map((_, i) => (
                      <Cell key={i} fill={getChartColor(i)} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <NoDataOverlay message={t("charts.rh.empty")} height={340} />
            )}
          </AdminCard>
        </TabsContent>

        {/* --- Investigação --- */}
        <TabsContent value="investigacao">
          <AdminCard title={t("charts.investigacao.title")} loading={pubLoading}>
            <p className="text-xs text-muted-foreground -mt-2 mb-4">{t("charts.investigacao.subtitle")}</p>
            {pubsByYear.length > 0 ? (
              <ChartContainer config={pubConfig} className="h-[340px] w-full">
                <LineChart data={pubsByYear} margin={{ left: 4, right: 12, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="ano" tick={axisTickStyle} />
                  <YAxis allowDecimals={false} tick={axisTickStyle} tickFormatter={formatAxisNumber} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="publications" name={t("charts.publications")} stroke={chartColors[2]} strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            ) : (
              <NoDataOverlay message={t("charts.investigacao.empty")} height={340} />
            )}
          </AdminCard>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
