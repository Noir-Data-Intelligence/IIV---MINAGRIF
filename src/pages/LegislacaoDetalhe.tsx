import { useParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, ArrowLeft, CalendarDays, Scale, Landmark, ShieldCheck, BookOpen } from "lucide-react";
import { useLegislacaoDetail } from "@/hooks/queries/useLegislacao";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptLegislacao from "@/i18n/locales/pt/public/legislacao.json";
import enLegislacao from "@/i18n/locales/en/public/legislacao.json";
import legislacaoFallback from "@/assets/legislacao/legislacao-fallback.webp";

// Namespace "legislacao" partilhado com Legislacao.tsx — registo idempotente
// via hasResourceBundle, seguro de repetir aqui.
if (!i18n.hasResourceBundle("pt", "legislacao")) i18n.addResourceBundle("pt", "legislacao", ptLegislacao, true, true);
if (!i18n.hasResourceBundle("en", "legislacao")) i18n.addResourceBundle("en", "legislacao", enLegislacao, true, true);

// Ícone por tipo de diploma — mesma identidade visual usada em Legislacao.tsx
// (duplicado aqui de propósito: cada página mantém-se autónoma, sem depender
// de um módulo partilhado que não está no âmbito desta reconstrução).
const tipoIcons: Record<string, typeof FileText> = {
  Lei: Scale,
  Decreto: Landmark,
  Regulamento: ShieldCheck,
  Norma: BookOpen,
  Portaria: FileText,
};

export default function LegislacaoDetalhe() {
  const { t } = useTranslation("legislacao");
  const { slug } = useParams<{ slug: string }>();
  const shouldReduceMotion = useReducedMotion();
  const { data: item, isLoading: loading } = useLegislacaoDetail(slug);
  const notFound = !loading && !item;

  const revealVariants = shouldReduceMotion ? {} : fadeInUp;
  const containerVariants = shouldReduceMotion ? {} : staggerContainer;

  if (loading) {
    return (
      <div className="container py-20">
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-5 w-1/3 mb-12" />
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Skeleton className="h-80 w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-8">
            <Skeleton className="h-[70vh] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="container py-32 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--iiv-gold-light))] dark:bg-accent text-[hsl(var(--iiv-gold-text))]">
          <FileText className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <h1 className="font-serif text-3xl mb-4">{t("detail.notFound.title")}</h1>
        <Button asChild variant="outline">
          <Link to="/legislacao">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("detail.notFound.back")}
          </Link>
        </Button>
      </div>
    );
  }

  const Icon = tipoIcons[item.tipo] ?? FileText;

  return (
    <>
      <SEO
        title={`${item.num} — ${item.titulo}`}
        description={item.descricao || `${item.tipo} de ${item.ano}: ${item.titulo}`}
        path={`/legislacao/${item.slug}`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Legislation",
          name: item.titulo,
          legislationIdentifier: item.num,
          legislationType: item.tipo,
          datePublished: item.ano,
        }}
      />
      <PageHero
        kicker={`${item.tipo} • ${item.ano}`}
        title={item.titulo}
        lead={item.descricao || undefined}
        image={legislacaoFallback}
        breadcrumb={[
          { label: t("hero.breadcrumb"), href: "/legislacao" },
          { label: item.tipo },
          { label: item.num },
        ]}
      />

      {/* Painel de metadados (cartão lateral) + visualizador do documento */}
      <section className="py-16 md:py-20">
        <div className="container max-w-6xl">
          <motion.div
            className="grid gap-8 lg:grid-cols-12 items-start"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* PAINEL DE METADADOS */}
            <motion.aside variants={revealVariants} className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl p-8">
                <div className="absolute -top-14 -right-14 h-40 w-40 rounded-full bg-[hsl(var(--iiv-gold))]/10 blur-3xl" />

                <div className="relative flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-green-soft text-primary-foreground shadow-lg">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[hsl(var(--iiv-gold-light))] dark:bg-accent px-3 py-1 kicker text-[hsl(var(--iiv-gold-text))]">
                    {item.tipo}
                  </span>
                </div>

                <p className="relative kicker text-muted-foreground">{t("detail.numberPrefix")}</p>
                <p className="relative font-serif text-2xl md:text-3xl text-primary tracking-tight mt-1">{item.num}</p>

                <div className="relative mt-6 flex items-center gap-2 text-sm text-muted-foreground border-t border-border/50 pt-5">
                  <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
                  <span>{item.ano}</span>
                </div>

                {item.descricao && (
                  <p className="relative mt-4 text-sm text-muted-foreground leading-relaxed">{item.descricao}</p>
                )}

                <div className="relative mt-8 flex flex-col gap-3">
                  {item.pdfUrl && (
                    <Button
                      asChild
                      size="lg"
                      className="gradient-gold text-secondary-foreground hover:opacity-90 h-12 rounded-xl text-sm font-semibold shadow-md"
                    >
                      <a href={item.pdfUrl} download target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" /> {t("detail.download")}
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="lg" className="h-12 rounded-xl">
                    <Link to="/legislacao">
                      <ArrowLeft className="mr-2 h-4 w-4" /> {t("detail.back")}
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.aside>

            {/* VISUALIZADOR DO DOCUMENTO */}
            <motion.div variants={revealVariants} className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--iiv-gold-light))] dark:bg-accent text-[hsl(var(--iiv-gold-text))]">
                  <FileText className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <p className="kicker text-muted-foreground">{t("detail.documentLabel")}</p>
              </div>

              {item.pdfUrl ? (
                <div className="rounded-2xl border border-border/60 overflow-hidden shadow-elegant bg-card">
                  <iframe
                    src={`${item.pdfUrl}#view=FitH`}
                    title={item.titulo}
                    className="w-full h-[80vh]"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("detail.pdfUnavailable")}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
