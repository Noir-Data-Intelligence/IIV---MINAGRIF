import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLE_LABEL, type AppRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPISkeleton, CardSkeleton } from "@/components/admin/LoadingStates";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Users, Activity, Boxes, Truck, TrendingUp,
  AlertTriangle, PackageX, CalendarClock, Settings2, RotateCcw, BellOff, EyeOff,
  ChevronRight, X, ArrowUpRight, ArrowDownRight, type LucideIcon,
} from "lucide-react";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  axisTickStyle, buildChartConfig, chartColors, formatAxisNumber, getChartColor, NoDataOverlay,
} from "@/components/charts";

import { useAnalisesList } from "@/hooks/queries/useAnalises";
import { useLotesList } from "@/hooks/queries/useLotes";
import { useDistribuicaoList } from "@/hooks/queries/useDistribuicao";
import { useNaoConformidadesList } from "@/hooks/queries/useNaoConformidades";
import { useInsumosList } from "@/hooks/queries/useInsumos";
import { useProdutosList } from "@/hooks/queries/useProdutos";
import { useLaboratoriosList } from "@/hooks/queries/useLaboratorios";
import { useUsersList } from "@/hooks/queries/useUsers";
import { useDashboardPrefsQuery, useUpdateDashboardPrefs } from "@/hooks/queries/useDashboardPrefs";
import {
  useAlertAcksList, useCreateAlertAck, useDeleteAlertAck,
} from "@/hooks/queries/useDashboardAlertAcks";
import { useCreateAlertHistory } from "@/hooks/queries/useDashboardAlertHistory";
import { isInMonth, isExpiringSoon } from "@/lib/dashboard-metrics";

type KpiKey =
  | "analysesPending" | "completionRate" | "batchesActive" | "distributionsMonth"
  | "ncOpen" | "lowStock" | "expiringSoon" | "users";

type ChartKey = "monthlyAnalyses" | "analysisStatus" | "monthlyProduction" | "productionStatus" | "productTypes";

const KPIS_BY_ROLE: Record<AppRole, KpiKey[]> = {
  admin:       ["analysesPending", "completionRate", "batchesActive", "distributionsMonth", "ncOpen", "lowStock", "expiringSoon", "users"],
  diretor:     ["analysesPending", "completionRate", "batchesActive", "distributionsMonth", "ncOpen", "lowStock", "expiringSoon", "users"],
  gestor:      ["batchesActive", "distributionsMonth", "expiringSoon", "lowStock", "ncOpen", "completionRate"],
  tecnico:     ["analysesPending", "completionRate", "lowStock"],
  colaborador: ["analysesPending", "distributionsMonth", "expiringSoon"],
};

const CHARTS_BY_ROLE: Record<AppRole, ChartKey[]> = {
  admin:       ["monthlyAnalyses", "analysisStatus", "monthlyProduction", "productionStatus", "productTypes"],
  diretor:     ["monthlyAnalyses", "analysisStatus", "monthlyProduction", "productionStatus", "productTypes"],
  gestor:      ["monthlyProduction", "productionStatus", "productTypes"],
  tecnico:     ["monthlyAnalyses", "analysisStatus"],
  colaborador: ["monthlyAnalyses"],
};

const ROLE_INTRO: Record<AppRole, string> = {
  admin: "Visão geral completa do sistema de gestão do IIV",
  diretor: "Visão executiva e indicadores estratégicos do instituto",
  gestor: "Indicadores de produção, distribuição e qualidade",
  tecnico: "Indicadores de análises laboratoriais e insumos",
  colaborador: "Resumo das suas actividades e distribuições",
};

const KPI_LABELS: Record<KpiKey, string> = {
  analysesPending: "Análises Pendentes",
  completionRate: "Taxa de Conclusão",
  batchesActive: "Lotes Ativos",
  distributionsMonth: "Distribuído no Mês",
  ncOpen: "Não Conformidades",
  lowStock: "Stock Crítico",
  expiringSoon: "Lotes a Expirar",
  users: "Utilizadores",
};

const CHART_LABELS: Record<ChartKey, string> = {
  monthlyAnalyses: "Análises por Mês",
  analysisStatus: "Estado das Análises",
  monthlyProduction: "Produção vs Distribuição",
  productionStatus: "Estado dos Lotes",
  productTypes: "Produtos por Tipo",
};

/** KPIs que suportam alertas configuráveis (limiar mínimo a partir do qual avisa). */
type AlertKey = "lowStock" | "expiringSoon" | "ncOpen" | "analysesPending";

