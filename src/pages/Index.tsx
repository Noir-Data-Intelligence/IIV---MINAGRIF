import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowUpRight, Microscope, Syringe, FlaskConical, BookOpen, Quote, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { PartnersBar } from "@/components/home/PartnersBar";
import { LiveStats } from "@/components/home/LiveStats";
import { SEO, BASE_URL } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/states/ErrorState";
import { useNoticiasList } from "@/hooks/queries/useNoticias";
import type { NoticiaDto } from "@/types/dto/noticia";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import homePt from "@/i18n/locales/pt/public/home.json";
import homeEn from "@/i18n/locales/en/public/home.json";
import heroCampo from "@/assets/hero/hero-cattle-savanna.webp";
import heroLab from "@/assets/hero/hero-lab-microscope.webp";
import heroInvestigacao from "@/assets/hero/hero-stats-lab.webp";
import heroVacinas from "@/assets/hero/hero-scientist-vaccine.webp";
import heroCtaVet from "@/assets/hero/hero-cta-veterinarian.webp";
import editorialLab from "@/assets/sobre/sobre-vintage-lab.webp";
import noticiaFallback from "@/assets/noticias/noticias-fallback-card-sm.webp";

// Namespace "home" não faz parte do bundle central (src/i18n/index.ts, que só
// regista "common"/"nav"). Registamo-lo aqui em runtime para manter esta página
// autónoma sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "home")) i18n.addResourceBundle("pt", "home", homePt, true, true);
if (!i18n.hasResourceBundle("en", "home")) i18n.addResourceBundle("en", "home", homeEn, true, true);

const serviceIcons = [Microscope, Syringe, FlaskConical, BookOpen];
const serviceImages = [heroLab, heroVacinas, heroInvestigacao, heroCampo];

const fallbackImages = [noticiaFallback, heroVacinas, heroCampo];
const noticiaImage = (path: string | null, i: number) =>
  path && /^https?:\/\//.test(path) ? path : fallbackImages[i % fallbackImages.length];
const fmtData = (d: string) => new Date(d).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" });

