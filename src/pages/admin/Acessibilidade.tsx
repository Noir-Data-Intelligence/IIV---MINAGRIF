import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck, Play, FileDown, AlertCircle, CheckCircle2, Contrast, Ruler, RefreshCw,
  AlertTriangle, ListChecks,
} from "lucide-react";
import { auditRoute, summarise, type RouteAuditResult } from "@/lib/a11yAudit";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ensurePdfFonts, PDF_HEADING_FONT, PDF_BODY_FONT } from "@/lib/pdfFonts";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptAcessibilidade from "@/i18n/locales/pt/acessibilidade.json";
import enAcessibilidade from "@/i18n/locales/en/acessibilidade.json";

// Ferramenta de auditoria client-side (axe-core sobre iframes same-origin) — não usa
// Supabase nem camada de dados mock/MSW, por isso não há DTO/serviço/hook/fixtures para
// este módulo. Namespace "acessibilidade" registado em runtime, mesmo padrão autónomo de
// Departamentos.tsx/Estacoes.tsx (o bundle central só regista "common"/"nav").
if (!i18n.hasResourceBundle("pt", "acessibilidade"))
  i18n.addResourceBundle("pt", "acessibilidade", ptAcessibilidade, true, true);
if (!i18n.hasResourceBundle("en", "acessibilidade"))
  i18n.addResourceBundle("en", "acessibilidade", enAcessibilidade, true, true);

/** Rotas auditadas — a chave `labelKey` resolve em `t("routes.<labelKey>")`. */
const ROUTES: { path: string; labelKey: string; group: "public" | "admin" }[] = [
  { path: "/", labelKey: "home", group: "public" },
  { path: "/sobre", labelKey: "about", group: "public" },
  { path: "/servicos", labelKey: "services", group: "public" },
  { path: "/noticias", labelKey: "news", group: "public" },
  { path: "/legislacao", labelKey: "legislation", group: "public" },
  { path: "/contactos", labelKey: "contacts", group: "public" },
  { path: "/admin", labelKey: "panel", group: "admin" },
  { path: "/admin/utilizadores", labelKey: "users", group: "admin" },
  { path: "/admin/laboratorios", labelKey: "laboratories", group: "admin" },
  { path: "/admin/analises", labelKey: "analyses", group: "admin" },
  { path: "/admin/resultados", labelKey: "results", group: "admin" },
  { path: "/admin/lotes", labelKey: "batches", group: "admin" },
  { path: "/admin/planeamento", labelKey: "planning", group: "admin" },
  { path: "/admin/distribuicao", labelKey: "distribution", group: "admin" },
  { path: "/admin/auditorias", labelKey: "audits", group: "admin" },
];

const VIEWPORT_SIZES = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;
type ViewportKey = keyof typeof VIEWPORT_SIZES;

const impactColor: Record<string, string> = {
  critical: "bg-destructive text-white border-transparent shadow-sm",
  serious: "bg-orange-600 text-white border-transparent shadow-sm",
  moderate: "bg-amber-500 text-white border-transparent shadow-sm",
  minor: "bg-muted text-muted-foreground border-border",
};

