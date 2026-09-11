import { Link, useParams, Navigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { findLaboratorioPublico } from "@/data/laboratoriosPublicos";
import i18n from "@/i18n";
import ptLaboratorios from "@/i18n/locales/pt/public/laboratorios.json";
import enLaboratorios from "@/i18n/locales/en/public/laboratorios.json";
import laboratorioHero from "@/assets/hero/hero-lab.jpg";

if (!i18n.hasResourceBundle("pt", "public-laboratorios"))
  i18n.addResourceBundle("pt", "public-laboratorios", ptLaboratorios, true, true);
if (!i18n.hasResourceBundle("en", "public-laboratorios"))
  i18n.addResourceBundle("en", "public-laboratorios", enLaboratorios, true, true);

export default function LaboratorioDetalhe() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation("public-laboratorios");
  const prefersReducedMotion = useReducedMotion();
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;
  const containerVariants = prefersReducedMotion ? {} : staggerContainer;

  const lab = findLaboratorioPublico(slug);
  if (!lab) return <Navigate to="/laboratorios" replace />;

  const Icon = lab.icon;
  const techniques = t(`areas.${lab.slug}.techniques`, { returnObjects: true }) as unknown as string[];

  return (
    <>
      <SEO
        title={t(`areas.${lab.slug}.name`)}
        description={t(`areas.${lab.slug}.short`)}
        path={`/laboratorios/${lab.slug}`}
      />
      <PageHero
        kicker={t("hero.kicker")}
        title={t(`areas.${lab.slug}.name`)}
        lead={t(`areas.${lab.slug}.short`)}
        image={laboratorioHero}
        breadcrumb={[{ label: t("hero.breadcrumb"), href: "/laboratorios" }, { label: t(`areas.${lab.slug}.name`) }]}
      />

      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            className="grid gap-16 lg:grid-cols-12 items-start"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.div variants={revealVariants} className="lg:col-span-7">
              <div className="flex h-14 w-14 items-center justify-center bg-[hsl(var(--iiv-green-dark))] text-primary-foreground">
                <Icon className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
                {t(`areas.${lab.slug}.description`)}
              </p>
            </motion.div>

            <motion.aside variants={revealVariants} className="lg:col-span-5">
              <div className="border border-border/60">
                <h2 className="border-b-2 border-[hsl(var(--iiv-gold))] bg-[hsl(var(--iiv-green-dark))] px-6 py-4 font-sans text-sm font-bold uppercase tracking-wide text-primary-foreground">
                  {t("techniques.heading")}
                </h2>
                <ul className="p-6">
                  {techniques.map((technique) => (
                    <li key={technique} className="flex items-start gap-2.5 border-b border-border/50 py-2.5 text-sm text-muted-foreground last:border-0">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--iiv-gold-text))]" />
                      <span>{technique}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-6 pt-0">
                  <Button asChild className="w-full rounded-none bg-[hsl(var(--iiv-gold))] text-secondary-foreground hover:opacity-90">
                    <Link to="/contactos">
                      {t("cta.contactLink")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        </div>
      </section>
    </>
  );
}
