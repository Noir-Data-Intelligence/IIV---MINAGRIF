import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHeroSlides } from "@/hooks/queries/useHeroSlides";

import heroLab from "@/assets/hero/hero-lab-microscope.webp";
import heroVacinas from "@/assets/hero/hero-scientist-vaccine.webp";
import heroCampo from "@/assets/hero/hero-cattle-savanna.webp";
import heroInvestigacao from "@/assets/hero/hero-agriculture-aerial.webp";
import heroAves from "@/assets/hero/hero-poultry-vaccination.webp";

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

/**
 * Hero da página inicial — layout dividido (carrossel de imagem + painel de
 * texto sólido) replicando directamente a anatomia do hero do site de
 * referência (uchile.cl): imagem a toda a largura à esquerda com setas
 * circulares de navegação, painel de cor sólida à direita com título curto,
 * parágrafo de apoio e link "saiba mais". Mantém a mesma fonte de dados
 * dinâmica (CMS de Slideshow, `useHeroSlides`) — só a composição visual
 * mudou.
 */
export function HeroSlideshow() {
  const [slides, setSlides] = useState<Slide[]>(defaultSlides);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const { data, isError } = useHeroSlides();

  useEffect(() => {
    if (isError || !data || data.length === 0) return;
    const mapped: Slide[] = data.map((r, i) => ({
      image: r.imageUrl || fallbackImages[i % fallbackImages.length],
      kicker: r.kicker,
      title: r.title,
      subtitle: r.subtitle,
      cta: r.ctaLabel,
      link: r.ctaLink,
    }));
    setSlides(mapped);
    setCurrent(0);
  }, [data, isError]);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

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
      className="relative isolate bg-[hsl(var(--iiv-green-dark))]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Destaques do Instituto"
    >
      <div className="grid lg:grid-cols-[1.6fr_1fr]">
        {/* Imagem + navegação */}
        <div className="relative order-1 h-[46vh] min-h-[320px] md:h-[60vh] md:max-h-[560px] overflow-hidden">
          {slides.map((s, i) => (
            <img
              key={s.image}
              src={s.image}
              alt=""
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out",
                i === current ? "opacity-100" : "opacity-0",
              )}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}

          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[hsl(var(--iiv-green-dark))] shadow-lg hover:bg-white/90 transition-colors"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[hsl(var(--iiv-green-dark))] shadow-lg hover:bg-white/90 transition-colors"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === current ? "w-6 bg-[hsl(var(--iiv-gold))]" : "w-2 bg-white/60 hover:bg-white/80",
                )}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Painel de texto */}
        <div className="relative order-2 flex flex-col justify-center px-6 py-10 md:px-12 md:py-14">
          <div key={current} className="animate-fade-up">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[hsl(var(--iiv-gold))]">
              {slide.kicker}
            </p>
            <h1 className="mt-4 font-sans text-2xl md:text-3xl font-bold leading-[1.15] text-primary-foreground">
              {slide.title}
            </h1>
            <p className="mt-5 text-sm md:text-base leading-relaxed text-primary-foreground/85">
              {slide.subtitle}
            </p>
            <Link
              to={slide.link}
              className="group mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-foreground hover:text-[hsl(var(--iiv-gold))] transition-colors"
            >
              {slide.cta}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