export default function Acessibilidade() {
  const { t } = useTranslation("acessibilidade");
  const prefersReduced = useReducedMotion();
  const [viewport, setViewport] = useState<ViewportKey>("desktop");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState<string>("");
  const [results, setResults] = useState<RouteAuditResult[]>([]);
  const sandboxRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const summary = useMemo(() => summarise(results), [results]);
  const totalIssues = summary.total;

  const viewportLabel = (key: ViewportKey) => t(`viewport.${key}`, VIEWPORT_SIZES[key]);

  const handleRun = async () => {
    if (!sandboxRef.current) return;
    setRunning(true);
    setResults([]);
    setProgress(0);
    const out: RouteAuditResult[] = [];
    const vp = VIEWPORT_SIZES[viewport];
    for (let i = 0; i < ROUTES.length; i++) {
      const r = ROUTES[i];
      const label = t(`routes.${r.labelKey}`);
      setCurrent(`${label} (${r.path})`);
      try {
        const res = await auditRoute(r.path, label, sandboxRef.current, vp);
        out.push(res);
        setResults([...out]);
      } catch (e) {
        // continue
      }
      setProgress(Math.round(((i + 1) / ROUTES.length) * 100));
    }
    setCurrent("");
    setRunning(false);
    toast({
      title: t("toast.completedTitle"),
      description: t("toast.completedDescription", { count: ROUTES.length, viewport: viewportLabel(viewport) }),
    });
  };

  const exportPDF = async () => {
    if (results.length === 0) {
      toast({
        title: t("toast.noResultsTitle"),
        description: t("toast.noResultsDescription"),
        variant: "destructive",
      });
      return;
    }
    const doc = new jsPDF();
    await ensurePdfFonts(doc);
    doc.setFontSize(18); doc.setFont(PDF_HEADING_FONT, "bold");
    doc.text(t("pdf.title"), 105, 20, { align: "center" });
    doc.setFontSize(11); doc.setFont(PDF_BODY_FONT, "normal");
    doc.text(t("pdf.viewportLabel", { viewport: viewportLabel(viewport) }), 105, 28, { align: "center" });
    doc.text(t("pdf.generatedAt", { date: new Date().toLocaleString("pt-AO") }), 105, 34, { align: "center" });
    doc.setDrawColor(34, 87, 55); doc.setLineWidth(0.5); doc.line(20, 38, 190, 38);

    autoTable(doc, {
      startY: 44,
      head: [[t("pdf.summaryTable.indicator"), t("pdf.summaryTable.value")]],
      body: [
        [t("pdf.summaryTable.totalOccurrences"), String(summary.total)],
        [t("pdf.summaryTable.contrast"), String(summary.contraste)],
        [t("pdf.summaryTable.sizes"), String(summary.tamanho)],
        [t("pdf.summaryTable.other"), String(summary.outro)],
        [t("pdf.summaryTable.critical"), String(summary.critical)],
        [t("pdf.summaryTable.serious"), String(summary.serious)],
        [t("pdf.summaryTable.moderate"), String(summary.moderate)],
        [t("pdf.summaryTable.minor"), String(summary.minor)],
      ],
      theme: "grid",
      headStyles: { fillColor: [34, 87, 55], font: PDF_HEADING_FONT, fontStyle: "bold" },
      styles: { fontSize: 10, font: PDF_BODY_FONT },
    });

    let y = (doc as any).lastAutoTable?.finalY ?? 80;
    for (const r of results) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setFont(PDF_HEADING_FONT, "bold");
      doc.text(`${r.label} — ${r.path}`, 20, y + 10);
      doc.setFontSize(9); doc.setFont(PDF_BODY_FONT, "normal");
      doc.setTextColor(110);
      doc.text(
        r.error
          ? t("pdf.routeError", { error: r.error })
          : t("pdf.routeSummary", {
              violations: r.violations.length,
              pass: r.passCount,
              incomplete: r.incompleteCount,
              duration: r.durationMs,
            }),
        20, y + 15,
      );
      doc.setTextColor(0);

      const rows = r.violations.map((v) => [
        v.id,
        v.impact ?? "—",
        v.category,
        `${v.nodes.length}`,
        v.help.slice(0, 70),
      ]);
      if (rows.length > 0) {
        autoTable(doc, {
          startY: y + 18,
          head: [[
            t("pdf.violationsTable.rule"),
            t("pdf.violationsTable.impact"),
            t("pdf.violationsTable.category"),
            t("pdf.violationsTable.nodes"),
            t("pdf.violationsTable.description"),
          ]],
          body: rows,
          theme: "striped",
          headStyles: { fillColor: [34, 87, 55], font: PDF_HEADING_FONT, fontStyle: "bold" },
          styles: { fontSize: 8, font: PDF_BODY_FONT, cellPadding: 1.5 },
          columnStyles: { 4: { cellWidth: 80 } },
        });
        y = (doc as any).lastAutoTable?.finalY ?? y + 20;
      } else {
        y += 20;
      }
    }

    doc.setFontSize(8); doc.setTextColor(128);
    doc.text(t("pdf.footer"), 105, 287, { align: "center" });
    doc.save(`${t("pdf.filenamePrefix")}-${viewport}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={ShieldCheck} title={t("page.title")} description={t("page.description")}>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={viewport} onValueChange={(v: ViewportKey) => setViewport(v)} disabled={running}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop">{viewportLabel("desktop")}</SelectItem>
              <SelectItem value="mobile">{viewportLabel("mobile")}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRun} disabled={running}>
            {running ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? t("actions.running") : t("actions.run")}
          </Button>
          <Button variant="outline" onClick={exportPDF} disabled={results.length === 0 || running}>
            <FileDown className="mr-2 h-4 w-4" /> {t("actions.exportPdf")}
          </Button>
        </div>
      </AdminPageHeader>

      {running && (
        <AdminCard className="border-primary/25">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-green-soft text-primary-foreground shadow-md">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium truncate">
                  {t("progress.analyzing", { current: current || t("progress.analyzingFallback") })}
                </span>
                <span className="shrink-0 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </AdminCard>
      )}

      <motion.div
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
        variants={staggerContainer}
        initial={prefersReduced ? false : "hidden"}
        animate="visible"
      >
        <motion.div variants={fadeInUp}>
          <AdminCard
            variant="gradient-green-gold"
            icon={ListChecks}
            metric={totalIssues}
            title={t("kpi.totalIssues.title")}
            caption={t("kpi.totalIssues.caption", { scanned: results.length, total: ROUTES.length })}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <AdminCard
            variant="glass"
            icon={Contrast}
            metric={summary.contraste}
            title={t("kpi.contrast.title")}
            caption={t("kpi.contrast.caption")}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <AdminCard
            variant="glass"
            icon={Ruler}
            metric={summary.tamanho}
            title={t("kpi.sizes.title")}
            caption={t("kpi.sizes.caption")}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <AdminCard
            variant="gradient-gold"
            icon={AlertTriangle}
            metric={summary.critical + summary.serious}
            title={t("kpi.criticalSerious.title")}
            caption={t("kpi.criticalSerious.caption", { critical: summary.critical })}
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={prefersReduced ? false : "hidden"}
        animate="visible"
        variants={fadeInUp}
      >
        <AdminCard
          title={t("results.title")}
          icon={ShieldCheck}
          isEmpty={results.length === 0 && !running}
          emptyMessage={t("results.empty")}
        >
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">{t("results.tabs.all", { count: totalIssues })}</TabsTrigger>
              <TabsTrigger value="contraste">
                <Contrast className="mr-1.5 h-3.5 w-3.5" /> {t("results.tabs.contrast", { count: summary.contraste })}
              </TabsTrigger>
              <TabsTrigger value="tamanho">
                <Ruler className="mr-1.5 h-3.5 w-3.5" /> {t("results.tabs.sizes", { count: summary.tamanho })}
              </TabsTrigger>
            </TabsList>

            {(["all", "contraste", "tamanho"] as const).map((tab) => (
              <TabsContent value={tab} key={tab} className="mt-4">
                <Accordion type="multiple" className="space-y-2">
                  {results.map((r) => {
                    const filtered = tab === "all"
                      ? r.violations
                      : r.violations.filter((v) => v.category === tab);
                    const count = filtered.reduce((s, v) => s + (v.nodes.length || 1), 0);
                    return (
                      <AccordionItem
                        key={r.path}
                        value={r.path}
                        className="border border-border/60 rounded-xl px-3 bg-card/40 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex flex-1 items-center justify-between gap-3 pr-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {r.error ? (
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive text-white shadow-sm">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                </span>
                              ) : count === 0 ? (
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg gradient-green-soft text-primary-foreground shadow-sm">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </span>
                              ) : (
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                </span>
                              )}
                              <div className="text-left min-w-0">
                                <p className="text-sm font-medium truncate">{r.label}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{r.path}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {r.error && <Badge variant="destructive" className="text-[10px]">{t("results.errorBadge")}</Badge>}
                              <Badge variant="outline" className="text-[10px]">{t("results.occurrenceCount", { count })}</Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                          {r.error ? (
                            <p className="text-sm text-destructive">{r.error}</p>
                          ) : filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t("results.noOccurrences")}</p>
                          ) : (
                            <div className="space-y-3">
                              {filtered.map((v) => (
                                <div key={v.id} className="rounded-xl border border-border/60 p-3 bg-background/40 shadow-sm hover:shadow-md transition-all duration-300">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold font-serif">{v.help}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        <code className="text-[11px]">{v.id}</code> · {v.description}
                                      </p>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] shrink-0 ${impactColor[v.impact ?? "minor"]}`}
                                    >
                                      {v.impact ?? "—"}
                                    </Badge>
                                  </div>
                                  <ul className="mt-2 space-y-1.5">
                                    {v.nodes.map((n, i) => (
                                      <li key={i} className="text-[11px] bg-muted/40 rounded p-2 font-mono break-all">
                                        <span className="text-muted-foreground">{n.target}</span>
                                        {n.failureSummary && (
                                          <div className="mt-1 font-sans text-muted-foreground">{n.failureSummary}</div>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                  <a
                                    href={v.helpUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-block mt-2 text-[11px] text-primary hover:underline"
                                  >
                                    {t("results.viewRuleGuide")}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>
        </AdminCard>
      </motion.div>

      {/* Hidden iframe sandbox where routes are loaded for scanning */}
      <div ref={sandboxRef} aria-hidden="true" className="sr-only" />
    </div>
  );
}
