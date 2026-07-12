import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeInUp } from "@/lib/motion";
import { useNoticia } from "@/hooks/queries/useNoticias";
import i18n from "@/i18n";
import ptNoticias from "@/i18n/locales/pt/public/noticias.json";
import enNoticias from "@/i18n/locales/en/public/noticias.json";
import noticiasFallbackCard from "@/assets/noticias/noticias-fallback-card-sm.webp";

// Namespace "noticias" partilhado por Noticias.tsx e NoticiaDetalhe.tsx. Registado aqui
// via addResourceBundle (em vez de em src/i18n/index.ts, que não deve ser editado nesta tarefa).
i18n.addResourceBundle("pt", "noticias", ptNoticias, true, false);
i18n.addResourceBundle("en", "noticias", enNoticias, true, false);

function fmt(d: string) {
  return new Date(d).toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });
}

const imageUrl = (path: string | null) => path || noticiasFallbackCard;

export default function NoticiaDetalhe() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation("noticias");
  const shouldReduceMotion = useReducedMotion();

  // useNoticia(id) chama GET /api/noticias/:id — o handler mock (src/mocks/handlers/noticias.ts)
  // já resolve tanto por `id` como por `slug` (`n.id === id || n.slug === id`), pelo que reutilizamos
  // o hook existente directamente com o slug, sem necessidade de alterar service/handler partilhados.
  const { data: item, isLoading, isError } = useNoticia(slug ?? "");

  // O endpoint de detalhe não filtra por `published` (ao contrário da antiga query Supabase), por
  // isso aplicamos aqui a mesma regra de visibilidade pública: notícia não publicada = não encontrada.
  const notFound = !isLoading && (isError || !item || !item.published);

  if (isLoading) {
    return (
      <div className="container py-20 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="container py-32 text-center">
        <SEO
          title={t("detail.seo.notFoundTitle")}
          description={t("detail.seo.notFoundDescription")}
          path={`/noticias/${slug ?? ""}`}
        />
        <h1 className="font-serif text-3xl mb-4">{t("detail.notFound.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("detail.notFound.message")}</p>
        <Link to="/noticias" className="inline-flex items-center gap-2 text-primary font-semibold">
          <ArrowLeft className="h-4 w-4" /> {t("detail.notFound.back")}
        </Link>
      </div>
    );
  }

  const paragrafos = (item.conteudo ?? "").split(/\n\s*\n/).filter(Boolean);

  return (
    <>
      <SEO
        title={item.titulo}
        description={item.resumo ?? t("detail.seo.fallbackDescription", { date: fmt(item.published_at ?? item.created_at) })}
        path={`/noticias/${item.slug}`}
        type="article"
        image={item.image_path ? imageUrl(item.image_path) : undefined}
      />

      <motion.article
        className="pt-16 pb-24"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate={shouldReduceMotion ? undefined : "visible"}
        variants={shouldReduceMotion ? undefined : fadeInUp}
      >
        <div className="container max-w-4xl">
          <Link to="/noticias" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> {t("detail.back")}
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center rounded-full bg-[hsl(var(--iiv-gold-light))] dark:bg-accent px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-[hsl(var(--iiv-gold-text))]">
              {item.categoria}
            </span>
            <time className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{fmt(item.published_at ?? item.created_at)}</time>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-6">{item.titulo}</h1>
          {item.resumo && <p className="text-xl text-muted-foreground leading-relaxed mb-10">{item.resumo}</p>}

          <div className="aspect-[16/9] overflow-hidden rounded-2xl mb-12 bg-muted">
            <img src={imageUrl(item.image_path)} alt={item.titulo} className="h-full w-full object-cover" />
          </div>

          {paragrafos.length > 0 ? (
            <div className="prose prose-lg max-w-none">
              {paragrafos.map((p, i) => (
                <p key={i} className="text-foreground/90 leading-relaxed mb-6 whitespace-pre-wrap">{p}</p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">{t("detail.empty")}</p>
          )}
        </div>
      </motion.article>
    </>
  );
}
