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
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />

      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-10 text-center"
          >
            <motion.div variants={revealVariants}>
              <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
              <h2 className="font-serif text-2xl mt-4">{t("empty.title")}</h2>
              <p className="mt-2 text-muted-foreground max-w-lg mx-auto">{t("empty.text")}</p>
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
              {t("categories.heading")}
            </motion.h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat, i) => {
                const Icon = categoryIcons[i % categoryIcons.length];
                return (
                  <motion.div
                    key={cat.title}
                    variants={revealVariants}
                    className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-green-gold text-primary-foreground shadow-md">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <h4 className="font-serif text-base mt-5">{cat.title}</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{cat.text}</p>
                  </motion.div>
                );
              })}
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
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gradient-gold text-secondary-foreground hover:opacity-90 h-12 px-7 rounded-xl text-sm font-semibold">
                <Link to="/noticias">
                  {t("cta.newsLink")} <ArrowRight className="ml-2 h-4 w-4" />
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
