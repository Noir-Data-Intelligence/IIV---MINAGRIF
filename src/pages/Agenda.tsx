import { Link } from "react-router-dom";
import { CalendarDays, Syringe, MapPinned, Activity, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptAgenda from "@/i18n/locales/pt/public/agenda.json";
import enAgenda from "@/i18n/locales/en/public/agenda.json";
import agendaHero from "@/assets/hero/hero-poultry-vaccination.webp";

if (!i18n.hasResourceBundle("pt", "agenda")) i18n.addResourceBundle("pt", "agenda", ptAgenda, true, true);
if (!i18n.hasResourceBundle("en", "agenda")) i18n.addResourceBundle("en", "agenda", enAgenda, true, true);

interface CategoryItem {
  title: string;
  text: string;
}

const categoryIcons = [Activity, Syringe, MapPinned, CalendarDays];

export default function Agenda() {
  const { t } = useTranslation("agenda");
  const prefersReducedMotion = useReducedMotion();
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;
  const containerVariants = prefersReducedMotion ? {} : staggerContainer;

  const categories = t("categories.items", { returnObjects: true }) as unknown as CategoryItem[];

  return (
    <>
      <SEO title={t("seo.title")} description={t("seo.description")} path="/agenda" />
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        lead={t("hero.lead")}
        image={agendaHero}
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />

      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="border border-border/60 bg-muted/30 p-10 text-center"
          >
            <motion.div variants={revealVariants}>
              <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
              <h2 className="mt-4 font-sans text-xl font-bold uppercase tracking-wide">{t("empty.title")}</h2>
              <p className="mt-2 text-muted-foreground max-w-lg mx-auto">{t("empty.text")}</p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-14"
          >
            <motion.h3 variants={revealVariants} className="mb-6 border-b-2 border-[hsl(var(--iiv-gold))] pb-3 font-sans text-lg font-bold uppercase tracking-wide">
              {t("categories.heading")}
            </motion.h3>
            <div className="grid gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat, i) => {
                const Icon = categoryIcons[i % categoryIcons.length];
                return (
                  <motion.div key={cat.title} variants={revealVariants} className="bg-card p-6">
                    <div className="flex h-11 w-11 items-center justify-center bg-[hsl(var(--iiv-green-dark))] text-primary-foreground">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <h4 className="mt-5 font-sans text-sm font-bold uppercase tracking-wide">{cat.title}</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{cat.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="mt-14 border border-border/60 bg-muted/30 p-10 md:p-14 text-center"
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide">{t("cta.title")}</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t("cta.lead")}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-none bg-[hsl(var(--iiv-gold))] text-secondary-foreground hover:opacity-90 h-12 px-7 text-sm font-bold uppercase tracking-wide">
                <Link to="/noticias">
                  {t("cta.newsLink")} <ArrowRight className="ml-2 h-4 w-4" />
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
