import { useParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, ArrowLeft } from "lucide-react";
import { useLegislacaoDetail } from "@/hooks/queries/useLegislacao";
import { fadeInUp } from "@/lib/motion";
import i18n from "@/i18n";
import ptLegislacao from "@/i18n/locales/pt/public/legislacao.json";
import enLegislacao from "@/i18n/locales/en/public/legislacao.json";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";

// Namespace "legislacao" partilhado com Legislacao.tsx — registo idempotente
// via hasResourceBundle, seguro de repetir aqui.
if (!i18n.hasResourceBundle("pt", "legislacao")) i18n.addResourceBundle("pt", "legislacao", ptLegislacao, true, true);
if (!i18n.hasResourceBundle("en", "legislacao")) i18n.addResourceBundle("en", "legislacao", enLegislacao, true, true);

export default function LegislacaoDetalhe() {
  const { t } = useTranslation("legislacao");
  const { slug } = useParams<{ slug: string }>();
  const shouldReduceMotion = useReducedMotion();
  const { data: item, isLoading: loading } = useLegislacaoDetail(slug);
  const notFound = !loading && !item;

  if (loading) {
    return (
      <div className="container py-20 space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="container py-32 text-center">
        <h1 className="font-serif text-3xl mb-4">{t("detail.notFound.title")}</h1>
        <Button asChild variant="outline">
          <Link to="/legislacao">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("detail.notFound.back")}
          </Link>
        </Button>
      </div>
    );
  }

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
        image={heroInvestigacao}
        breadcrumb={[{ label: t("hero.breadcrumb"), href: "/legislacao" }, { label: item.num }]}
      />

      <motion.div
        variants={shouldReduceMotion ? undefined : fadeInUp}
        initial={shouldReduceMotion ? false : "hidden"}
        animate={shouldReduceMotion ? undefined : "visible"}
      >
        <section className="py-12 border-b border-border/40">
          <div className="container max-w-5xl flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">{t("detail.numberPrefix")} {item.num}</span>
              <span>•</span>
              <span className="kicker text-[hsl(var(--iiv-gold))]">{item.tipo}</span>
              <span>•</span>
              <span>{item.ano}</span>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/legislacao">
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t("detail.back")}
                </Link>
              </Button>
              {item.pdfUrl && (
                <Button asChild>
                  <a href={item.pdfUrl} download target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" /> {t("detail.download")}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-5xl">
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
          </div>
        </section>
      </motion.div>
    </>
  );
}
