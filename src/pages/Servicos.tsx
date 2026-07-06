import { Link } from "react-router-dom";
import { Microscope, Syringe, FlaskConical, BookOpen, ShieldCheck, FileText, ArrowRight, Check } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import heroLab from "@/assets/hero/hero-lab.jpg";
import heroVacinas from "@/assets/hero/hero-vacinas.jpg";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";
import heroCampo from "@/assets/hero/hero-campo.jpg";
import heroAves from "@/assets/hero/hero-aves.jpg";

const servicos = [
  {
    icon: Microscope,
    kicker: "01 — Diagnóstico",
    title: "Diagnóstico Laboratorial",
    desc: "Análises completas em virologia, bacteriologia, parasitologia, serologia e patologia animal. Resultados fiáveis com tecnologia de ponta e validação metodológica rigorosa.",
    caps: ["Virologia veterinária", "Bacteriologia e antibiograma", "Parasitologia", "Histopatologia"],
    image: heroLab,
  },
  {
    icon: Syringe,
    kicker: "02 — Produção",
    title: "Produção de Vacinas",
    desc: "Fabricação de vacinas autógenas e comerciais, soros hiperimunes e reagentes de diagnóstico para o sector veterinário angolano e regional.",
    caps: ["Vacinas autógenas", "Soros hiperimunes", "Reagentes de diagnóstico", "Controlo de qualidade"],
    image: heroVacinas,
  },
  {
    icon: FlaskConical,
    kicker: "03 — Investigação",
    title: "Investigação Científica",
    desc: "Projectos de investigação aplicada em saúde animal, epidemiologia e segurança alimentar, com parcerias nacionais e internacionais.",
    caps: ["Epidemiologia veterinária", "Doenças emergentes", "Segurança alimentar", "Publicação científica"],
    image: heroInvestigacao,
  },
  {
    icon: BookOpen,
    kicker: "04 — Formação",
    title: "Formação Técnica",
    desc: "Programas de capacitação para técnicos veterinários, laboratoristas e profissionais do sector agropecuário em todas as províncias.",
    caps: ["Acções de formação", "Estágios curriculares", "Workshops técnicos", "Certificação"],
    image: heroCampo,
  },
  {
    icon: ShieldCheck,
    kicker: "05 — Qualidade",
    title: "Controlo de Qualidade",
    desc: "Validação de métodos, auditorias internas e certificação de conformidade com normas internacionais ISO e OIE.",
    caps: ["Validação de métodos", "Auditorias", "Não-conformidades", "Acreditação"],
    image: heroAves,
  },
  {
    icon: FileText,
    kicker: "06 — Consultoria",
    title: "Consultoria e Pareceres",
    desc: "Emissão de pareceres técnicos e consultoria especializada para entidades públicas, organizações e parceiros privados.",
    caps: ["Pareceres oficiais", "Consultoria técnica", "Apoio regulamentar", "Estudos de impacto"],
    image: heroInvestigacao,
  },
];

export default function Servicos() {
  return (
    <>
      <SEO
        title="Serviços"
        description="Diagnóstico laboratorial, produção de vacinas, investigação, formação e consultoria do Instituto de Investigação Veterinária."
        path="/servicos"
      />
      <PageHero
        kicker="Áreas de Atuação"
        title="Serviços ao sector veterinário e à saúde pública."
        lead="Diagnóstico, produção, investigação, formação e consultoria — uma gama integrada de serviços técnicos."
        image={heroLab}
        breadcrumb={[{ label: "Serviços" }]}
      />

      <section className="py-24">
        <div className="container space-y-24">
          {servicos.map((s, i) => {
            const reverse = i % 2 === 1;
            return (
              <article
                key={s.title}
                className="grid gap-10 lg:grid-cols-2 items-center pb-24 border-b border-border/40 last:border-b-0 last:pb-0"
              >
                <div className={reverse ? "lg:order-2" : ""}>
                  <div className="overflow-hidden rounded-2xl">
                    <img src={s.image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  </div>
                </div>
                <div className={reverse ? "lg:order-1 lg:pr-10" : "lg:pl-10"}>
                  <p className="kicker text-[hsl(var(--iiv-gold))]">
                    <span className="editorial-rule mr-3" /> {s.kicker}
                  </p>
                  <div className="flex items-center gap-4 mt-5 mb-2">
                    <s.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl leading-tight">{s.title}</h2>
                  <p className="mt-5 text-muted-foreground leading-relaxed">{s.desc}</p>
                  <ul className="mt-6 grid grid-cols-2 gap-3">
                    {s.caps.map((c) => (
                      <li key={c} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-[hsl(var(--iiv-gold))] shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="mt-7 rounded-xl">
                    <Link to="/contactos">
                      Solicitar este serviço <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
