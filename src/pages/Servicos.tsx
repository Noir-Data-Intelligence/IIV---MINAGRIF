import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptServicos from "@/i18n/locales/pt/public/servicos.json";
import enServicos from "@/i18n/locales/en/public/servicos.json";
import servicosHeroDiagnostics from "@/assets/servicos/servicos-hero-diagnostics.webp";

if (!i18n.hasResourceBundle("pt", "servicos")) i18n.addResourceBundle("pt", "servicos", ptServicos, true, true);
if (!i18n.hasResourceBundle("en", "servicos")) i18n.addResourceBundle("en", "servicos", enServicos, true, true);

/** Alterna as duas cores institucionais entre caixas, tal como o site de
 * referência alterna azul/verde-água entre os blocos de "Programas de Estudio". */
const BOX_COLORS = ["bg-[hsl(var(--iiv-green-dark))]", "bg-[hsl(38_75%_32%)]"];

interface ServicoItem {
  kicker: string;
  title: string;
  desc: string;
  caps: string[];
}

export default function Servicos() {
  const { t } = useTranslation("servicos");
  const prefersReducedMotion = useReducedMotion();
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;
  const containerVariants = prefersReducedMotion ? {} : staggerContainer;

  const servicos = t("items", { returnObjects: true }) as unknown as ServicoItem[];

  return (
    <>
      <SEO title={t("seo.title")} description={t("seo.description")} path="/servicos" />
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        lead={t("hero.lead")}
        image={servicosHeroDiagnostics}
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />

      <section className="py-16 md:py-20">
        <div className="container">
          <motion.div
            className="grid gap-6 md:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {servicos.map((s, i) => (
              <motion.div key={s.title} variants={revealVariants} className={`${BOX_COLORS[i % 2]} text-primary-foreground p-6 md:p-8`}>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">{s.kicker}</p>
                <h2 className="mt-2 font-sans text-lg font-bold uppercase tracking-wide">{s.title}</h2>
                <p className="mt-4 text-sm leading-relaxed opacity-85">{s.desc}</p>
                <ul className="mt-5 space-y-2">
                  {s.caps.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm opacity-90">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--iiv-gold))]" />
                      {c}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contactos"
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide hover:gap-2.5 transition-all"
                >
                  {t("cta")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="container">
          <motion.div
            className="relative overflow-hidden border border-border/60 bg-muted/30 p-10 md:p-14 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
          >
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide">{t("hero.title")}</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t("hero.lead")}</p>
            <Button asChild size="lg" className="mt-7 rounded-none bg-[hsl(var(--iiv-gold))] text-secondary-foreground hover:opacity-90 h-12 px-7 text-sm font-bold uppercase tracking-wide">
              <Link to="/contactos">
                {t("cta")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
