import { Target, Eye, Users, Award, Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptSobre from "@/i18n/locales/pt/public/sobre.json";
import enSobre from "@/i18n/locales/en/public/sobre.json";
import sobreHeroInstitute from "@/assets/sobre/sobre-hero-institute.webp";
import sobreTeamMeeting from "@/assets/sobre/sobre-team-meeting.webp";
import sobreIntroProduction from "@/assets/hero/hero-services-vaccine-production.webp";

// Namespace "sobre" não faz parte do bundle central (src/i18n/index.ts, que só
// regista "common"/"nav"). Registamo-lo aqui em runtime para manter esta página
// autónoma sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "sobre")) i18n.addResourceBundle("pt", "sobre", ptSobre, true, true);
if (!i18n.hasResourceBundle("en", "sobre")) i18n.addResourceBundle("en", "sobre", enSobre, true, true);

const valorIcons = [Target, Eye, Users];

interface TimelineItem {
  year: string;
  title: string;
  text: string;
}

interface ValueItem {
  title: string;
  text: string;
}

export default function Sobre() {
  const { t } = useTranslation("sobre");
  const prefersReducedMotion = useReducedMotion();

  // Se o utilizador preferir menos movimento, os variants ficam "vazios" (sem transição visível).
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;
  const containerVariants = prefersReducedMotion ? {} : staggerContainer;

  const timeline = t("timeline.items", { returnObjects: true }) as unknown as TimelineItem[];
  const valores = t("values.items", { returnObjects: true }) as unknown as ValueItem[];
  const departments = t("structure.departments", { returnObjects: true }) as unknown as string[];

  return (
    <>
      <SEO
        title={t("seo.title")}
        description={t("seo.description")}
        path="/sobre"
      />
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        lead={t("hero.lead")}
        image={sobreHeroInstitute}
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />

      {/* INTRO EDITORIAL */}
      <section className="py-24 md:py-32 overflow-hidden">
        <div className="container">
          <motion.div
            className="grid gap-16 lg:grid-cols-12 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.div variants={revealVariants} className="lg:col-span-5 relative order-2 lg:order-1">
              <p className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--iiv-gold-text))]">{t("intro.kicker")}</p>
              <h2 className="mt-4 font-sans text-2xl md:text-3xl font-bold uppercase tracking-wide">
                {t("intro.title")}
              </h2>
              <p className="lead mt-6">
                {t("intro.lead")}
              </p>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                {t("intro.text")}
              </p>
            </motion.div>
            <motion.div variants={revealVariants} className="lg:col-span-6 lg:col-start-7 relative order-1 lg:order-2">
              <div className="relative overflow-hidden">
                <img src={sobreIntroProduction} alt="" className="aspect-[4/5] w-full object-cover" loading="lazy" />
              </div>
              <motion.div
                className="absolute -bottom-6 -left-6 sm:-left-10 flex items-center gap-3 bg-[hsl(var(--iiv-green-dark))] text-primary-foreground shadow-xl p-4 pr-6 max-w-[240px]"
                initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9, y: 10 }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.2 }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[hsl(var(--iiv-gold))] text-secondary-foreground">
                  <Landmark className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-sans text-xl font-bold leading-none">1965</p>
                  <p className="text-[11px] opacity-75 mt-1 leading-snug">{t("intro.badgeLabel", "ano de fundação do Instituto")}</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* TIMELINE HORIZONTAL — círculos ligados por uma linha contínua */}
      <section className="section-divider py-24 bg-accent/30 overflow-hidden">
        <div className="container">
          <div className="mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--iiv-gold-text))]">{t("timeline.kicker")}</p>
            <h2 className="mt-4 font-sans text-2xl font-bold uppercase tracking-wide">{t("timeline.title")}</h2>
          </div>

          <motion.div
            className="relative"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {/* Linha contínua: horizontal em desktop (atravessa os círculos),
                vertical em mobile (à esquerda, os itens empilham). */}
            <div className="hidden lg:block absolute top-7 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[hsl(var(--iiv-green))] via-[hsl(var(--iiv-gold))] to-[hsl(var(--iiv-green))]" />
            <div className="lg:hidden absolute top-0 bottom-0 left-7 w-0.5 bg-gradient-to-b from-[hsl(var(--iiv-green))] via-[hsl(var(--iiv-gold))] to-[hsl(var(--iiv-green))]" />

            <div className="grid gap-10 lg:gap-4 lg:grid-cols-5">
              {timeline.map((item, i) => {
                const isLast = i === timeline.length - 1;
                return (
                  <motion.div
                    key={item.year}
                    variants={revealVariants}
                    className="relative flex lg:flex-col items-start lg:items-center gap-5 lg:gap-0 lg:text-center"
                  >
                    {/* Círculo na linha */}
                    <div
                      className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-background shadow-lg transition-transform duration-300 hover:scale-110 ${
                        isLast ? "gradient-gold text-secondary-foreground" : "gradient-green text-primary-foreground"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-current" />
                    </div>
                    <div className="lg:mt-6 lg:px-3">
                      <p className={`font-sans text-3xl font-bold tracking-tight ${isLast ? "text-[hsl(var(--iiv-gold-text))]" : "text-primary"}`}>
                        {item.year}
                      </p>
                      <h3 className="font-sans text-base font-bold uppercase tracking-wide leading-tight mt-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">{item.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* VALORES */}
      <section className="section-divider py-24">
        <div className="container">
          <div className="mb-14 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--iiv-gold-text))]">{t("values.kicker")}</p>
            <h2 className="mt-4 font-sans text-2xl font-bold uppercase tracking-wide">{t("values.title")}</h2>
          </div>
          {/* Missão / Visão / Valores lado a lado — 3 colunas, não empilhados */}
          <motion.div
            className="grid gap-px bg-border/60 md:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {valores.map((v, i) => {
              const Icon = valorIcons[i];
              return (
                <motion.div key={v.title} variants={revealVariants} className="bg-card p-8">
                  <div className="flex h-14 w-14 items-center justify-center bg-[hsl(var(--iiv-green-dark))] text-primary-foreground mb-6">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-sans text-lg font-bold uppercase tracking-wide">{v.title}</h3>
                  <div className="mt-3 h-1 w-10 bg-[hsl(var(--iiv-gold))]" />
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{v.text}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ESTRUTURA */}
      <section className="section-divider py-24 bg-accent/30">
        <div className="container">
          <motion.div
            className="grid gap-12 lg:grid-cols-2 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.div variants={revealVariants} className="overflow-hidden">
              <img src={sobreTeamMeeting} alt={t("structure.imageAlt")} className="aspect-[4/5] w-full object-cover" loading="lazy" />
            </motion.div>
            <motion.div variants={revealVariants}>
              <p className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--iiv-gold-text))]">{t("structure.kicker")}</p>
              <h2 className="mt-4 font-sans text-2xl font-bold uppercase tracking-wide">{t("structure.title")}</h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                {t("structure.text")}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-px bg-border border border-border/60">
                {departments.map((d) => (
                  <div key={d} className="bg-card p-5">
                    <div className="flex h-9 w-9 items-center justify-center bg-[hsl(var(--iiv-gold))] mb-3">
                      <Award className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <p className="font-sans text-sm font-semibold">{d}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
