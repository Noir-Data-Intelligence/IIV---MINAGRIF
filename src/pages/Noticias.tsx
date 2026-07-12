import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  LayoutGrid,
  Newspaper,
  Megaphone,
  FlaskConical,
  ShieldCheck,
  GraduationCap,
  Landmark,
  BookOpen,
  Microscope,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useNoticiasList } from "@/hooks/queries/useNoticias";
import i18n from "@/i18n";
import ptNoticias from "@/i18n/locales/pt/public/noticias.json";
import enNoticias from "@/i18n/locales/en/public/noticias.json";
import noticiasHeroNewsroom from "@/assets/noticias/noticias-hero-newsroom.webp";
import noticiasFallbackCard from "@/assets/noticias/noticias-fallback-card-sm.webp";
import heroScientistVaccine from "@/assets/hero/hero-scientist-vaccine.webp";

// Namespace "noticias" partilhado por Noticias.tsx e NoticiaDetalhe.tsx. Registado aqui
// via addResourceBundle (em vez de em src/i18n/index.ts, que não deve ser editado nesta tarefa).
i18n.addResourceBundle("pt", "noticias", ptNoticias, true, false);
i18n.addResourceBundle("en", "noticias", enNoticias, true, false);

/** Sentinela interno do filtro "sem categoria seleccionada" — não é um valor de dados. */
const ALL_CATEGORY = "__all__";

/** Imagens de recurso quando a notícia não tem `image_path` resolúvel (sem storage real ainda). */
const fallbackImages = [noticiasFallbackCard, heroScientistVaccine, noticiasFallbackCard];
const imageUrl = (path: string | null, i: number) => path || fallbackImages[i % fallbackImages.length];

/** Ícones decorativos por categoria — pool cíclico, escolhido de forma determinística
 *  a partir do texto da categoria (mesma categoria = sempre o mesmo ícone). Puramente
 *  visual: não depende nem altera os dados/categorias vindos da API. */
const categoryIconPool = [Newspaper, Megaphone, FlaskConical, ShieldCheck, GraduationCap, Landmark, BookOpen, Microscope];
function categoryIcon(cat: string) {
  if (cat === ALL_CATEGORY) return LayoutGrid;
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = (hash * 31 + cat.charCodeAt(i)) >>> 0;
  return categoryIconPool[hash % categoryIconPool.length];
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });
}