const ALERT_KEYS: AlertKey[] = ["lowStock", "expiringSoon", "ncOpen", "analysesPending"];

const DEFAULT_THRESHOLDS: Record<string, number> = {
  lowStock: 1,
  expiringSoon: 1,
  ncOpen: 1,
  analysesPending: 20,
};

const ALERT_META: Record<AlertKey, { label: string; help: string; caption: string; icon: LucideIcon; tone: "warning" | "destructive" }> = {
  lowStock:        { label: "Stock Crítico",         help: "Avisar quando o número de insumos abaixo do mínimo atingir este valor.", caption: "Insumos abaixo do mínimo", icon: PackageX, tone: "destructive" },
  expiringSoon:    { label: "Lotes a Expirar",       help: "Avisar quando houver pelo menos este número de lotes a expirar em 30 dias.", caption: "Nos próximos 30 dias", icon: CalendarClock, tone: "warning" },
  ncOpen:          { label: "Não Conformidades",     help: "Avisar quando o número de não conformidades abertas atingir este valor.", caption: "Abertas ou em análise", icon: AlertTriangle, tone: "destructive" },
  analysesPending: { label: "Análises Pendentes",    help: "Avisar quando o número de análises pendentes atingir este valor.", caption: "Agendadas e em progresso", icon: Activity, tone: "warning" },
};

/** Estilos semânticos por tonalidade de alerta (evita hardcode de hex; usa tokens Tailwind/shadcn). */
const ALERT_TONE_STYLES: Record<"warning" | "destructive", {
  card: string; accent: string; iconWrap: string; badge: string; badgeLabel: string; value: string;
}> = {
  destructive: {
    card: "border-destructive/25 bg-destructive/[0.035]",
    accent: "bg-destructive",
    iconWrap: "bg-destructive text-white shadow-md shadow-destructive/30",
    badge: "bg-destructive/10 text-destructive",
    badgeLabel: "Crítico",
    value: "text-destructive",
  },
  warning: {
    card: "border-amber-500/25 bg-amber-500/[0.035]",
    accent: "bg-amber-500",
    iconWrap: "bg-amber-500 text-white shadow-md shadow-amber-500/30",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    badgeLabel: "Atenção",
    value: "text-amber-600 dark:text-amber-400",
  },
};

type Trend = { value: string; direction: "up" | "down" } | undefined;

