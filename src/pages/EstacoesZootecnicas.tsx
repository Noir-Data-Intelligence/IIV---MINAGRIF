import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Sprout } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptEstacoes from "@/i18n/locales/pt/public/estacoesZootecnicas.json";
import enEstacoes from "@/i18n/locales/en/public/estacoesZootecnicas.json";

if (!i18n.hasResourceBundle("pt", "estacoes-zootecnicas"))
  i18n.addResourceBundle("pt", "estacoes-zootecnicas", ptEstacoes, true, true);
if (!i18n.hasResourceBundle("en", "estacoes-zootecnicas"))
  i18n.addResourceBundle("en", "estacoes-zootecnicas", enEstacoes, true, true);

interface StationItem {
  title: string;
  focus: string;
  status: string;
}

export default function EstacoesZootecnicas() {
  const { t } = useTranslation("estacoes-zootecnicas");
  const prefersReducedMotion = useReducedMotion();
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;
  const containerVariants = prefersReducedMotion ? {} : staggerContainer;

  const stations = t("stations.items", { returnObjects: true }) as unknown as StationItem[];

  return (
    <>
      <SEO title={t("seo.title")} description={t("seo.description")} path="/sobre/estacoes-zootecnicas" />
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        lead={t("hero.lead")}
        breadcrumb={[{ label: "Sobre", href: "/sobre" }, { label: t("hero.breadcrumb") }]}
      />

      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            className="max-w-3xl"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.div variants={revealVariants}>
              <p className="kicker text-[hsl(var(--iiv-gold-text))]">
                <span className="editorial-rule mr-3" /> {t("intro.kicker")}
              </p>
              <h2 className="font-serif text-3xl md:text-4xl mt-6 leading-[1.05] tracking-tight">
                {t("intro.title")}
              </h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">{t("intro.text")}</p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-16"
          >
            <motion.h3 variants={revealVariants} className="font-serif text-2xl mb-8">
              {t("stations.heading")}
            </motion.h3>
            <div className="grid gap-6 sm:grid-cols-3">
              {stations.map((station) => (
                <motion.div
                  key={station.title}
                  variants={revealVariants}
                  className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-green-gold text-primary-foreground shadow-md">
                    <Sprout className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h4 className="font-serif text-lg mt-5">{station.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{station.focus}</p>
                  <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
                    <MapPin className="h-3.5 w-3.5" /> {station.status}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="mt-16 relative overflow-hidden rounded-3xl gradient-green text-primary-foreground p-10 md:p-14 text-center shadow-xl"
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[hsl(var(--iiv-gold))]/15 blur-3xl" />
            <h2 className="relative font-serif text-3xl md:text-4xl leading-tight">{t("cta.title")}</h2>
            <p className="relative mt-3 opacity-80 max-w-xl mx-auto">{t("cta.lead")}</p>
            <Button asChild size="lg" className="relative mt-7 gradient-gold text-secondary-foreground hover:opacity-90 h-12 px-7 rounded-xl text-sm font-semibold">
              <Link to="/contactos">
                {t("cta.link")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
