import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Quote,
  Mail,
  MessageCircle,
  Link2,
  Check,
  Newspaper,
  Megaphone,
  FlaskConical,
  ShieldCheck,
  GraduationCap,
  Landmark,
  BookOpen,
  Microscope,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

/** Ícone decorativo por categoria — mesmo pool/lógica usado em Noticias.tsx, duplicado
 *  aqui (ficheiro independente) por ser puramente visual e não fazer parte da lógica de
 *  dados partilhada. Mesma categoria = sempre o mesmo ícone. */
const categoryIconPool = [Newspaper, Megaphone, FlaskConical, ShieldCheck, GraduationCap, Landmark, BookOpen, Microscope];
function categoryIcon(cat: string) {
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = (hash * 31 + cat.charCodeAt(i)) >>> 0;
  return categoryIconPool[hash % categoryIconPool.length];
}

export default function NoticiaDetalhe() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation("noticias");
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

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
        <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
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
  const wordCount = (item.conteudo ?? "").trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));
  const CategoryIcon = categoryIcon(item.categoria);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  function shareWhatsapp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${item.titulo} — ${shareUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareMail() {
    window.location.href = `mailto:?subject=${encodeURIComponent(item.titulo)}&body=${encodeURIComponent(shareUrl)}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível (permissões/contexto não-seguro) — falha silenciosamente,
      // não é uma acção crítica.
    }
  }

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
          <Link
            to="/noticias"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {t("detail.back")}
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--iiv-gold-light))] dark:bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-[hsl(var(--iiv-gold-text))]">
              <CategoryIcon className="h-3.5 w-3.5" strokeWidth={2} /> {item.categoria}
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.08] tracking-tight mb-8 max-w-3xl">
            {item.titulo}
          </h1>

          {/* Metadata + partilha — mais presença visual que a simples linha de texto anterior */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-10 pb-8 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-green-soft text-primary-foreground shadow-sm">
                <Calendar className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <time className="text-xs font-medium text-muted-foreground">{fmt(item.published_at ?? item.created_at)}</time>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-green-soft text-primary-foreground shadow-sm">
                <Clock className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {t("detail.readingTime", `${readingTime} min de leitura`)}
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="hidden sm:inline text-xs font-medium text-muted-foreground mr-1">
                {t("detail.share", "Partilhar")}
              </span>
              <button
                type="button"
                onClick={shareWhatsapp}
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={shareMail}
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={copyLink}
                aria-label={t("detail.copyLink", "Copiar ligação")}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-primary" strokeWidth={2} /> : <Link2 className="h-4 w-4" strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          {item.resumo && (
            <div className="relative mb-12 rounded-2xl bg-accent/30 border border-border/50 p-6 md:p-8 pt-8 md:pt-9">
              <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-lg gradient-gold text-secondary-foreground shadow-md">
                <Quote className="h-4 w-4" strokeWidth={2} />
              </div>
              <p className="font-serif text-lg md:text-xl italic text-foreground/90 leading-relaxed">{item.resumo}</p>
            </div>
          )}

          <div className="aspect-[16/9] overflow-hidden rounded-3xl mb-12 bg-muted shadow-elevated">
            <img src={imageUrl(item.image_path)} alt={item.titulo} className="h-full w-full object-cover" />
          </div>

          {paragrafos.length > 0 ? (
            <div className="max-w-none space-y-6">
              {paragrafos.map((p, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-foreground/90 leading-relaxed whitespace-pre-wrap",
                    i === 0 ? "text-lg md:text-xl font-light" : "text-base",
                  )}
                >
                  {p}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">{t("detail.empty")}</p>
          )}

          <div className="mt-16 pt-10 border-t border-border/50">
            <Link
              to="/noticias"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> {t("detail.back")}
            </Link>
          </div>
        </div>
      </motion.article>
    </>
  );
}
