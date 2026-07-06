import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABEL, type AppRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { KPISkeleton, CardSkeleton } from "@/components/admin/LoadingStates";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Users, FlaskConical, Activity, Pill, Boxes, Truck, TrendingUp,
  LayoutDashboard, AlertTriangle, PackageX, CalendarClock, Settings2, RotateCcw, BellOff, EyeOff,
} from "lucide-react";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";

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

const ALERT_META: Record<AlertKey, { label: string; help: string; tone: "warning" | "destructive" }> = {
  lowStock:        { label: "Stock Crítico",         help: "Avisar quando o número de insumos abaixo do mínimo atingir este valor.", tone: "destructive" },
  expiringSoon:    { label: "Lotes a Expirar",       help: "Avisar quando houver pelo menos este número de lotes a expirar em 30 dias.", tone: "warning" },
  ncOpen:          { label: "Não Conformidades",     help: "Avisar quando o número de não conformidades abertas atingir este valor.", tone: "destructive" },
  analysesPending: { label: "Análises Pendentes",    help: "Avisar quando o número de análises pendentes atingir este valor.", tone: "warning" },
};




const COLORS = [
  "hsl(152, 42%, 24%)", "hsl(38, 75%, 50%)", "hsl(200, 55%, 48%)",
  "hsl(0, 65%, 48%)", "hsl(280, 45%, 55%)", "hsl(170, 45%, 38%)",
];

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)",
  fontSize: 12,
};

type Trend = { value: string; direction: "up" | "down" } | undefined;

const calcTrend = (current: number, previous: number): Trend => {
  if (previous === 0) return current > 0 ? { value: "novo", direction: "up" } : undefined;
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 1) return undefined;
  return { value: `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`, direction: diff >= 0 ? "up" : "down" };
};

const inMonth = (dateStr: string | null | undefined, year: number, month: number) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month;
};