export default function Index() {
  const { t } = useTranslation("home");
  const shouldReduceMotion = useReducedMotion();

  const { data, isLoading: loadingNoticias, error: errorNoticias } = useNoticiasList({
    page: 1,
    perPage: 3,
    published: true,
  });

  // Ordenação idêntica à que existia com o Supabase: destaque primeiro, depois
  // published_at, depois created_at (desc). O mock MSW já devolve isto ordenado,
  // mas mantemos a ordenação no cliente para não depender desse detalhe da API.
  const noticias = useMemo(() => {
    const rows: NoticiaDto[] = data?.data ?? [];
    return [...rows].sort((a, b) => {
      if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
      const da = a.published_at ?? a.created_at;
      const db = b.published_at ?? b.created_at;
      return db.localeCompare(da);
    });
  }, [data]);

  const serviceItems = t("services.items", { returnObjects: true }) as { title: string; desc: string }[];
  const services = serviceItems.map((item, i) => ({
    ...item,
    icon: serviceIcons[i],
    image: serviceImages[i],
  }));

  // Helper de reveal-on-scroll: sem props de animação quando o utilizador
  // prefere movimento reduzido (renderiza estático, sem "hidden" pendurado).
  const reveal = (variants: Variants) =>
    shouldReduceMotion
      ? {}
      : { initial: "hidden" as const, whileInView: "visible" as const, viewport: { once: true, amount: 0.2 }, variants };

  return (
    <>
      <SEO
        title={t("seo.title")}
        description={t("seo.description")}
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "GovernmentOrganization",
          name: "Instituto de Investigação Veterinária",
          alternateName: "IIV",
          url: BASE_URL,
          areaServed: "Angola",
          parentOrganization: { "@type": "GovernmentOrganization", name: "Ministério da Agricultura e Pescas" },
        }}
      />
      {/* HERO SLIDESHOW */}
      <HeroSlideshow />

      {/* STATS RIBBON — REALTIME */}
      <LiveStats />


      {/* EDITORIAL INTRO */}
      <motion.section className="py-24 md:py-36 overflow-hidden" {...reveal(fadeInUp)}>
        <div className="container">
          <div className="grid gap-16 lg:grid-cols-12 items-center">
            <motion.div className="lg:col-span-5 relative" variants={shouldReduceMotion ? undefined : fadeInUp}>
              <div className="absolute -inset-x-6 -top-10 -bottom-10 -z-10 rounded-[2.5rem] gradient-green-gold opacity-[0.08] blur-2xl" />
              <div className="relative rounded-[1.75rem] overflow-hidden shadow-2xl">
                <img
                  src={editorialLab}
                  alt=""
                  className="aspect-[4/5] w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--iiv-green-dark))]/50 via-transparent to-transparent" />
              </div>
              <motion.div
                className="absolute -bottom-8 -right-6 sm:-right-10 flex items-center gap-3 rounded-2xl bg-card border border-border/60 shadow-2xl p-4 pr-6 max-w-[240px]"
                initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9, y: 10 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.2 }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-green text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-serif text-xl leading-none">{t("editorial.badgeValue", "60+")}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{t("editorial.badgeLabel", "anos ao serviço da pecuária angolana")}</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div className="lg:col-span-6 lg:col-start-7 space-y-7" variants={shouldReduceMotion ? undefined : fadeInUp}>
              <div>
                <p className="kicker text-[hsl(var(--iiv-gold-text))]">
                  <span className="editorial-rule mr-3" /> {t("editorial.kicker")}
                </p>
                <h2 className="font-serif text-4xl md:text-6xl mt-6 leading-[1.02] tracking-tight">
                  {t("editorial.title")}
                </h2>
              </div>
              <p className="lead">
                {t("editorial.lead")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("editorial.body")}
              </p>
              <Link
                to="/sobre"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors h-12 px-6 rounded-xl"
              >
                {t("editorial.cta")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* SERVIÇOS */}
      <motion.section className="section-divider py-24 md:py-32 bg-accent/30" {...reveal(fadeInUp)}>
        <div className="container">
          <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-xl">
              <p className="kicker text-[hsl(var(--iiv-gold-text))]"><span className="editorial-rule mr-3" /> {t("services.kicker")}</p>
              <h2 className="font-serif text-4xl md:text-5xl mt-5">{t("services.title")}</h2>
            </div>
            <Link to="/servicos" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
              {t("services.viewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <motion.div className="grid gap-6 md:grid-cols-12" {...reveal(staggerContainer)}>
            {/* Card grande — imersivo, texto sobre a imagem */}
            <motion.div className="md:col-span-7" variants={shouldReduceMotion ? undefined : fadeInUp}>
              <Link to="/servicos" className="group relative overflow-hidden rounded-2xl block h-full min-h-[420px] shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <img src={services[0].image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--iiv-green-dark))] via-[hsl(var(--iiv-green-dark))]/50 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-8 text-primary-foreground">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                      <Microscope className="h-4.5 w-4.5" />
                    </div>
                    <span className="kicker text-[hsl(var(--iiv-gold))]">{t("services.featuredLabel")}</span>
                  </div>
                  <h3 className="font-serif text-3xl md:text-4xl mb-3 leading-tight">{services[0].title}</h3>
                  <p className="opacity-80 leading-relaxed max-w-md">{services[0].desc}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                    {t("services.learnMore")}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* 3 cards médios — numerados */}
            <motion.div className="md:col-span-5 grid gap-6" {...reveal(staggerContainer)}>
              {services.slice(1).map((svc, i) => (
                <motion.div key={svc.title} variants={shouldReduceMotion ? undefined : fadeInUp}>
                  <Link
                    to="/servicos"
                    className="group relative flex gap-5 p-5 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 items-center"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                      <img src={svc.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      <span className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-md bg-card/90 backdrop-blur-sm text-[10px] font-mono font-semibold text-[hsl(var(--iiv-gold-text))]">
                        {String(i + 2).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <svc.icon className="h-4 w-4 text-[hsl(var(--iiv-gold-text))]" />
                        <span className="kicker text-muted-foreground">{t("services.itemLabel")}</span>
                      </div>
                      <h3 className="font-serif text-lg leading-tight">{svc.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{svc.desc}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* MANIFESTO SPLIT */}
      <motion.section className="section-divider py-24 md:py-32 overflow-hidden" {...reveal(fadeInUp)}>
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2 items-stretch">
            <div className="relative overflow-hidden rounded-2xl shadow-xl min-h-[360px]">
              <img src={heroCtaVet} alt="Investigação no terreno em Angola" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--iiv-green-dark))]/40 to-transparent" />
            </div>
            <div className="relative flex flex-col justify-center rounded-2xl bg-accent/30 p-10 lg:p-14 overflow-hidden">
              <Quote className="absolute -top-4 right-8 h-32 w-32 text-[hsl(var(--iiv-gold))]/10 -z-0" strokeWidth={1} />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl gradient-gold shadow-lg mb-6">
                <Quote className="h-5 w-5 text-secondary-foreground" strokeWidth={2} />
              </div>
              <p className="relative font-serif text-2xl md:text-3xl leading-[1.3] tracking-tight">
                {t("manifesto.quote")}
              </p>
              <div className="relative mt-8 flex items-center gap-4">
                <div className="h-px w-12 bg-[hsl(var(--iiv-gold))]" />
                <div>
                  <p className="font-semibold text-sm">{t("manifesto.author")}</p>
                  <p className="text-xs text-muted-foreground">{t("manifesto.authorRole")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* PARCEIROS */}
      <PartnersBar />

      {/* NOTÍCIAS */}
      <motion.section className="section-divider py-24 md:py-32 bg-accent/30" {...reveal(fadeInUp)}>
        <div className="container">
          <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="kicker text-[hsl(var(--iiv-gold-text))]"><span className="editorial-rule mr-3" /> {t("news.kicker")}</p>
              <h2 className="font-serif text-4xl md:text-5xl mt-5">{t("news.title")}</h2>
            </div>
            <Link to="/noticias" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
              {t("news.viewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <motion.div className="grid gap-8 md:grid-cols-3" {...reveal(staggerContainer)}>
            {loadingNoticias ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))
            ) : errorNoticias ? (
              <ErrorState className="col-span-3" />
            ) : noticias.length === 0 ? (
              <p className="col-span-3 text-center text-muted-foreground py-12">{t("news.empty")}</p>
            ) : (
              noticias.map((n, i) => (
                <motion.div key={n.id} variants={shouldReduceMotion ? undefined : fadeInUp}>
                  <Link to={`/noticias/${n.slug}`} className="group block rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={noticiaImage(n.image_path, i)}
                        alt={n.titulo}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center rounded-full bg-[hsl(var(--iiv-gold-light))] dark:bg-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--iiv-gold-text))]">
                          {n.categoria}
                        </span>
                        <time className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{fmtData(n.published_at ?? n.created_at)}</time>
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl leading-tight group-hover:text-primary transition-colors">
                        {n.titulo}
                      </h3>
                      {n.resumo && <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{n.resumo}</p>}
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>

        </div>
      </motion.section>

      {/* CTA */}
      <motion.section className="relative overflow-hidden gradient-green text-primary-foreground" {...reveal(fadeInUp)}>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[hsl(var(--iiv-gold))]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[420px] h-[420px] rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="container relative py-24 md:py-32">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div>
              {/* --iiv-gold (não -text): secção CTA usa gradient-green, fundo escuro. */}
              <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3 bg-[hsl(var(--iiv-gold))]" /> {t("cta.kicker")}</p>
              <h2 className="font-serif text-4xl md:text-6xl mt-5 leading-[1.02] tracking-tight">
                {t("cta.title")}
              </h2>
            </div>
            <div className="md:pl-10 space-y-6">
              <p className="text-base md:text-lg opacity-80 leading-relaxed">
                {t("cta.body")}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="gradient-gold text-secondary-foreground hover:opacity-90 h-12 px-6 rounded-xl text-sm font-semibold">
                  <Link to="/contactos">{t("cta.contact")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-primary-foreground/25 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 h-12 px-6 rounded-xl text-sm">
                  <Link to="/servicos">{t("cta.services")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
