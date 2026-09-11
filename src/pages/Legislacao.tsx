import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Download, Search, FileText, Scale, Landmark, ShieldCheck, BookOpen, Sparkles, ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLegislacaoList } from "@/hooks/queries/useLegislacao";
import { LEGISLACAO_TIPOS } from "@/types/dto/legislacao";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptLegislacao from "@/i18n/locales/pt/public/legislacao.json";
import enLegislacao from "@/i18n/locales/en/public/legislacao.json";
import legislacaoHeroLaw from "@/assets/legislacao/legislacao-hero-law.webp";

// Namespace "legislacao" não faz parte do bundle central (src/i18n/index.ts,
// que só regista "common"/"nav"). Registamo-lo aqui em runtime para manter
// esta página autónoma sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "legislacao")) i18n.addResourceBundle("pt", "legislacao", ptLegislacao, true, true);
if (!i18n.hasResourceBundle("en", "legislacao")) i18n.addResourceBundle("en", "legislacao", enLegislacao, true, true);

// Ícone por tipo de diploma — puramente decorativo (identidade visual do card),
// não interfere com o filtro nem com os dados vindos da API.
const tipoIcons: Record<string, typeof FileText> = {
  Lei: Scale,
  Decreto: Landmark,
  Regulamento: ShieldCheck,
  Norma: BookOpen,
  Portaria: FileText,
};

