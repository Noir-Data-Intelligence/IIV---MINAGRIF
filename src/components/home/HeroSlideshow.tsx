import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import heroLab from "@/assets/hero/hero-lab.jpg";
import heroVacinas from "@/assets/hero/hero-vacinas.jpg";
import heroCampo from "@/assets/hero/hero-campo.jpg";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";
import heroAves from "@/assets/hero/hero-aves.jpg";

type Slide = {
  image: string;
  kicker: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
};

const fallbackImages = [heroLab, heroVacinas, heroCampo, heroInvestigacao, heroAves];

const defaultSlides: Slide[] = [
  { image: heroLab, kicker: "Diagnóstico Laboratorial", title: "Ciência ao serviço da saúde animal", subtitle: "Laboratórios de referência com padrões internacionais para o sector veterinário angolano.", cta: "Conheça os nossos serviços", link: "/servicos" },
  { image: heroVacinas, kicker: "Produção de Vacinas", title: "Vacinas e reagentes feitos em Angola", subtitle: "Produção nacional de imunobiológicos veterinários para reforçar a segurança alimentar.", cta: "Ver produção", link: "/servicos" },
  { image: heroCampo, kicker: "Saúde no Terreno", title: "Presença em cada província", subtitle: "Oito estações regionais a apoiar criadores e médicos veterinários em todo o território.", cta: "Sobre o Instituto", link: "/sobre" },
  { image: heroInvestigacao, kicker: "Investigação Científica", title: "Investigação aplicada com impacto", subtitle: "Programas de pesquisa em parceria com universidades e organizações internacionais.", cta: "Saiba mais", link: "/sobre" },
  { image: heroAves, kicker: "Vigilância Epidemiológica", title: "Protegendo a pecuária nacional", subtitle: "Vigilância contínua de doenças animais que ameaçam a economia e a saúde pública.", cta: "Últimas notícias", link: "/noticias" },
];

const INTERVAL = 6500;

export function HeroSlideshow() {
  const [slides, setSlides] = useState<Slide[]>(defaultSlides);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (cancelled || !data || data.length === 0) return;
      const mapped: Slide[] = data.map((r: any, i: number) => ({
        image: r.image_url || fallbackImages[i % fallbackImages.length],
        kicker: r.kicker,
        title: r.title,
        subtitle: r.subtitle,
        cta: r.cta_label,
        link: r.cta_link,
      }));
      setSlides(mapped);
      setCurrent(0);
    })();
    return () => { cancelled = true; };
  }, []);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    timerRef.current = window.setTimeout(next, INTERVAL);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [current, paused, next]);

  const slide = slides[current];

  return (
    <section
      className="relative isolate overflow-hidden bg-[hsl(var(--iiv-green-dark))]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Destaques do Instituto"
    >
      {/* Slides */}
      <div className="relative h-[88vh] min-h-[600px] max-h-[860px] w-full">
        {slides.map((s, i) => (
          <div
            key={s.image}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-out",
              i === current ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
            aria-hidden={i !== current}
          >
            <img
              src={s.image}
              alt=""
              className={cn(
                "h-full w-full object-cover will-change-transform",
                i === current && "animate-kenburns",
              )}
              loading={i === 0 ? "eager" : "lazy"}
            />
            {/* Tint + vignette */}
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--iiv-green-dark))]/85 via-[hsl(var(--iiv-green-dark))]/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 container flex h-full items-center">
          <div
            key={current}
            className="max-w-2xl text-primary-foreground animate-fade-up"
            aria-live="polite"
          >
            <div className="kicker mb-5 text-[hsl(var(--iiv-gold))]">
              <span className="inline-block h-px w-8 align-middle bg-[hsl(var(--iiv-gold))]" />
              <span className="ml-3">{slide.kicker}</span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-normal leading-[1.05] tracking-tight">
              {slide.title}
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg opacity-80 leading-relaxed">
              {slide.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="gradient-gold text-secondary-foreground hover:opacity-90 shadow-lg h-12 px-6 text-sm font-semibold rounded-xl"
              >
                <Link to={slide.link}>
                  {slide.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary-foreground/25 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 h-12 px-6 text-sm rounded-xl"
              >
                <Link to="/sobre">Sobre o IIV</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Right-side numbered indicators */}
        <div className="absolute inset-y-0 right-6 z-10 hidden md:flex flex-col items-end justify-center gap-3 text-primary-foreground/80">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="group flex items-center gap-3"
              aria-label={`Ir para slide ${i + 1}`}
            >
              <span
                className={cn(
                  "font-mono text-xs tabular-nums transition-opacity",
                  i === current ? "opacity-100" : "opacity-50 group-hover:opacity-80",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "block h-px transition-all duration-500",
                  i === current
                    ? "w-12 bg-[hsl(var(--iiv-gold))]"
                    : "w-6 bg-primary-foreground/30 group-hover:bg-primary-foreground/60",
                )}
              />
            </button>
          ))}
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-6 left-0 right-0 z-10 container flex items-center justify-between text-primary-foreground/80">
          <div className="font-mono text-xs tracking-widest">
            <span className="text-[hsl(var(--iiv-gold))]">{String(current + 1).padStart(2, "0")}</span>
            <span className="opacity-50"> / {String(slides.length).padStart(2, "0")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prev}
              className="h-9 w-9 rounded-full border border-primary-foreground/20 hover:bg-primary-foreground/10 flex items-center justify-center transition-colors"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              className="h-9 w-9 rounded-full border border-primary-foreground/20 hover:bg-primary-foreground/10 flex items-center justify-center transition-colors"
              aria-label={paused ? "Reproduzir" : "Pausar"}
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={next}
              className="h-9 w-9 rounded-full border border-primary-foreground/20 hover:bg-primary-foreground/10 flex items-center justify-center transition-colors"
              aria-label="Próximo slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