const calcTrend = (current: number, previous: number): Trend => {
  if (previous === 0) return current > 0 ? { value: "novo", direction: "up" } : undefined;
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 1) return undefined;
  return { value: `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`, direction: diff >= 0 ? "up" : "down" };
};

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Dashboard() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const activeRole: AppRole = role ?? "colaborador";
  const roleKpis = KPIS_BY_ROLE[activeRole];
  const roleCharts = CHARTS_BY_ROLE[activeRole];

  const prefersReducedMotion = useReducedMotion();

  // Saudação por hora do dia + data por extenso, para o hero do painel.
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 19 ? "Boa tarde" : "Boa noite";
  const firstName = user?.email?.split("@")[0] ?? "";
  const todayLabel = new Date().toLocaleDateString("pt-PT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ---- Fontes de dados (hooks migrados, agregação client-side) ----
  const analisesQuery = useAnalisesList({ page: 1, perPage: 1000 });
  const lotesQuery = useLotesList({ page: 1, perPage: 1000 });
  const distribuicaoQuery = useDistribuicaoList({ page: 1, perPage: 1000 });
  const ncQuery = useNaoConformidadesList({ page: 1, perPage: 1000 });
  const insumosQuery = useInsumosList({ page: 1, perPage: 1000 });
  const produtosQuery = useProdutosList({ page: 1, perPage: 1000 });
  const laboratoriosQuery = useLaboratoriosList({ page: 1, perPage: 1000 });
  const usersQuery = useUsersList({});

  const loading =
    analisesQuery.isLoading || lotesQuery.isLoading || distribuicaoQuery.isLoading ||
    ncQuery.isLoading || insumosQuery.isLoading || produtosQuery.isLoading ||
    laboratoriosQuery.isLoading || usersQuery.isLoading;

  // ---- Preferências de painel (recurso mock dedicado) ----
  const prefsQuery = useDashboardPrefsQuery();
  const updatePrefs = useUpdateDashboardPrefs();
  const prefsLoaded = prefsQuery.isSuccess;

  const [selectedKpis, setSelectedKpis] = useState<KpiKey[]>(roleKpis);
  const [selectedCharts, setSelectedCharts] = useState<ChartKey[]>(roleCharts);
  const [thresholds, setThresholds] = useState<Record<string, number>>(DEFAULT_THRESHOLDS);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [draftKpis, setDraftKpis] = useState<Set<KpiKey>>(new Set(roleKpis));
  const [draftCharts, setDraftCharts] = useState<Set<ChartKey>>(new Set(roleCharts));
  const [draftThresholds, setDraftThresholds] = useState<Record<string, number>>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    if (!prefsQuery.data) return;
    const data = prefsQuery.data;
    const k = (data.kpis as KpiKey[]).filter((x) => roleKpis.includes(x));
    const c = (data.charts as ChartKey[]).filter((x) => roleCharts.includes(x));
    setSelectedKpis(k.length ? k : roleKpis);
    setSelectedCharts(c.length ? c : roleCharts);
    setThresholds({ ...DEFAULT_THRESHOLDS, ...(data.thresholds ?? {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsQuery.data, activeRole]);

  const allowedKpis = new Set(selectedKpis);
  const allowedCharts = new Set(selectedCharts);

  const openPrefs = () => {
    setDraftKpis(new Set(selectedKpis));
    setDraftCharts(new Set(selectedCharts));
    setDraftThresholds({ ...thresholds });
    setPrefsOpen(true);
  };

  const toggleDraftKpi = (k: KpiKey) => {
    const next = new Set(draftKpis);
    next.has(k) ? next.delete(k) : next.add(k);
    setDraftKpis(next);
  };
  const toggleDraftChart = (c: ChartKey) => {
    const next = new Set(draftCharts);
    next.has(c) ? next.delete(c) : next.add(c);
    setDraftCharts(next);
  };

  const resetDraft = () => {
    setDraftKpis(new Set(roleKpis));
    setDraftCharts(new Set(roleCharts));
    setDraftThresholds(DEFAULT_THRESHOLDS);
  };

  const savePrefs = async () => {
    const kpisArr = Array.from(draftKpis);
    const chartsArr = Array.from(draftCharts);
    try {
      await updatePrefs.mutateAsync({ kpis: kpisArr, charts: chartsArr, thresholds: draftThresholds });
      setSelectedKpis(kpisArr);
      setSelectedCharts(chartsArr);
      setThresholds(draftThresholds);
      setPrefsOpen(false);
      toast.success("Preferências guardadas");
    } catch {
      toast.error("Erro ao guardar preferências");
    }
  };

  // ---- Silenciar/reactivar alertas (recurso mock dedicado) ----
  const acksQuery = useAlertAcksList();
  const createAck = useCreateAlertAck();
  const deleteAck = useDeleteAlertAck();

  const acks = useMemo(() => {
    const map: Record<string, string> = {};
    (acksQuery.data ?? []).forEach((a) => { map[a.metricKey] = a.acknowledgedUntil; });
    return map;
  }, [acksQuery.data]);

  const ackAlert = async (metric: AlertKey, hours: number) => {
    try {
      await createAck.mutateAsync({ metricKey: metric, hours });
      toast.success(`Alerta silenciado por ${hours < 24 ? `${hours}h` : `${hours / 24} dias`}`);
    } catch {
      toast.error("Erro ao silenciar alerta");
    }
  };

  const unackAlert = async (metric: AlertKey) => {
    try {
      await deleteAck.mutateAsync(metric);
      toast.success("Alerta reativado");
    } catch {
      toast.error("Erro ao reativar alerta");
    }
  };

  // ---- Agregação de KPIs/estatísticas ----
  const stats = useMemo(() => {
    const analyses = analisesQuery.data?.data ?? [];
    const batches = lotesQuery.data?.data ?? [];
    const dists = distribuicaoQuery.data?.data ?? [];
    const ncs = ncQuery.data?.data ?? [];
    const supplies = insumosQuery.data?.data ?? [];

    const now = new Date();
    const curY = now.getFullYear(), curM = now.getMonth();
    const prev = new Date(curY, curM - 1, 1);
    const prevY = prev.getFullYear(), prevM = prev.getMonth();

    const analysesPending = analyses.filter((a) => a.status === "agendada" || a.status === "em_progresso").length;
    const analysesPendingPrev = analyses.filter((a) =>
      (a.status === "agendada" || a.status === "em_progresso") && isInMonth(a.createdAt, prevY, prevM),
    ).length;

    const batchesActive = batches.filter((b) => b.status === "em_producao" || b.status === "planeada").length;
    const batchesActivePrev = batches.filter((b) =>
      (b.status === "em_producao" || b.status === "planeada") && isInMonth(b.createdAt, prevY, prevM),
    ).length;

    const distributionsMonth = dists.filter((d) => isInMonth(d.distributionDate, curY, curM))
      .reduce((s, d) => s + (d.quantity || 0), 0);
    const distributionsMonthPrev = dists.filter((d) => isInMonth(d.distributionDate, prevY, prevM))
      .reduce((s, d) => s + (d.quantity || 0), 0);

    const concluded = analyses.filter((a) => a.status === "concluida").length;
    const completionRate = analyses.length > 0 ? Math.round((concluded / analyses.length) * 100) : 0;

    const ncOpen = ncs.filter((n) => n.status === "aberta" || n.status === "em_resolucao").length;
    const lowStock = supplies.filter((s) => (s.quantity ?? 0) <= (s.minStock ?? 0)).length;
    const expiringSoon = batches.filter((b) => isExpiringSoon(b.expiryDate)).length;

    return {
      users: usersQuery.data?.length ?? 0,
      labs: laboratoriosQuery.data?.meta.total ?? 0,
      products: produtosQuery.data?.meta.total ?? 0,
      analysesPending, analysesPendingPrev,
      batchesActive, batchesActivePrev,
      distributionsMonth, distributionsMonthPrev,
      completionRate,
      ncOpen, lowStock, expiringSoon,
    };
  }, [
    analisesQuery.data, lotesQuery.data, distribuicaoQuery.data, ncQuery.data,
    insumosQuery.data, usersQuery.data, laboratoriosQuery.data, produtosQuery.data,
  ]);

  // ---- Séries dos gráficos ----
  const analysisStatus = useMemo(() => {
    const labels: Record<string, string> = { agendada: "Agendada", em_progresso: "Em Progresso", concluida: "Concluída", cancelada: "Cancelada" };
    const counts: Record<string, number> = {};
    (analisesQuery.data?.data ?? []).forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [analisesQuery.data]);

  const productionStatus = useMemo(() => {
    const labels: Record<string, string> = { planeada: "Planeada", em_producao: "Em Produção", concluida: "Concluída", suspensa: "Suspensa" };
    const counts: Record<string, number> = {};
    (lotesQuery.data?.data ?? []).forEach((b) => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [lotesQuery.data]);

  const { monthlyAnalyses, monthlyProduction } = useMemo(() => {
    const now = new Date();
    const curY = now.getFullYear(), curM = now.getMonth();
    const monthlyA: Record<string, number> = {};
    const monthlyP: Record<string, { produced: number; distributed: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curY, curM - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyA[key] = 0;
      monthlyP[key] = { produced: 0, distributed: 0 };
    }
    (analisesQuery.data?.data ?? []).forEach((a) => {
      const key = a.scheduledDate?.substring(0, 7);
      if (key && key in monthlyA) monthlyA[key]++;
    });
    (lotesQuery.data?.data ?? []).forEach((b) => {
      const key = b.productionDate?.substring(0, 7);
      if (key && key in monthlyP) monthlyP[key].produced += b.quantityProduced || 0;
    });
    (distribuicaoQuery.data?.data ?? []).forEach((d) => {
      const key = d.distributionDate?.substring(0, 7);
      if (key && key in monthlyP) monthlyP[key].distributed += d.quantity || 0;
    });
    const toMonth = (k: string) => {
      const [y, m] = k.split("-");
      return `${MONTH_NAMES[parseInt(m) - 1]}/${y.slice(2)}`;
    };
    return {
      monthlyAnalyses: Object.entries(monthlyA).map(([k, v]) => ({ month: toMonth(k), total: v })),
      monthlyProduction: Object.entries(monthlyP).map(([k, v]) => ({ month: toMonth(k), ...v })),
    };
  }, [analisesQuery.data, lotesQuery.data, distribuicaoQuery.data]);

  const productTypes = useMemo(() => {
    const labels: Record<string, string> = { vacina: "Vacinas", soro: "Soros", reagente: "Reagentes" };
    const counts: Record<string, number> = {};
    (produtosQuery.data?.data ?? []).forEach((p) => { counts[p.productType] = (counts[p.productType] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [produtosQuery.data]);

  // Configs de gráfico (ChartContainer / preset partilhado).
  const analysisStatusConfig = useMemo(() => buildChartConfig(analysisStatus.map((d) => d.name)), [analysisStatus]);
  const productionStatusConfig = useMemo(() => buildChartConfig(productionStatus.map((d) => d.name)), [productionStatus]);
  const monthlyAnalysesConfig = useMemo(() => buildChartConfig(["total"], { total: "Análises" }), []);
  const monthlyProductionConfig = useMemo(
    () => buildChartConfig(["produced", "distributed"], { produced: "Produzido", distributed: "Distribuído" }),
    [],
  );
  const productTypesConfig = useMemo(() => buildChartConfig(["value"], { value: "Quantidade" }), []);

  // ---- Registo de histórico quando um alerta dispara (debounce server-side de 1h) ----
  const createAlertHistory = useCreateAlertHistory();
  const loggedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (loading || !prefsLoaded) return;
    const currentValues: Record<AlertKey, number> = {
      lowStock: stats.lowStock,
      expiringSoon: stats.expiringSoon,
      ncOpen: stats.ncOpen,
      analysesPending: stats.analysesPending,
    };
    const active = ALERT_KEYS.filter((k) => {
      const th = thresholds[k] ?? 0;
      if (acks[k] && new Date(acks[k]) > new Date()) return false; // silenciado
      return th > 0 && currentValues[k] >= th;
    });
    active.forEach((k) => {
      if (loggedRef.current.has(k)) return;
      loggedRef.current.add(k);
      createAlertHistory.mutate({
        metricKey: k,
        label: ALERT_META[k].label,
        value: currentValues[k],
        threshold: thresholds[k],
        tone: ALERT_META[k].tone,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, prefsLoaded, stats.lowStock, stats.expiringSoon, stats.ncOpen, stats.analysesPending, thresholds, acks]);

  const allKpis: Array<{
    key: KpiKey; icon: any; label: string; value: string | number; caption?: string; trend?: Trend;
    variant: "glass" | "gradient-green" | "gradient-gold" | "gradient-teal" | "gradient-green-gold";
  }> = [
    {
      key: "analysesPending",
      icon: Activity, label: "Análises Pendentes", value: stats.analysesPending,
      caption: "Agendadas e em progresso", variant: "gradient-green",
      trend: calcTrend(stats.analysesPending, stats.analysesPendingPrev),
    },
    {
      key: "completionRate",
      icon: TrendingUp, label: "Taxa de Conclusão", value: `${stats.completionRate}%`,
      caption: "Análises concluídas", variant: "gradient-gold",
    },
    {
      key: "batchesActive",
      icon: Boxes, label: "Lotes Ativos", value: stats.batchesActive,
      caption: "Em produção ou planeados", variant: "gradient-teal",
      trend: calcTrend(stats.batchesActive, stats.batchesActivePrev),
    },
    {
      key: "distributionsMonth",
      icon: Truck, label: "Distribuído no Mês", value: stats.distributionsMonth.toLocaleString("pt-PT"),
      caption: "Unidades distribuídas", variant: "gradient-green-gold",
      trend: calcTrend(stats.distributionsMonth, stats.distributionsMonthPrev),
    },
    {
      key: "ncOpen",
      icon: AlertTriangle, label: "Não Conformidades", value: stats.ncOpen,
      caption: "Abertas ou em análise", variant: "glass",
    },
    {
      key: "lowStock",
      icon: PackageX, label: "Stock Crítico", value: stats.lowStock,
      caption: "Insumos abaixo do mínimo", variant: "glass",
    },
    {
      key: "expiringSoon",
      icon: CalendarClock, label: "Lotes a Expirar", value: stats.expiringSoon,
      caption: "Próximos 30 dias", variant: "glass",
    },
    {
      key: "users",
      icon: Users, label: "Utilizadores", value: stats.users,
      caption: `${stats.labs} laboratórios · ${stats.products} produtos`,
      variant: "glass",
    },
  ];
  const kpis = allKpis.filter((k) => allowedKpis.has(k.key));

  if (loading) return (
    <div className="space-y-8">
      <div className="rounded-3xl gradient-green h-40 animate-pulse opacity-60" />
      <KPISkeleton count={8} />
      <div className="grid gap-5 lg:grid-cols-3">
        <CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* HERO DE BOAS-VINDAS — substitui o cabeçalho genérico por uma saudação
          pessoal com data, estado do sistema e acesso à personalização. */}
      <div className="relative overflow-hidden rounded-3xl gradient-green text-primary-foreground shadow-xl animate-fade-up">
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[hsl(var(--iiv-gold))]/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="relative p-7 md:p-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="kicker text-[hsl(var(--iiv-gold))] capitalize">{todayLabel}</p>
            <h1 className="font-serif text-3xl md:text-4xl mt-3 leading-tight">
              {greeting}, <span className="capitalize">{firstName}</span>
            </h1>
            <p className="text-sm opacity-75 mt-2 max-w-xl">
              {ROLE_INTRO[activeRole]} · perfil {ROLE_LABEL[activeRole]}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3.5 py-1.5 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--iiv-gold))] animate-pulse" />
              Sistema operacional · dados em tempo real
            </div>
          </div>
          <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={openPrefs}
                className="gap-2 shrink-0 border-primary-foreground/25 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground backdrop-blur-sm"
              >
                <Settings2 className="h-4 w-4" />
                Personalizar
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Personalizar Painel</DialogTitle>
              <DialogDescription>
                Escolha quais indicadores e gráficos aparecem no seu Painel de Controlo. As preferências são guardadas para o seu utilizador.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 sm:grid-cols-2 py-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Indicadores (KPIs)</h3>
                <div className="space-y-2">
                  {roleKpis.map((k) => (
                    <label key={k} htmlFor={`kpi-${k}`} className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50">
                      <Checkbox id={`kpi-${k}`} checked={draftKpis.has(k)} onCheckedChange={() => toggleDraftKpi(k)} />
                      <span className="text-sm">{KPI_LABELS[k]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Gráficos</h3>
                <div className="space-y-2">
                  {roleCharts.map((c) => (
                    <label key={c} htmlFor={`chart-${c}`} className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50">
                      <Checkbox id={`chart-${c}`} checked={draftCharts.has(c)} onCheckedChange={() => toggleDraftChart(c)} />
                      <span className="text-sm">{CHART_LABELS[c]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Alert thresholds */}
            <div className="space-y-3 border-t border-border/40 pt-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Alertas (Limiares)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mostrar um aviso no topo do painel quando a métrica atingir ou ultrapassar o valor. Coloque <strong>0</strong> para desativar.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ALERT_KEYS.map((k) => (
                  <div key={k} className="flex items-center gap-3">
                    <label htmlFor={`th-${k}`} className="flex-1 text-sm" title={ALERT_META[k].help}>
                      {ALERT_META[k].label}
                    </label>
                    <Input
                      id={`th-${k}`}
                      type="number"
                      min={0}
                      className="w-24"
                      value={draftThresholds[k] ?? 0}
                      onChange={(e) =>
                        setDraftThresholds({ ...draftThresholds, [k]: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="ghost" onClick={resetDraft} className="gap-2 mr-auto">
                <RotateCcw className="h-4 w-4" /> Repor predefinição
              </Button>
              <Button variant="outline" onClick={() => setPrefsOpen(false)}>Cancelar</Button>
              <Button onClick={savePrefs} disabled={updatePrefs.isPending}>
                {updatePrefs.isPending ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts — limiares configuráveis */}
      {(() => {
        const currentValues: Record<AlertKey, number> = {
          lowStock: stats.lowStock,
          expiringSoon: stats.expiringSoon,
          ncOpen: stats.ncOpen,
          analysesPending: stats.analysesPending,
        };
        const isAcked = (k: AlertKey) => acks[k] && new Date(acks[k]) > new Date();
        const active = ALERT_KEYS.filter((k) => {
          const t = thresholds[k] ?? 0;
          return t > 0 && currentValues[k] >= t && !isAcked(k);
        });
        const silenced = ALERT_KEYS.filter((k) => {
          const t = thresholds[k] ?? 0;
          return t > 0 && currentValues[k] >= t && isAcked(k);
        });
        if (active.length === 0 && silenced.length === 0) return null;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white shadow-md shadow-destructive/30">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-semibold text-foreground">
                  Alertas Ativos
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">({active.length})</span>
                </h2>
              </div>
              <Link
                to="/admin/historico-alertas"
                className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Ver histórico de alertas <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <motion.div
              variants={prefersReducedMotion ? undefined : staggerContainer}
              initial={prefersReducedMotion ? undefined : "hidden"}
              animate={prefersReducedMotion ? undefined : "visible"}
              className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
            >
              {active.map((k) => {
                const meta = ALERT_META[k];
                const Icon = meta.icon;
                const tone = ALERT_TONE_STYLES[meta.tone];
                const value = currentValues[k];
                const t = thresholds[k];
                return (
                  <motion.div key={k} variants={prefersReducedMotion ? undefined : fadeInUp}>
                    {/* Tira compacta: tudo numa linha — ícone, métrica, valor, ações */}
                    <div className={cn("relative overflow-hidden rounded-2xl border shadow-sm flex items-center gap-4 p-4 pl-5", tone.card)}>
                      <span className={cn("absolute inset-y-0 left-0 w-1", tone.accent)} aria-hidden="true" />
                      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone.iconWrap)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight text-foreground truncate">{meta.label}</p>
                        <p className="mt-1 flex items-baseline gap-1.5">
                          <span className={cn("text-2xl font-serif font-semibold leading-none", tone.value)}>{value}</span>
                          <span className="text-[11px] text-muted-foreground">/ limiar {t}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Link
                          to={`/admin/painel/${k}`}
                          className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline underline-offset-2"
                        >
                          Detalhes <ChevronRight className="h-3 w-3" />
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 gap-1 text-[11px] text-muted-foreground hover:text-foreground" aria-label={`Silenciar alerta ${meta.label}`}>
                              <EyeOff className="h-3 w-3" /> Visto
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs">Silenciar por...</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => ackAlert(k, 1)}>1 hora</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => ackAlert(k, 4)}>4 horas</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => ackAlert(k, 24)}>24 horas</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => ackAlert(k, 24 * 7)}>7 dias</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {silenced.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <BellOff className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">Silenciados:</span>
                {silenced.map((k) => (
                  <button
                    key={k}
                    onClick={() => unackAlert(k)}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 transition-colors hover:border-foreground/30 hover:text-foreground"
                    title={`Reativar alerta (silenciado até ${new Date(acks[k]).toLocaleString("pt-PT")})`}
                  >
                    {ALERT_META[k].label}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* KPI Cards — layout horizontal (ícone à esquerda, número grande) */}
      <motion.div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        variants={prefersReducedMotion ? undefined : staggerContainer}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
      >
        {kpis.map((c) => {
          const Icon = c.icon;
          const isGradient = c.variant !== "glass";
          return (
            <motion.div key={c.key} variants={prefersReducedMotion ? undefined : fadeInUp}>
              <Link
                to={`/admin/painel/${c.key}`}
                aria-label={`Ver detalhes: ${c.label}`}
                className={cn(
                  "group relative flex items-center gap-5 rounded-2xl p-6 min-h-[7.5rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isGradient
                    ? `${c.variant} border-0 text-primary-foreground shadow-lg`
                    : "bg-card border border-border/60 shadow-sm",
                )}
              >
                {isGradient && (
                  <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                )}
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
                    isGradient ? "bg-white/15 backdrop-blur-sm" : "gradient-green-soft text-primary-foreground shadow-md",
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-3xl xl:text-4xl font-serif leading-none tracking-tight">{c.value}</p>
                  <p className={cn("text-sm mt-2 font-medium truncate", isGradient ? "text-primary-foreground/85" : "text-muted-foreground")}>
                    {c.label}
                  </p>
                  {c.caption && (
                    <p className={cn("text-xs mt-0.5 truncate", isGradient ? "text-primary-foreground/60" : "text-muted-foreground")}>
                      {c.caption}
                    </p>
                  )}
                </div>
                {c.trend && (
                  <span
                    className={cn(
                      "absolute top-3 right-3 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      isGradient
                        ? "bg-white/15 text-primary-foreground"
                        : c.trend.direction === "up"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {c.trend.direction === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {c.trend.value}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts row 1 — análises */}
      {(allowedCharts.has("monthlyAnalyses") || allowedCharts.has("analysisStatus")) && (
        <div className="grid gap-5 lg:grid-cols-3 min-w-0">
          {allowedCharts.has("monthlyAnalyses") && (
            <Card className="lg:col-span-2 glass-card shadow-elegant rounded-xl hover-lift animate-fade-up min-w-0">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-base font-semibold font-serif">Análises por Mês</CardTitle><Link to="/admin/painel/monthlyAnalyses" className="text-xs text-primary hover:underline">Ver detalhes →</Link></CardHeader>
              <CardContent>
                {monthlyAnalyses.some((d) => d.total > 0) ? (
                  <ChartContainer config={monthlyAnalysesConfig} className="h-[280px] w-full">
                    <BarChart data={monthlyAnalyses}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={axisTickStyle} />
                      <YAxis allowDecimals={false} tick={axisTickStyle} tickFormatter={formatAxisNumber} width={32} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="total" name="Análises" fill={chartColors[0]} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : <NoDataOverlay message="Sem dados de análises." height={280} />}
              </CardContent>
            </Card>
          )}

          {allowedCharts.has("analysisStatus") && (
            <Card className="glass-card shadow-elegant rounded-xl hover-lift animate-fade-up min-w-0">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-base font-semibold font-serif">Estado das Análises</CardTitle><Link to="/admin/painel/analysisStatus" className="text-xs text-primary hover:underline">Ver detalhes →</Link></CardHeader>
              <CardContent>
                {analysisStatus.length > 0 ? (
                  <ChartContainer config={analysisStatusConfig} className="h-[280px] w-full">
                    {/* aria-hidden: o Recharts atribui role="img" sem nome a cada fatia (path)
                        do Pie, o que o axe assinala (svg-img-alt). A legenda abaixo (ChartLegend)
                        já expõe a mesma informação em texto acessível fora do SVG. */}
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }} aria-hidden="true" accessibilityLayer={false}>
                      <Pie data={analysisStatus} cx="50%" cy="45%" innerRadius={48} outerRadius={82} dataKey="value" nameKey="name" strokeWidth={2} stroke="hsl(var(--card))" labelLine={false} rootTabIndex={-1}>
                        {analysisStatus.map((_, i) => <Cell key={i} fill={getChartColor(i)} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ChartContainer>
                ) : <NoDataOverlay message="Sem dados." height={280} />}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts row 2 — produção */}
      {(allowedCharts.has("monthlyProduction") || allowedCharts.has("productionStatus")) && (
        <div className="grid gap-5 lg:grid-cols-3 min-w-0">
          {allowedCharts.has("monthlyProduction") && (
            <Card className="lg:col-span-2 glass-card shadow-elegant rounded-xl hover-lift animate-fade-up min-w-0">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-base font-semibold font-serif">Produção vs Distribuição</CardTitle><Link to="/admin/painel/monthlyProduction" className="text-xs text-primary hover:underline">Ver detalhes →</Link></CardHeader>
              <CardContent>
                {monthlyProduction.some((d) => d.produced > 0 || d.distributed > 0) ? (
                  <ChartContainer config={monthlyProductionConfig} className="h-[280px] w-full">
                    <AreaChart data={monthlyProduction}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={axisTickStyle} />
                      <YAxis allowDecimals={false} tick={axisTickStyle} tickFormatter={formatAxisNumber} width={32} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area type="monotone" dataKey="produced" name="Produzido" stroke={chartColors[0]} fill={chartColors[0]} fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="distributed" name="Distribuído" stroke={chartColors[1]} fill={chartColors[1]} fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                ) : <NoDataOverlay message="Sem dados de produção." height={280} />}
              </CardContent>
            </Card>
          )}

          {allowedCharts.has("productionStatus") && (
            <Card className="glass-card shadow-elegant rounded-xl hover-lift animate-fade-up min-w-0">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-base font-semibold font-serif">Estado dos Lotes</CardTitle><Link to="/admin/painel/productionStatus" className="text-xs text-primary hover:underline">Ver detalhes →</Link></CardHeader>
              <CardContent>
                {productionStatus.length > 0 ? (
                  <ChartContainer config={productionStatusConfig} className="h-[280px] w-full">
                    {/* aria-hidden: o Recharts atribui role="img" sem nome a cada fatia (path)
                        do Pie, o que o axe assinala (svg-img-alt). A legenda abaixo (ChartLegend)
                        já expõe a mesma informação em texto acessível fora do SVG. */}
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }} aria-hidden="true" accessibilityLayer={false}>
                      <Pie data={productionStatus} cx="50%" cy="45%" innerRadius={48} outerRadius={82} dataKey="value" nameKey="name" strokeWidth={2} stroke="hsl(var(--card))" labelLine={false} rootTabIndex={-1}>
                        {productionStatus.map((_, i) => <Cell key={i} fill={getChartColor(i)} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ChartContainer>
                ) : <NoDataOverlay message="Sem dados." height={280} />}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Product types */}
      {allowedCharts.has("productTypes") && productTypes.length > 0 && (
        <Card className="glass-card shadow-elegant rounded-xl hover-lift animate-fade-up">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-base font-semibold font-serif">Produtos por Tipo</CardTitle><Link to="/admin/painel/productTypes" className="text-xs text-primary hover:underline">Ver detalhes →</Link></CardHeader>
          <CardContent>
            <ChartContainer config={productTypesConfig} className="h-[220px] w-full">
              <BarChart data={productTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={axisTickStyle} tickFormatter={formatAxisNumber} />
                <YAxis type="category" dataKey="name" width={80} tick={axisTickStyle} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" name="Quantidade" fill={chartColors[1]} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