export default function Noticias() {
  const { t } = useTranslation("noticias");
  const shouldReduceMotion = useReducedMotion();
  const [cat, setCat] = useState<string>(ALL_CATEGORY);

  const { data, isLoading } = useNoticiasList({ page: 1, perPage: 50, published: true });
  const items = useMemo(() => data?.data ?? [], [data]);

  const categorias = useMemo(
    () => [ALL_CATEGORY, ...Array.from(new Set(items.map((n) => n.categoria)))],
    [items],
  );
  const filtered = cat === ALL_CATEGORY ? items : items.filter((n) => n.categoria === cat);
  const destaque = filtered[0];
  const restantes = filtered.slice(1);

  return (
    <>
      <SEO title={t("list.seo.title")} description={t("list.seo.description")} path="/noticias" />
      <PageHero
        kicker={t("list.hero.kicker")}
        title={t("list.hero.title")}
        lead={t("list.hero.lead")}
        image={noticiasHeroNewsroom}
        breadcrumb={[{ label: t("list.hero.breadcrumb") }]}
      />

      <section className="py-10 border-b border-border/40 bg-accent/10">
        <div className="container">
          <div className="flex flex-wrap items-center gap-2.5">
            {categorias.map((c) => {
              const Icon = categoryIcon(c);
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                    cat === c ? "text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent",
                  )}
                >
                  {cat === c && (
                    <motion.span
                      layoutId="noticias-cat-indicator"
                      className="absolute inset-0 rounded-full bg-primary shadow-md"
                      transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="relative h-3.5 w-3.5" strokeWidth={2} />
                  <span className="relative">{c === ALL_CATEGORY ? t("list.filters.all") : c}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container space-y-16">
          {isLoading ? (
            <div className="grid gap-10 lg:grid-cols-12">
              <Skeleton className="lg:col-span-7 aspect-[16/10] rounded-3xl" />
              <div className="lg:col-span-5 space-y-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">{t("list.state.empty")}</p>
          ) : (
            <>
              {destaque && (
                <motion.div
                  initial={shouldReduceMotion ? undefined : "hidden"}
                  whileInView={shouldReduceMotion ? undefined : "visible"}
                  viewport={{ once: true, amount: 0.2 }}
                  variants={shouldReduceMotion ? undefined : fadeInUp}
                >
                  <Link
                    to={`/noticias/${destaque.slug}`}
                    className="group relative block overflow-hidden rounded-3xl shadow-elevated hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9] w-full overflow-hidden bg-muted">
                      <img
                        src={imageUrl(destaque.image_path, 0)}
                        alt={destaque.titulo}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--iiv-green-dark))] via-[hsl(var(--iiv-green-dark))]/55 to-transparent" />

                      <span className="absolute top-6 left-6 inline-flex items-center gap-1.5 rounded-full gradient-gold px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-secondary-foreground shadow-lg">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} /> {t("list.state.featured", "Destaque")}
                      </span>

                      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-14 text-primary-foreground">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest">
                            {destaque.categoria}
                          </span>
                          <span className="h-px w-4 bg-white/40" />
                          <time className="text-xs opacity-80">{fmt(destaque.published_at ?? destaque.created_at)}</time>
                        </div>
                        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight max-w-3xl">
                          {destaque.titulo}
                        </h2>
                        {destaque.resumo && (
                          <p className="mt-4 max-w-2xl text-sm md:text-base opacity-85 leading-relaxed line-clamp-2">
                            {destaque.resumo}
                          </p>
                        )}
                        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all">
                          {t("list.state.readMore")} <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {restantes.length > 0 && (
                <div className="border-t border-border/40 pt-16">
                  <div className="mb-10">
                    <p className="kicker text-[hsl(var(--iiv-gold-text))]">
                      <span className="editorial-rule mr-3" /> {t("list.state.moreNews", "Mais notícias")}
                    </p>
                  </div>

                  <motion.div
                    className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                    initial={shouldReduceMotion ? undefined : "hidden"}
                    whileInView={shouldReduceMotion ? undefined : "visible"}
                    viewport={{ once: true, amount: 0.15 }}
                    variants={shouldReduceMotion ? undefined : staggerContainer}
                  >
                    {restantes.map((n, i) => {
                      const Icon = categoryIcon(n.categoria);
                      return (
                        <motion.div key={n.id} variants={shouldReduceMotion ? undefined : fadeInUp}>
                          <Link
                            to={`/noticias/${n.slug}`}
                            className="group block rounded-3xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                          >
                            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                              <img
                                src={imageUrl(n.image_path, i + 1)}
                                alt={n.titulo}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--iiv-green-dark))]/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="absolute -bottom-5 right-5 flex h-10 w-10 items-center justify-center rounded-xl gradient-gold text-secondary-foreground shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                                <Icon className="h-4 w-4" strokeWidth={1.75} />
                              </div>
                            </div>
                            <div className="p-5 pt-7">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="inline-flex items-center rounded-full bg-[hsl(var(--iiv-gold-light))] dark:bg-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--iiv-gold-text))]">
                                  {n.categoria}
                                </span>
                                <time className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                  {fmt(n.published_at ?? n.created_at)}
                                </time>
                              </div>
                              <h3 className="font-serif text-xl leading-tight group-hover:text-primary transition-colors">
                                {n.titulo}
                              </h3>
                              {n.resumo && (
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{n.resumo}</p>
                              )}
                              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                {t("list.state.readMore")} <ArrowUpRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
