import { Link } from "react-router-dom";
import { Microscope, Syringe, FlaskConical, BookOpen, ShieldCheck, FileText, ArrowRight, Check } from "lucide-react";
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
import servicosDiagnostico from "@/assets/servicos/servicos-card-diagnostico.webp";
import servicosVacinas from "@/assets/servicos/servicos-card-vacinas.webp";
import heroStatsLab from "@/assets/hero/hero-stats-lab.webp";
import servicosFormacao from "@/assets/servicos/servicos-card-formacao.webp";
import servicosInspeccao from "@/assets/servicos/servicos-card-inspeccao.webp";
import legislacaoHeroLaw from "@/assets/legislacao/legislacao-hero-law.webp";

// Namespace "servicos" não faz parte do bundle central (src/i18n/index.ts, que
// só regista "common"/"nav"). Registamo-lo aqui em runtime para manter esta
// página autónoma sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "servicos")) i18n.addResourceBundle("pt", "servicos", ptServicos, true, true);
if (!i18n.hasResourceBundle("en", "servicos")) i18n.addResourceBundle("en", "servicos", enServicos, true, true);

const servicoMeta = [
  { icon: Microscope, image: servicosDiagnostico },
  { icon: Syringe, image: servicosVacinas },
  { icon: FlaskConical, image: heroStatsLab },
  { icon: BookOpen, image: servicosFormacao },
  { icon: ShieldCheck, image: servicosInspeccao },
  { icon: FileText, image: legislacaoHeroLaw },
];

interface ServicoItem {
  kicker: string;
  title: string;
  desc: string;
  caps: string[];
}

export default function Servicos() {
  const { t } = useTranslation("servicos");
  const prefersReducedMotion = useReducedMotion();

  // Se o utilizador preferir menos movimento, os variants ficam "vazios" (sem transição visível).
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;
  const containerVariants = prefersReducedMotion ? {} : staggerContainer;

  const servicos = t("items", { returnObjects: true }) as unknown as ServicoItem[];

  return (
    <>
      <SEO
        title={t("seo.title")}
        description={t("seo.description")}
        path="/servicos"
      />
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        lead={t("hero.lead")}
        image={servicosHeroDiagnostics}
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />

      <section className="py-24">
        <div className="container space-y-24">
          {servicos.map((s, i) => {
            const reverse = i % 2 === 1;
            const { icon: Icon, image } = servicoMeta[i];
            return (
              <motion.article
                key={s.title}
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="grid gap-10 lg:grid-cols-2 items-center pb-24 border-b border-border/40 last:border-b-0 last:pb-0"
              >
                <motion.div variants={revealVariants} className={reverse ? "lg:order-2" : ""}>
                  <div className="overflow-hidden rounded-2xl">
                    <img src={image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  </div>
                </motion.div>
                <motion.div variants={revealVariants} className={reverse ? "lg:order-1 lg:pr-10" : "lg:pl-10"}>
                  <p className="kicker text-[hsl(var(--iiv-gold-text))]">
                    <span className="editorial-rule mr-3" /> {s.kicker}
                  </p>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-green-soft text-primary-foreground shadow-lg mt-5 mb-4">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl leading-tight">{s.title}</h2>
                  <p className="mt-5 text-muted-foreground leading-relaxed">{s.desc}</p>
                  <motion.ul
                    className="mt-6 grid grid-cols-2 gap-3"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                  >
                    {s.caps.map((c) => (
                      <motion.li key={c} variants={revealVariants} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-[hsl(var(--iiv-gold-text))] shrink-0" />
                        <span>{c}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                  <Button asChild variant="outline" className="mt-7 rounded-xl">
                    <Link to="/contactos">
                      {t("cta")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </>
  );
}