export default function Legislacao() {
  const { t } = useTranslation("legislacao");
  const tipoLabels: Record<string, string> = {
    Todos: t("tabs.todos"),
    Lei: t("tabs.tipos.lei"),
    Decreto: t("tabs.tipos.decreto"),
    Regulamento: t("tabs.tipos.regulamento"),
    Norma: t("tabs.tipos.norma"),
    Portaria: t("tabs.tipos.portaria"),
  };
  const tipos = ["Todos", ...LEGISLACAO_TIPOS];
  const [tipo, setTipo] = useState("Todos");
  const [q, setQ] = useState("");
  const shouldReduceMotion = useReducedMotion();

  // Se o utilizador preferir menos movimento, os variants ficam "vazios" (sem transição visível).
  const revealVariants = shouldReduceMotion ? {} : fadeInUp;
  const containerVariants = shouldReduceMotion ? {} : staggerContainer;

  const { data: items = [], isLoading: loading } = useLegislacaoList({ published: true });

  const filtered = useMemo(() => {
    return items.filter((l) => {
      const matchTipo = tipo === "Todos" || l.tipo === tipo;
      const matchQ =
        !q ||
        l.titulo.toLowerCase().includes(q.toLowerCase()) ||
        (l.descricao || "").toLowerCase().includes(q.toLowerCase());
      return matchTipo && matchQ;
    });
  }, [items, tipo, q]);

  // Ano mais recente do conjunto completo (não filtrado) — usado para destacar
  // visualmente os diplomas mais recentes na lista. Puramente apresentacional.
  const anoMaisRecente = useMemo(() => {
    if (items.length === 0) return null;
    return items.reduce((max, l) => (l.ano > max ? l.ano : max), items[0].ano);
  }, [items]);

  return (
    <>
      <SEO
        title={t("seo.title")}
        description={t("seo.description")}
        path="/legislacao"
      />
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        lead={t("hero.lead")}
        image={legislacaoHeroLaw}
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />

      {/* FILTRO — cartão com kicker, pesquisa e tabs de tipo com ícone */}
      <section className="py-12 md:py-16 border-b border-border/40 bg-accent/30 overflow-hidden">
        <div className="container">
          <motion.div
            className="border border-border/60 bg-card p-6 md:p-8"
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--iiv-gold-text))]">{t("filter.kicker")}</p>
                  <h2 className="mt-3 font-sans text-xl font-bold uppercase tracking-wide">{t("filter.title")}</h2>
                </div>
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("search.placeholder")}
                    className="pl-10 h-12 rounded-none"
                  />
                </div>
              </div>

              <Tabs value={tipo} onValueChange={setTipo}>
                <TabsList className="bg-transparent p-0 gap-2 flex-wrap h-auto">
                  {tipos.map((tt) => {
                    const Icon = tt === "Todos" ? null : tipoIcons[tt];
                    return (
                      <TabsTrigger
                        key={tt}
                        value={tt}
                        className="gap-1.5 rounded-none border border-border/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all data-[state=active]:border-[hsl(var(--iiv-green-dark))] data-[state=active]:bg-[hsl(var(--iiv-green-dark))] data-[state=active]:text-primary-foreground"
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />}
                        {tipoLabels[tt] ?? tt}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {/* TabsContent vazio por valor: o filtro renderiza a lista fora do Tabs,
                    mas o TabsTrigger do Radix aponta aria-controls para um painel deste
                    id — sem ele, o atributo fica orfão (WCAG aria-valid-attr-value). */}
                {tipos.map((tt) => (
                  <TabsContent key={tt} value={tt} className="hidden" />
                ))}
              </Tabs>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-5xl">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--iiv-gold-light))] dark:bg-accent text-[hsl(var(--iiv-gold-text))]">
                <FileText className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <p className="text-muted-foreground">{t("list.empty")}</p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-muted-foreground">
                {t("list.resultsCount", { count: filtered.length })}
              </p>
              <motion.ul
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
              >
                {filtered.map((l) => {
                  const Icon = tipoIcons[l.tipo] ?? FileText;
                  const isRecent = anoMaisRecente !== null && l.ano === anoMaisRecente;
                  return (
                    <motion.li
                      key={l.id}
                      variants={revealVariants}
                      className={cn(
                        "group grid grid-cols-12 gap-6 items-center border bg-card p-6",
                        isRecent ? "border-[hsl(var(--iiv-gold))]" : "border-border/60",
                      )}
                    >
                      <div className="col-span-2">
                        <Link to={`/legislacao/${l.slug}`} className="flex flex-col items-start gap-2.5">
                          <div className="hidden sm:flex h-9 w-9 items-center justify-center bg-[hsl(var(--iiv-green-dark))] text-primary-foreground">
                            <Icon className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <p className="font-sans text-lg font-bold text-primary group-hover:text-[hsl(var(--iiv-gold-text))] tracking-tight transition-colors">
                            {l.num}
                          </p>
                        </Link>
                      </div>
                      <div className="col-span-10 md:col-span-7">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="inline-flex items-center bg-[hsl(var(--iiv-gold-light))] dark:bg-accent px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-[hsl(var(--iiv-gold-text))]">
                            {tipoLabels[l.tipo] ?? l.tipo}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">{l.ano}</span>
                          {isRecent && (
                            <span className="inline-flex items-center gap-1 bg-[hsl(var(--iiv-gold))] text-secondary-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                              <Sparkles className="h-3 w-3" strokeWidth={1.75} /> {t("list.recentBadge")}
                            </span>
                          )}
                        </div>
                        <Link to={`/legislacao/${l.slug}`}>
                          <h3 className="font-sans text-base font-bold leading-tight hover:underline">
                            {l.titulo}
                          </h3>
                        </Link>
                        {l.descricao && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{l.descricao}</p>
                        )}
                      </div>
                      <div className="col-span-12 md:col-span-3 md:text-right flex md:justify-end items-center gap-4">
                        <Link
                          to={`/legislacao/${l.slug}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
                        >
                          {t("list.viewDetails")} <ArrowUpRight className="h-4 w-4" />
                        </Link>
                        {l.pdfUrl && (
                          <a
                            href={l.pdfUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${t("list.download")} — ${l.titulo}`}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-[hsl(var(--iiv-gold-light))] dark:bg-accent text-[hsl(var(--iiv-gold-text))]"
                          >
                            <Download className="h-4 w-4" strokeWidth={1.75} />
                          </a>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </>
          )}
        </div>
      </section>
    </>
  );
}
