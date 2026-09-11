import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { LABORATORIOS_PUBLICOS } from "@/data/laboratoriosPublicos";
import i18n from "@/i18n";
import ptLaboratorios from "@/i18n/locales/pt/public/laboratorios.json";
import enLaboratorios from "@/i18n/locales/en/public/laboratorios.json";

// Namespace "public-laboratorios" não faz parte do bundle central — registado
// em runtime, seguindo o padrão já usado por todas as páginas públicas.
if (!i18n.hasResourceBundle("pt", "public-laboratorios"))
  i18n.addResourceBundle("pt", "public-laboratorios", ptLaboratorios, true, true);
if (!i18n.hasResourceBundle("en", "public-laboratorios"))
  i18n.addResourceBundle("en", "public-laboratorios", enLaboratorios, true, true);

export default function Laboratorios() {
  const { t } = useTranslation("public-laboratorios");
  const prefersReducedMotion = useReducedMotion();
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;
  const containerVariants = prefersReducedMotion ? {} : staggerContainer;

  return (
    <>
      <SEO title={t("seo.title")} description={t("seo.description")} path="/laboratorios" />
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        lead={t("hero.lead")}
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />

      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {LABORATORIOS_PUBLICOS.map((lab) => {
              const Icon = lab.icon;
              return (
                <motion.div key={lab.slug} variants={revealVariants}>
                  <Link
                    to={`/laboratorios/${lab.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-green-gold text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-6 w-6" strokeWidth={1.75} />
                      </div>
                      {lab.code && (
                        <span className="font-mono text-xs text-muted-foreground">{lab.code}</span>
                      )}
                    </div>
                    <h2 className="font-serif text-xl mt-5 leading-tight group-hover:text-primary transition-colors">
                      {t(`areas.${lab.slug}.name`)}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                      {t(`areas.${lab.slug}.short`)}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                      {t("grid.detailsCta")} <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
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
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gradient-gold text-secondary-foreground hover:opacity-90 h-12 px-7 rounded-xl text-sm font-semibold">
                <Link to="/servicos">
                  {t("cta.servicesLink")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 rounded-xl text-sm font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/contactos">{t("cta.contactLink")}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
