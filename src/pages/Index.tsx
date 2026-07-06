import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Microscope, Syringe, FlaskConical, BookOpen, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { PartnersBar } from "@/components/home/PartnersBar";
import { LiveStats } from "@/components/home/LiveStats";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import heroCampo from "@/assets/hero/hero-campo.jpg";
import heroLab from "@/assets/hero/hero-lab.jpg";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";
import heroVacinas from "@/assets/hero/hero-vacinas.jpg";


const services = [
  { icon: Microscope, title: "Diagnóstico Laboratorial", desc: "Análises completas em virologia, bacteriologia e patologia animal.", image: heroLab },
  { icon: Syringe, title: "Produção de Vacinas", desc: "Fabrico de imunobiológicos veterinários com padrão internacional.", image: heroVacinas },
  { icon: FlaskConical, title: "Investigação Científica", desc: "Pesquisa aplicada à saúde animal e segurança alimentar.", image: heroInvestigacao },
  { icon: BookOpen, title: "Formação Técnica", desc: "Capacitação de quadros para o sector veterinário nacional.", image: heroCampo },
];

interface NoticiaCard {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  categoria: string;
  image_path: string | null;
  published_at: string | null;
  created_at: string;
}

const fallbackImages = [heroVacinas, heroInvestigacao, heroLab];
const noticiaImage = (path: string | null, i: number) =>
  path ? supabase.storage.from("noticias").getPublicUrl(path).data.publicUrl : fallbackImages[i % fallbackImages.length];
const fmtData = (d: string) => new Date(d).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" });

