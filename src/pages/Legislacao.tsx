import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Download, Search, FileText } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLegislacaoList } from "@/hooks/queries/useLegislacao";
import { LEGISLACAO_TIPOS } from "@/types/dto/legislacao";
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

      <section className="py-10 border-b border-border/40 bg-accent/20">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            <Tabs value={tipo} onValueChange={setTipo}>
              <TabsList className="bg-transparent p-0 gap-2 flex-wrap h-auto">
                {tipos.map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {tipoLabels[t] ?? t}
                  </TabsTrigger>
                ))}
              </TabsList>
              {/* TabsContent vazio por valor: o filtro renderiza a lista fora do Tabs,
                  mas o TabsTrigger do Radix aponta aria-controls para um painel deste
                  id — sem ele, o atributo fica orfão (WCAG aria-valid-attr-value). */}
              {tipos.map((t) => (
                <TabsContent key={t} value={t} className="hidden" />
              ))}
            </Tabs>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search.placeholder")}
                className="pl-9 h-11 rounded-xl"
              />
            </div>
          </div>
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
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">{t("list.empty")}</p>
            </div>
          ) : (
            <motion.ul
              variants={shouldReduceMotion ? undefined : staggerContainer}
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView={shouldReduceMotion ? undefined : "visible"}
              viewport={{ once: true, margin: "-80px" }}
            >
              {filtered.map((l) => (
                <motion.li
                  key={l.id}
                  variants={shouldReduceMotion ? undefined : fadeInUp}
                  className="grid grid-cols-12 gap-6 items-center py-8 border-b border-border/40 first:border-t group hover:bg-accent/20 transition-colors -mx-4 px-4 rounded-xl"
                >
                  <div className="col-span-2">
                    <Link to={`/legislacao/${l.slug}`} className="block">
                      {/* text-primary/60 (light) e /85 (dark) em vez de /30: a /30 só atinge
                          1.63:1 mesmo sendo texto grande (mínimo exigido 3:1). --primary muda
                          de tom entre temas, por isso precisa de opacidades distintas para
                          ambos atingirem >= 3:1 (/60 ~3.0:1 claro, /85 ~3.4:1 escuro). */}
                      <p className="font-serif text-4xl md:text-5xl text-primary/60 dark:text-primary/85 group-hover:text-[hsl(var(--iiv-gold-text))] tracking-tight transition-colors">
                        {l.num}
                      </p>
                    </Link>
                  </div>
                  <div className="col-span-10 md:col-span-7">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="kicker text-[hsl(var(--iiv-gold-text))]">{tipoLabels[l.tipo] ?? l.tipo}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{l.ano}</span>
                    </div>
                    <Link to={`/legislacao/${l.slug}`}>
                      <h3 className="font-serif text-xl md:text-2xl leading-tight hover:text-primary transition-colors">
                        {l.titulo}
                      </h3>
                    </Link>
                    {l.descricao && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{l.descricao}</p>
                    )}
                  </div>
                  <div className="col-span-12 md:col-span-3 md:text-right flex md:justify-end gap-4">
                    <Link
                      to={`/legislacao/${l.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
                    >
                      {t("list.viewDetails")}
                    </Link>
                    {l.pdfUrl && (
                      <a
                        href={l.pdfUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${t("list.download")} — ${l.titulo}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--iiv-gold-text))] hover:gap-3 transition-all"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </section>
    </>
  );
}
