import { Target, Eye, Users, Award } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";
import heroLab from "@/assets/hero/hero-lab.jpg";

const valores = [
  { icon: Target, title: "Missão", text: "Promover a investigação, o diagnóstico e a produção no domínio da saúde animal, contribuindo para a segurança alimentar e o desenvolvimento sustentável de Angola." },
  { icon: Eye, title: "Visão", text: "Ser uma instituição de referência em investigação veterinária a nível regional e continental, com impacto reconhecido na saúde pública." },
  { icon: Users, title: "Valores", text: "Excelência científica, integridade, colaboração interinstitucional e compromisso com a saúde pública e o bem-estar animal." },
];

const timeline = [
  { ano: "1965", titulo: "Fundação", text: "Criação do Instituto enquanto laboratório central de diagnóstico veterinário do país." },
  { ano: "1985", titulo: "Expansão regional", text: "Abertura das primeiras estações regionais, alargando a cobertura técnica ao território." },
  { ano: "2005", titulo: "Produção de vacinas", text: "Início da produção nacional de imunobiológicos veterinários para o mercado interno." },
  { ano: "2020", titulo: "Modernização", text: "Renovação tecnológica dos laboratórios e adopção de práticas internacionais de qualidade." },
  { ano: "2026", titulo: "Plataforma digital", text: "Lançamento do portal institucional integrado, com gestão laboratorial e produção em linha." },
];

export default function Sobre() {
  return (
    <>
      <SEO
        title="Sobre o IIV"
        description="História, missão, visão e estrutura organizacional do Instituto de Investigação Veterinária de Angola."
        path="/sobre"
      />
      <PageHero
        kicker="Quem Somos"
        title="Uma instituição ao serviço da saúde animal em Angola."
        lead="Conheça a história, a missão e a estrutura do Instituto de Investigação Veterinária."
        image={heroInvestigacao}
        breadcrumb={[{ label: "Sobre" }]}
      />

      {/* INTRO EDITORIAL */}
      <section className="py-24">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> O Instituto</p>
              <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">
                Mais de seis décadas a apoiar a pecuária angolana.
              </h2>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <p className="lead">
                O IIV é uma instituição pública de investigação tutelada pelo Ministério da Agricultura e Pescas,
                com competências nacionais em diagnóstico, produção e vigilância no domínio da saúde animal.
              </p>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Desde a sua fundação, em 1965, o IIV desempenha um papel central na defesa sanitária do efectivo
                pecuário, no apoio aos médicos veterinários do sector público e privado e no reforço da segurança
                alimentar nacional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="section-divider py-24 bg-accent/30">
        <div className="container">
          <div className="mb-14">
            <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> Linha do tempo</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-5">A nossa história</h2>
          </div>
          <div className="space-y-12">
            {timeline.map((t) => (
              <div key={t.ano} className="grid gap-6 md:grid-cols-12 items-start border-t border-border/40 pt-10">
                <div className="md:col-span-3">
                  <p className="font-serif text-5xl md:text-6xl text-primary tracking-tight">{t.ano}</p>
                </div>
                <div className="md:col-span-8 md:col-start-5">
                  <h3 className="font-serif text-xl md:text-2xl mb-3">{t.titulo}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="section-divider py-24">
        <div className="container">
          <div className="mb-14 max-w-2xl">
            <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> Princípios</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-5">Missão, visão e valores</h2>
          </div>
          <div className="grid gap-px bg-border rounded-2xl overflow-hidden border border-border/60">
            {valores.map((v) => (
              <div key={v.title} className="bg-card p-8 md:p-10 grid md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-3">
                  <v.icon className="h-8 w-8 text-[hsl(var(--iiv-gold))] mb-4" strokeWidth={1.5} />
                  <h3 className="font-serif text-2xl">{v.title}</h3>
                </div>
                <p className="md:col-span-8 md:col-start-5 text-muted-foreground leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESTRUTURA */}
      <section className="section-divider py-24 bg-accent/30">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="overflow-hidden rounded-2xl">
              <img src={heroLab} alt="Laboratórios do IIV" className="aspect-[4/5] w-full object-cover" loading="lazy" />
            </div>
            <div>
              <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> Organização</p>
              <h2 className="font-serif text-3xl md:text-4xl mt-5 leading-tight">Estrutura organizacional</h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                O IIV está organizado em quatro departamentos principais — Diagnóstico, Produção, Investigação e
                Administração — cada um com subdepartamentos especializados que asseguram cobertura completa das
                necessidades do sector veterinário nacional.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border/60">
                {["Diagnóstico", "Produção", "Investigação", "Administração"].map((d) => (
                  <div key={d} className="bg-card p-5">
                    <Award className="h-4 w-4 text-[hsl(var(--iiv-gold))] mb-2" />
                    <p className="font-serif text-lg">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
