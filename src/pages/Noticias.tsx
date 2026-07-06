import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
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
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";
import heroLab from "@/assets/hero/hero-lab.jpg";
import heroVacinas from "@/assets/hero/hero-vacinas.jpg";

// Namespace "noticias" partilhado por Noticias.tsx e NoticiaDetalhe.tsx. Registado aqui
// via addResourceBundle (em vez de em src/i18n/index.ts, que não deve ser editado nesta tarefa).
i18n.addResourceBundle("pt", "noticias", ptNoticias, true, false);
i18n.addResourceBundle("en", "noticias", enNoticias, true, false);

/** Sentinela interno do filtro "sem categoria seleccionada" — não é um valor de dados. */
const ALL_CATEGORY = "__all__";

/** Imagens de recurso quando a notícia não tem `image_path` resolúvel (sem storage real ainda). */
const fallbackImages = [heroVacinas, heroInvestigacao, heroLab];
const imageUrl = (path: string | null, i: number) => path || fallbackImages[i % fallbackImages.length];

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
        image={heroInvestigacao}
        breadcrumb={[{ label: t("list.hero.breadcrumb") }]}
      />

      <section className="py-10 border-b border-border/40">
        <div className="container">
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "relative rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  cat === c ? "text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {cat === c && (
                  <motion.span
                    layoutId="noticias-cat-indicator"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{c === ALL_CATEGORY ? t("list.filters.all") : c}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container space-y-16">
          {isLoading ? (
            <div className="grid gap-10 lg:grid-cols-12">
              <Skeleton className="lg:col-span-7 aspect-[16/10] rounded-2xl" />
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
                  <Link to={`/noticias/${destaque.slug}`} className="group grid gap-10 lg:grid-cols-12 items-center">
                    <div className="lg:col-span-7 overflow-hidden rounded-2xl">
                      <img
                        src={imageUrl(destaque.image_path, 0)}
                        alt={destaque.titulo}
                        className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="lg:col-span-5">
                      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-4">
                        <span className="text-[hsl(var(--iiv-gold))]">{destaque.categoria}</span>
                        <span className="h-px w-4 bg-border" />
                        <time>{fmt(destaque.published_at ?? destaque.created_at)}</time>
                      </div>
                      <h2 className="font-serif text-3xl md:text-4xl leading-tight group-hover:text-primary transition-colors">
                        {destaque.titulo}
                      </h2>
                      {destaque.resumo && <p className="mt-5 text-muted-foreground leading-relaxed">{destaque.resumo}</p>}
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        {t("list.state.readMore")} <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )}

              {restantes.length > 0 && (
                <motion.div
                  className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 border-t border-border/40 pt-16"
                  initial={shouldReduceMotion ? undefined : "hidden"}
                  whileInView={shouldReduceMotion ? undefined : "visible"}
                  viewport={{ once: true, amount: 0.15 }}
                  variants={shouldReduceMotion ? undefined : staggerContainer}
                >
                  {restantes.map((n, i) => (
                    <motion.div key={n.id} variants={shouldReduceMotion ? undefined : fadeInUp}>
                      <Link to={`/noticias/${n.slug}`} className="group">
                        <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted mb-5">
                          <img
                            src={imageUrl(n.image_path, i + 1)}
                            alt={n.titulo}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                          <span className="text-[hsl(var(--iiv-gold))]">{n.categoria}</span>
                          <span className="h-px w-4 bg-border" />
                          <time>{fmt(n.published_at ?? n.created_at)}</time>
                        </div>
                        <h3 className="font-serif text-xl leading-tight group-hover:text-primary transition-colors">{n.titulo}</h3>
                        {n.resumo && <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{n.resumo}</p>}
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