export default function Dashboard() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const activeRole: AppRole = role ?? "colaborador";
  const roleKpis = KPIS_BY_ROLE[activeRole];
  const roleCharts = CHARTS_BY_ROLE[activeRole];

  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [selectedKpis, setSelectedKpis] = useState<KpiKey[]>(roleKpis);
  const [selectedCharts, setSelectedCharts] = useState<ChartKey[]>(roleCharts);
  const [thresholds, setThresholds] = useState<Record<string, number>>(DEFAULT_THRESHOLDS);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [draftKpis, setDraftKpis] = useState<Set<KpiKey>>(new Set(roleKpis));
  const [draftCharts, setDraftCharts] = useState<Set<ChartKey>>(new Set(roleCharts));
  const [draftThresholds, setDraftThresholds] = useState<Record<string, number>>(DEFAULT_THRESHOLDS);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [acks, setAcks] = useState<Record<string, string>>({}); // metric_key -> acknowledged_until ISO

  const loadAcks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("dashboard_alert_acks")
      .select("metric_key, acknowledged_until")
      .eq("user_id", user.id)
      .gt("acknowledged_until", new Date().toISOString());
    const map: Record<string, string> = {};
    (data ?? []).forEach((r: any) => { map[r.metric_key] = r.acknowledged_until; });
    setAcks(map);
  };

  useEffect(() => { loadAcks(); /* eslint-disable-next-line */ }, [user]);

  const ackAlert = async (metric: AlertKey, hours: number) => {
    if (!user) return;
    const until = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    const { error } = await supabase
      .from("dashboard_alert_acks")
      .upsert({ user_id: user.id, metric_key: metric, acknowledged_until: until }, { onConflict: "user_id,metric_key" });
    if (error) return toast.error("Erro ao silenciar alerta");
    toast.success(`Alerta silenciado por ${hours < 24 ? `${hours}h` : `${hours / 24} dias`}`);
    setAcks((p) => ({ ...p, [metric]: until }));
  };

  const unackAlert = async (metric: AlertKey) => {
    if (!user) return;
    await supabase.from("dashboard_alert_acks").delete().eq("user_id", user.id).eq("metric_key", metric);
    setAcks((p) => { const n = { ...p }; delete n[metric]; return n; });
    toast.success("Alerta reativado");
  };


  // Load user prefs
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_dashboard_prefs")
        .select("kpis, charts, thresholds")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const k = (data.kpis as KpiKey[]).filter((x) => roleKpis.includes(x));
        const c = (data.charts as ChartKey[]).filter((x) => roleCharts.includes(x));
        setSelectedKpis(k.length ? k : roleKpis);
        setSelectedCharts(c.length ? c : roleCharts);
        setThresholds({ ...DEFAULT_THRESHOLDS, ...((data.thresholds as Record<string, number>) ?? {}) });
      } else {
        setSelectedKpis(roleKpis);
        setSelectedCharts(roleCharts);
        setThresholds(DEFAULT_THRESHOLDS);
      }
      setPrefsLoaded(true);
    })();
  }, [user, activeRole]);

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
    if (!user) return;
    setSavingPrefs(true);
    const kpisArr = Array.from(draftKpis);
    const chartsArr = Array.from(draftCharts);
    const { error } = await supabase
      .from("user_dashboard_prefs")
      .upsert(
        { user_id: user.id, kpis: kpisArr, charts: chartsArr, thresholds: draftThresholds },
        { onConflict: "user_id" }
      );
    setSavingPrefs(false);
    if (error) {
      toast.error("Erro ao guardar preferências");
      return;
    }
    setSelectedKpis(kpisArr);
    setSelectedCharts(chartsArr);
    setPrefsOpen(false);
    toast.success("Preferências guardadas");
  };


  const [stats, setStats] = useState({
    users: 0, labs: 0, products: 0,
    analysesPending: 0, analysesPendingPrev: 0,
    batchesActive: 0, batchesActivePrev: 0,
    distributionsMonth: 0, distributionsMonthPrev: 0,
    completionRate: 0,
    ncOpen: 0,
    lowStock: 0,
    expiringSoon: 0,
  });
  const [analysisStatus, setAnalysisStatus] = useState<{ name: string; value: number }[]>([]);
  const [productionStatus, setProductionStatus] = useState<{ name: string; value: number }[]>([]);
  const [monthlyAnalyses, setMonthlyAnalyses] = useState<{ month: string; total: number }[]>([]);
  const [monthlyProduction, setMonthlyProduction] = useState<{ month: string; produced: number; distributed: number }[]>([]);
  const [productTypes, setProductTypes] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [users, labs, analyses, products, batches, dists, ncs, supplies] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("laboratories").select("*", { count: "exact", head: true }),
        supabase.from("lab_analyses").select("*"),
        supabase.from("products").select("*"),
        supabase.from("production_batches").select("*"),
        supabase.from("batch_distributions").select("*"),
        supabase.from("nonconformities").select("*"),
        supabase.from("lab_supplies").select("*"),
      ]);

      const now = new Date();
      const curY = now.getFullYear(), curM = now.getMonth();
      const prev = new Date(curY, curM - 1, 1);
      const prevY = prev.getFullYear(), prevM = prev.getMonth();
      const in30 = new Date(now.getTime() + 30 * 86400000);

      const analysesData = analyses.data ?? [];
      const batchesData = batches.data ?? [];
      const distsData = dists.data ?? [];
      const ncsData = ncs.data ?? [];
      const suppliesData = supplies.data ?? [];

      const analysesPending = analysesData.filter((a: any) => a.status === "agendada" || a.status === "em_progresso").length;
      const analysesPendingPrev = analysesData.filter((a: any) =>
        (a.status === "agendada" || a.status === "em_progresso") && inMonth(a.created_at, prevY, prevM)
      ).length;

      const batchesActive = batchesData.filter((b: any) => b.status === "em_producao" || b.status === "planeada").length;
      const batchesActivePrev = batchesData.filter((b: any) =>
        (b.status === "em_producao" || b.status === "planeada") && inMonth(b.created_at, prevY, prevM)
      ).length;

      const distributionsMonth = distsData.filter((d: any) => inMonth(d.distribution_date, curY, curM))
        .reduce((s: number, d: any) => s + (d.quantity || 0), 0);
      const distributionsMonthPrev = distsData.filter((d: any) => inMonth(d.distribution_date, prevY, prevM))
        .reduce((s: number, d: any) => s + (d.quantity || 0), 0);

      const concluded = analysesData.filter((a: any) => a.status === "concluida").length;
      const completionRate = analysesData.length > 0 ? Math.round((concluded / analysesData.length) * 100) : 0;

      const ncOpen = ncsData.filter((n: any) => n.status === "aberta" || n.status === "em_analise").length;
      const lowStock = suppliesData.filter((s: any) => (s.quantity ?? 0) <= (s.min_stock ?? 0)).length;
      const expiringSoon = batchesData.filter((b: any) => {
        if (!b.expiry_date) return false;
        const d = new Date(b.expiry_date);
        return d >= now && d <= in30;
      }).length;

      setStats({
        users: users.count ?? 0,
        labs: labs.count ?? 0,
        products: products.data?.length ?? 0,
        analysesPending, analysesPendingPrev,
        batchesActive, batchesActivePrev,
        distributionsMonth, distributionsMonthPrev,
        completionRate,
        ncOpen, lowStock, expiringSoon,
      });

      // Analysis status pie
      const statusLabels: Record<string, string> = { agendada: "Agendada", em_progresso: "Em Progresso", concluida: "Concluída", cancelada: "Cancelada" };
      const aStatusCounts: Record<string, number> = {};
      analysesData.forEach((a: any) => { aStatusCounts[a.status] = (aStatusCounts[a.status] || 0) + 1; });
      setAnalysisStatus(Object.entries(aStatusCounts).map(([k, v]) => ({ name: statusLabels[k] || k, value: v })));

      // Production status pie
      const pStatusLabels: Record<string, string> = { planeada: "Planeada", em_producao: "Em Produção", concluida: "Concluída", suspensa: "Suspensa" };
      const pStatusCounts: Record<string, number> = {};
      batchesData.forEach((b: any) => { pStatusCounts[b.status] = (pStatusCounts[b.status] || 0) + 1; });
      setProductionStatus(Object.entries(pStatusCounts).map(([k, v]) => ({ name: pStatusLabels[k] || k, value: v })));

      // Monthly series (last 6 months)
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthlyA: Record<string, number> = {};
      const monthlyP: Record<string, { produced: number; distributed: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(curY, curM - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyA[key] = 0;
        monthlyP[key] = { produced: 0, distributed: 0 };
      }
      analysesData.forEach((a: any) => {
        const key = a.scheduled_date?.substring(0, 7);
        if (key && key in monthlyA) monthlyA[key]++;
      });
      batchesData.forEach((b: any) => {
        const key = b.production_date?.substring(0, 7);
        if (key && key in monthlyP) monthlyP[key].produced += b.quantity_produced || 0;
      });
      distsData.forEach((d: any) => {
        const key = d.distribution_date?.substring(0, 7);
        if (key && key in monthlyP) monthlyP[key].distributed += d.quantity || 0;
      });
      setMonthlyAnalyses(Object.entries(monthlyA).map(([k, v]) => {
        const [y, m] = k.split("-");
        return { month: `${monthNames[parseInt(m) - 1]}/${y.slice(2)}`, total: v };
      }));
      setMonthlyProduction(Object.entries(monthlyP).map(([k, v]) => {
        const [y, m] = k.split("-");
        return { month: `${monthNames[parseInt(m) - 1]}/${y.slice(2)}`, ...v };
      }));

      // Product types
      const typeCounts: Record<string, number> = {};
      const typeLabels: Record<string, string> = { vacina: "Vacinas", soro: "Soros", reagente: "Reagentes" };
      (products.data ?? []).forEach((p: any) => { typeCounts[p.product_type] = (typeCounts[p.product_type] || 0) + 1; });
      setProductTypes(Object.entries(typeCounts).map(([k, v]) => ({ name: typeLabels[k] || k, value: v })));

      setLoading(false);
    };
    fetch();
  }, []);

  // Log alert triggers (debounce: 1 alerta por métrica por hora)
  useEffect(() => {
    if (!user || loading || !prefsLoaded) return;
    const currentValues: Record<AlertKey, number> = {
      lowStock: stats.lowStock,
      expiringSoon: stats.expiringSoon,
      ncOpen: stats.ncOpen,
      analysesPending: stats.analysesPending,
    };
    const active = ALERT_KEYS.filter((k) => {
      const t = thresholds[k] ?? 0;
      if (acks[k] && new Date(acks[k]) > new Date()) return false; // silenciado
      return t > 0 && currentValues[k] >= t;
    });
    if (active.length === 0) return;

    (async () => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("dashboard_alert_history")
        .select("metric_key")
        .eq("user_id", user.id)
        .in("metric_key", active)
        .gte("created_at", hourAgo);
      const recentSet = new Set((recent ?? []).map((r: any) => r.metric_key));
      const toInsert = active
        .filter((k) => !recentSet.has(k))
        .map((k) => ({
          user_id: user.id,
          metric_key: k,
          label: ALERT_META[k].label,
          value: currentValues[k],
          threshold: thresholds[k],
          tone: ALERT_META[k].tone,
        }));
      if (toInsert.length > 0) {
        await supabase.from("dashboard_alert_history").insert(toInsert);
      }
    })();
  }, [user, loading, prefsLoaded, stats.lowStock, stats.expiringSoon, stats.ncOpen, stats.analysesPending, thresholds, acks]);


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
      <AdminPageHeader icon={LayoutDashboard} title="Painel de Controlo" description="Visão geral do sistema de gestão do IIV" />
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
      <AdminPageHeader
        icon={LayoutDashboard}
        title="Painel de Controlo"
        description={`${ROLE_INTRO[activeRole]} · perfil ${ROLE_LABEL[activeRole]}`}
      >
        <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={openPrefs} className="gap-2">
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
              <Button onClick={savePrefs} disabled={savingPrefs}>
                {savingPrefs ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>


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
          <div className="space-y-2 animate-fade-up">
            <div className="flex justify-end">
              <Link to="/admin/historico-alertas" className="text-xs text-muted-foreground hover:text-foreground underline">
                Ver histórico de alertas →
              </Link>
            </div>
            {active.map((k) => {
              const meta = ALERT_META[k];
              const value = currentValues[k];
              const t = thresholds[k];
              return (
                <Alert
                  key={k}
                  variant={meta.tone === "destructive" ? "destructive" : "default"}
                  className={meta.tone === "warning" ? "border-amber-500/50 bg-amber-500/5" : ""}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="font-serif flex items-center justify-between gap-3">
                    <span>{meta.label}</span>
                    <div className="flex items-center gap-3">
                      <Link to={`/admin/painel/${k}`} className="text-xs font-normal underline hover:no-underline">
                        Ver detalhes →
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                            <EyeOff className="h-3 w-3" /> Marcar como visto
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
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    Valor atual: <strong>{value}</strong> · Limiar definido: <strong>{t}</strong>.
                  </AlertDescription>
                </Alert>
              );
            })}
            {silenced.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-1 pt-1 text-xs text-muted-foreground">
                <BellOff className="h-3.5 w-3.5" />
                <span>Silenciados:</span>
                {silenced.map((k) => (
                  <button
                    key={k}
                    onClick={() => unackAlert(k)}
                    className="underline hover:text-foreground"
                    title={`Reativar alerta (silenciado até ${new Date(acks[k]).toLocaleString("pt-PT")})`}
                  >
                    {ALERT_META[k].label} ✕
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}



      {/* KPI Cards — operational metrics */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {kpis.map((c, i) => (
          <Link
            key={c.label}
            to={`/admin/painel/${c.key}`}
            className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-transform hover:-translate-y-0.5"
            aria-label={`Ver detalhes: ${c.label}`}
          >
            <AdminCard
              title={c.label}
              icon={c.icon}
              metric={c.value}
              caption={c.caption}
              trend={c.trend}
              variant={c.variant}
              stagger={(i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
            />
          </Link>
        ))}
      </div>

      {/* Charts row 1 — análises */}
      {(allowedCharts.has("monthlyAnalyses") || allowedCharts.has("analysisStatus")) && (
        <div className="grid gap-5 lg:grid-cols-3">
          {allowedCharts.has("monthlyAnalyses") && (
            <Card className="lg:col-span-2 glass-card shadow-elegant rounded-xl hover-lift animate-fade-up">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-base font-semibold font-serif">Análises por Mês</CardTitle><Link to="/admin/painel/monthlyAnalyses" className="text-xs text-primary hover:underline">Ver detalhes →</Link></CardHeader>
              <CardContent>
                {monthlyAnalyses.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyAnalyses}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="total" name="Análises" fill="hsl(152, 42%, 24%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-10 text-center">Sem dados de análises.</p>}
              </CardContent>
            </Card>
          )}

          {allowedCharts.has("analysisStatus") && (
            <Card className="glass-card shadow-elegant rounded-xl hover-lift animate-fade-up">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-base font-semibold font-serif">Estado das Análises</CardTitle><Link to="/admin/painel/analysisStatus" className="text-xs text-primary hover:underline">Ver detalhes →</Link></CardHeader>
              <CardContent>
                {analysisStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie data={analysisStatus} cx="50%" cy="45%" innerRadius={48} outerRadius={82} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))" labelLine={false}>
                        {analysisStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value, _entry, i) => {
                        const total = analysisStatus.reduce((s, d) => s + d.value, 0);
                        const v = analysisStatus[i as number]?.value ?? 0;
                        const pct = total ? Math.round((v / total) * 100) : 0;
                        return `${value} ${pct}%`;
                      }} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-10 text-center">Sem dados.</p>}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts row 2 — produção */}
      {(allowedCharts.has("monthlyProduction") || allowedCharts.has("productionStatus")) && (
        <div className="grid gap-5 lg:grid-cols-3">
          {allowedCharts.has("monthlyProduction") && (
            <Card className="lg:col-span-2 glass-card shadow-elegant rounded-xl hover-lift animate-fade-up">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-base font-semibold font-serif">Produção vs Distribuição</CardTitle><Link to="/admin/painel/monthlyProduction" className="text-xs text-primary hover:underline">Ver detalhes →</Link></CardHeader>
              <CardContent>
                {monthlyProduction.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyProduction}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Area type="monotone" dataKey="produced" name="Produzido" stroke="hsl(152, 42%, 24%)" fill="hsl(152, 42%, 24%)" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="distributed" name="Distribuído" stroke="hsl(38, 75%, 50%)" fill="hsl(38, 75%, 50%)" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-10 text-center">Sem dados de produção.</p>}
              </CardContent>
            </Card>
          )}

          {allowedCharts.has("productionStatus") && (
            <Card className="glass-card shadow-elegant rounded-xl hover-lift animate-fade-up">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-base font-semibold font-serif">Estado dos Lotes</CardTitle><Link to="/admin/painel/productionStatus" className="text-xs text-primary hover:underline">Ver detalhes →</Link></CardHeader>
              <CardContent>
                {productionStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie data={productionStatus} cx="50%" cy="45%" innerRadius={48} outerRadius={82} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))" labelLine={false}>
                        {productionStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value, _entry, i) => {
                        const total = productionStatus.reduce((s, d) => s + d.value, 0);
                        const v = productionStatus[i as number]?.value ?? 0;
                        const pct = total ? Math.round((v / total) * 100) : 0;
                        return `${value} ${pct}%`;
                      }} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-10 text-center">Sem dados.</p>}
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Quantidade" fill="hsl(38, 75%, 50%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
