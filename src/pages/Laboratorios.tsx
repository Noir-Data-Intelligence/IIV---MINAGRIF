import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
import laboratoriosHero from "@/assets/hero/hero-lab-microscope.webp";

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
        image={laboratoriosHero}
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />

      <section className="py-16 md:py-20">
        <div className="container">
          <motion.div
            className="border border-border/60"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={containerVariants}
          >
            <div className="border-b-2 border-[hsl(var(--iiv-gold))] bg-[hsl(var(--iiv-green-dark))] px-6 py-4">
              <h2 className="font-sans text-base font-bold uppercase tracking-wide text-primary-foreground">
                {t("hero.title")}
              </h2>
            </div>
            <div className="grid gap-x-8 p-6 md:grid-cols-2 md:p-8">
              {LABORATORIOS_PUBLICOS.map((lab) => {
                const Icon = lab.icon;
                return (
                  <motion.div key={lab.slug} variants={revealVariants} className="border-b border-border/50 py-3 last:border-0">
                    <Link to={`/laboratorios/${lab.slug}`} className="group flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--iiv-gold-text))]" />
                      <span>
                        <span className="block text-sm font-semibold text-primary group-hover:underline">
                          {t(`areas.${lab.slug}.name`)}
                          {lab.code && <span className="ml-1.5 font-mono text-xs text-muted-foreground">({lab.code})</span>}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground leading-snug">
                          {t(`areas.${lab.slug}.short`)}
                        </span>
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="mt-10 relative overflow-hidden border border-border/60 bg-muted/30 p-10 md:p-14 text-center"
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide">{t("cta.title")}</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t("cta.lead")}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-none bg-[hsl(var(--iiv-gold))] text-secondary-foreground hover:opacity-90 h-12 px-7 text-sm font-bold uppercase tracking-wide">
                <Link to="/servicos">
                  {t("cta.servicesLink")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-none h-12 px-7 text-sm font-bold uppercase tracking-wide">
                <Link to="/contactos">{t("cta.contactLink")}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
