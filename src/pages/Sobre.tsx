import { Target, Eye, Users, Award } from "lucide-react";
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
      <section className="py-24">
        <div className="container">
          <motion.div
            className="grid gap-12 md:grid-cols-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.div variants={revealVariants} className="md:col-span-5">
              <p className="kicker text-[hsl(var(--iiv-gold-text))]"><span className="editorial-rule mr-3" /> {t("intro.kicker")}</p>
              <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">
                {t("intro.title")}
              </h2>
            </motion.div>
            <motion.div variants={revealVariants} className="md:col-span-6 md:col-start-7">
              <p className="lead">
                {t("intro.lead")}
              </p>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                {t("intro.text")}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="section-divider py-24 bg-accent/30">
        <div className="container">
          <div className="mb-14">
            <p className="kicker text-[hsl(var(--iiv-gold-text))]"><span className="editorial-rule mr-3" /> {t("timeline.kicker")}</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-5">{t("timeline.title")}</h2>
          </div>
          <motion.div
            className="space-y-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {timeline.map((item) => (
              <motion.div
                key={item.year}
                variants={revealVariants}
                className="grid gap-6 md:grid-cols-12 items-start border-t border-border/40 pt-10"
              >
                <div className="md:col-span-3">
                  <p className="font-serif text-5xl md:text-6xl text-primary tracking-tight">{item.year}</p>
                </div>
                <div className="md:col-span-8 md:col-start-5">
                  <h3 className="font-serif text-xl md:text-2xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* VALORES */}
      <section className="section-divider py-24">
        <div className="container">
          <div className="mb-14 max-w-2xl">
            <p className="kicker text-[hsl(var(--iiv-gold-text))]"><span className="editorial-rule mr-3" /> {t("values.kicker")}</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-5">{t("values.title")}</h2>
          </div>
          <motion.div
            className="grid gap-px bg-border rounded-2xl overflow-hidden border border-border/60"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {valores.map((v, i) => {
              const Icon = valorIcons[i];
              return (
                <motion.div
                  key={v.title}
                  variants={revealVariants}
                  className="group bg-card p-8 md:p-10 grid md:grid-cols-12 gap-6 items-start hover:bg-accent/20 transition-colors duration-300"
                >
                  <div className="md:col-span-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-green-soft text-primary-foreground shadow-lg mb-5 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <h3 className="font-serif text-2xl">{v.title}</h3>
                  </div>
                  <p className="md:col-span-8 md:col-start-5 text-muted-foreground leading-relaxed">{v.text}</p>
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
            <motion.div variants={revealVariants} className="overflow-hidden rounded-2xl">
              <img src={sobreTeamMeeting} alt={t("structure.imageAlt")} className="aspect-[4/5] w-full object-cover" loading="lazy" />
            </motion.div>
            <motion.div variants={revealVariants}>
              <p className="kicker text-[hsl(var(--iiv-gold-text))]"><span className="editorial-rule mr-3" /> {t("structure.kicker")}</p>
              <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">{t("structure.title")}</h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                {t("structure.text")}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border/60">
                {departments.map((d) => (
                  <div key={d} className="group bg-card p-5 hover:bg-accent/20 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--iiv-gold-light))] dark:bg-accent mb-3 transition-transform duration-300 group-hover:scale-110">
                      <Award className="h-4 w-4 text-[hsl(var(--iiv-gold-text))]" />
                    </div>
                    <p className="font-serif text-lg">{d}</p>
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