export default function Index() {
  const [noticias, setNoticias] = useState<NoticiaCard[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("noticias")
        .select("id,slug,titulo,resumo,categoria,image_path,published_at,created_at")
        .eq("published", true)
        .order("destaque", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(3);
      setNoticias(data ?? []);
      setLoadingNoticias(false);
    })();
  }, []);


  return (
    <>
      <SEO
        title="Instituto de Investigação Veterinária de Angola"
        description="Investigação científica, diagnóstico laboratorial e produção de vacinas ao serviço da saúde animal e segurança alimentar em Angola."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "GovernmentOrganization",
          name: "Instituto de Investigação Veterinária",
          alternateName: "IIV",
          url: "https://iiv-insight-hub.lovable.app",
          areaServed: "Angola",
          parentOrganization: { "@type": "GovernmentOrganization", name: "Ministério da Agricultura e Pescas" },
        }}
      />
      {/* HERO SLIDESHOW */}
      <HeroSlideshow />

      {/* STATS RIBBON — REALTIME */}
      <LiveStats />


      {/* EDITORIAL INTRO */}
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-12 items-start">
            <div className="md:col-span-5">
              <p className="kicker text-[hsl(var(--iiv-gold))]">
                <span className="editorial-rule mr-3" /> Edição Nº 01 — 2026
              </p>
              <h2 className="font-serif text-4xl md:text-5xl mt-6 leading-[1.05]">
                Investigar para proteger a saúde animal de Angola.
              </h2>
            </div>
            <div className="md:col-span-6 md:col-start-7 space-y-6">
              <p className="lead">
                O Instituto de Investigação Veterinária é a instituição pública responsável pela investigação científica,
                produção de vacinas e diagnóstico laboratorial ao serviço da pecuária e da saúde pública nacional.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Desde 1965, o IIV apoia o desenvolvimento do sector agropecuário em todas as províncias do país, com uma
                rede integrada de laboratórios, estações regionais e parcerias com organizações internacionais de referência.
              </p>
              <Link to="/sobre" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
                Conheça o Instituto <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="section-divider py-24 md:py-32 bg-accent/30">
        <div className="container">
          <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-xl">
              <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> O que fazemos</p>
              <h2 className="font-serif text-4xl md:text-5xl mt-5">Áreas de atuação</h2>
            </div>
            <Link to="/servicos" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
              Ver todos os serviços <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            {/* Card grande */}
            <Link to="/servicos" className="md:col-span-7 group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover-lift">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={services[0].image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-7">
                <div className="flex items-center gap-3 mb-3">
                  <Microscope className="h-5 w-5 text-[hsl(var(--iiv-gold))]" />
                  <span className="kicker text-muted-foreground">Destaque</span>
                </div>
                <h3 className="font-serif text-2xl md:text-3xl mb-2">{services[0].title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-md">{services[0].desc}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Saber mais <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* 3 cards médios */}
            <div className="md:col-span-5 grid gap-6">
              {services.slice(1).map((svc) => (
                <Link
                  key={svc.title}
                  to="/servicos"
                  className="group flex gap-5 p-5 rounded-2xl border border-border/50 bg-card hover-lift items-center"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <img src={svc.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svc.icon className="h-4 w-4 text-[hsl(var(--iiv-gold))]" />
                      <span className="kicker text-muted-foreground">Serviço</span>
                    </div>
                    <h3 className="font-serif text-lg leading-tight">{svc.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{svc.desc}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO SPLIT */}
      <section className="section-divider py-24 md:py-32">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="relative overflow-hidden rounded-2xl">
              <img src={heroCampo} alt="Investigação no terreno em Angola" className="aspect-[4/5] w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--iiv-green-dark))]/40 to-transparent" />
            </div>
            <div className="lg:pl-10">
              <Quote className="h-10 w-10 text-[hsl(var(--iiv-gold))] mb-6" strokeWidth={1} />
              <p className="font-serif text-2xl md:text-3xl leading-[1.3] tracking-tight">
                &ldquo;A nossa missão é gerar conhecimento científico que proteja os rebanhos, fortaleça a economia rural e
                assegure alimentos seguros para todos os angolanos.&rdquo;
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px w-12 bg-[hsl(var(--iiv-gold))]" />
                <div>
                  <p className="font-semibold text-sm">Direcção do IIV</p>
                  <p className="text-xs text-muted-foreground">Instituto de Investigação Veterinária</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARCEIROS */}
      <PartnersBar />

      {/* NOTÍCIAS */}
      <section className="section-divider py-24 md:py-32 bg-accent/30">
        <div className="container">
          <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> Em destaque</p>
              <h2 className="font-serif text-4xl md:text-5xl mt-5">Últimas notícias</h2>
            </div>
            <Link to="/noticias" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
              Arquivo completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {loadingNoticias ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))
            ) : noticias.length === 0 ? (
              <p className="col-span-3 text-center text-muted-foreground py-12">Sem notícias publicadas no momento.</p>
            ) : (
              noticias.map((n, i) => (
                <Link key={n.id} to={`/noticias/${n.slug}`} className="group">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted mb-5">
                    <img
                      src={noticiaImage(n.image_path, i)}
                      alt={n.titulo}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
                    <span className="text-[hsl(var(--iiv-gold))]">{n.categoria}</span>
                    <span className="h-px w-4 bg-border" />
                    <time>{fmtData(n.published_at ?? n.created_at)}</time>
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl leading-tight group-hover:text-primary transition-colors">
                    {n.titulo}
                  </h3>
                  {n.resumo && <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{n.resumo}</p>}
                </Link>
              ))
            )}
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden gradient-green text-primary-foreground">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[hsl(var(--iiv-gold))]/10 blur-3xl" />
        <div className="container relative py-24 md:py-32">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div>
              <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3 bg-[hsl(var(--iiv-gold))]" /> Trabalhar connosco</p>
              <h2 className="font-serif text-4xl md:text-5xl mt-5 leading-[1.05]">
                Precisa de análises, vacinas ou consultoria técnica?
              </h2>
            </div>
            <div className="md:pl-10 space-y-6">
              <p className="text-base md:text-lg opacity-80 leading-relaxed">
                A nossa equipa está disponível para apoiar produtores, médicos veterinários, instituições públicas e
                parceiros internacionais. Entre em contacto.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="gradient-gold text-secondary-foreground hover:opacity-90 h-12 px-6 rounded-xl text-sm font-semibold">
                  <Link to="/contactos">Contacte-nos <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-primary-foreground/25 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 h-12 px-6 rounded-xl text-sm">
                  <Link to="/servicos">Ver serviços</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
