import { Link } from "react-router-dom";
import { Microscope, Syringe, FlaskConical, BookOpen, ShieldCheck, FileText, ArrowRight, ArrowUpRight } from "lucide-react";
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

      {/* GRELHA ÚNICA DE SERVIÇOS — um card por serviço: imagem, título, descrição */}
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {servicos.map((s, i) => {
              const { icon: Icon, image } = servicoMeta[i];
              return (
                <motion.article
                  key={s.title}
                  variants={revealVariants}
                  className="group relative flex flex-col rounded-3xl overflow-hidden bg-card border border-border/60 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300"
                >
                  {/* Imagem com número e badge de ícone sobrepostos */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--iiv-green-dark))]/60 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 font-serif text-5xl text-white/40 leading-none select-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="absolute -bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-2xl gradient-gold text-secondary-foreground shadow-xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex flex-1 flex-col p-6 pt-8">
                    <p className="kicker text-[hsl(var(--iiv-gold-text))]">{s.kicker}</p>
                    <h2 className="font-serif text-2xl mt-2 leading-tight group-hover:text-primary transition-colors">
                      {s.title}
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{s.desc}</p>

                    {/* Capacidades como etiquetas */}
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {s.caps.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>

                    <Link
                      to="/contactos"
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all"
                    >
                      {t("cta")} <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>

          {/* CTA final da página */}
          <motion.div
            className="mt-16 relative overflow-hidden rounded-3xl gradient-green text-primary-foreground p-10 md:p-14 text-center shadow-xl"
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[hsl(var(--iiv-gold))]/15 blur-3xl" />
            <h2 className="relative font-serif text-3xl md:text-4xl leading-tight">{t("hero.title")}</h2>
            <p className="relative mt-3 opacity-80 max-w-xl mx-auto">{t("hero.lead")}</p>
            <Button asChild size="lg" className="relative mt-7 gradient-gold text-secondary-foreground hover:opacity-90 h-12 px-7 rounded-xl text-sm font-semibold">
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
