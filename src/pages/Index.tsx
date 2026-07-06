import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowUpRight, Microscope, Syringe, FlaskConical, BookOpen, Quote } from "lucide-react";
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
import heroCampo from "@/assets/hero/hero-campo.jpg";
import heroLab from "@/assets/hero/hero-lab.jpg";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";
import heroVacinas from "@/assets/hero/hero-vacinas.jpg";

// Namespace "home" não faz parte do bundle central (src/i18n/index.ts, que só
// regista "common"/"nav"). Registamo-lo aqui em runtime para manter esta página
// autónoma sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "home")) i18n.addResourceBundle("pt", "home", homePt, true, true);
if (!i18n.hasResourceBundle("en", "home")) i18n.addResourceBundle("en", "home", homeEn, true, true);

const serviceIcons = [Microscope, Syringe, FlaskConical, BookOpen];
const serviceImages = [heroLab, heroVacinas, heroInvestigacao, heroCampo];

const fallbackImages = [heroVacinas, heroInvestigacao, heroLab];
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
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-12 items-start">
            <div className="md:col-span-5">
              <p className="kicker text-[hsl(var(--iiv-gold))]">
                <span className="editorial-rule mr-3" /> {t("editorial.kicker")}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl mt-6 leading-[1.05]">
                {t("editorial.title")}
              </h2>
            </div>
            <div className="md:col-span-6 md:col-start-7 space-y-6">
              <p className="lead">
                {t("editorial.lead")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("editorial.body")}
              </p>
              <Link to="/sobre" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
                {t("editorial.cta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <motion.section className="section-divider py-24 md:py-32 bg-accent/30" {...reveal(fadeInUp)}>
        <div className="container">
          <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-xl">
              <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> {t("services.kicker")}</p>
              <h2 className="font-serif text-4xl md:text-5xl mt-5">{t("services.title")}</h2>
            </div>
            <Link to="/servicos" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
              {t("services.viewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <motion.div className="grid gap-6 md:grid-cols-12" {...reveal(staggerContainer)}>
            {/* Card grande */}
            <motion.div className="md:col-span-7" variants={shouldReduceMotion ? undefined : fadeInUp}>
              <Link to="/servicos" className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover-lift block h-full">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={services[0].image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-7">
                  <div className="flex items-center gap-3 mb-3">
                    <Microscope className="h-5 w-5 text-[hsl(var(--iiv-gold))]" />
                    <span className="kicker text-muted-foreground">{t("services.featuredLabel")}</span>
                  </div>
                  <h3 className="font-serif text-2xl md:text-3xl mb-2">{services[0].title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-md">{services[0].desc}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    {t("services.learnMore")} <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* 3 cards médios */}
            <motion.div className="md:col-span-5 grid gap-6" {...reveal(staggerContainer)}>
              {services.slice(1).map((svc) => (
                <motion.div key={svc.title} variants={shouldReduceMotion ? undefined : fadeInUp}>
                  <Link
                    to="/servicos"
                    className="group flex gap-5 p-5 rounded-2xl border border-border/50 bg-card hover-lift items-center"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                      <img src={svc.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <svc.icon className="h-4 w-4 text-[hsl(var(--iiv-gold))]" />
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
      <motion.section className="section-divider py-24 md:py-32" {...reveal(fadeInUp)}>
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="relative overflow-hidden rounded-2xl">
              <img src={heroCampo} alt="Investigação no terreno em Angola" className="aspect-[4/5] w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--iiv-green-dark))]/40 to-transparent" />
            </div>
            <div className="lg:pl-10">
              <Quote className="h-10 w-10 text-[hsl(var(--iiv-gold))] mb-6" strokeWidth={1} />
              <p className="font-serif text-2xl md:text-3xl leading-[1.3] tracking-tight">
                {t("manifesto.quote")}
              </p>
              <div className="mt-8 flex items-center gap-4">
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
              <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3" /> {t("news.kicker")}</p>
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
                  <Link to={`/noticias/${n.slug}`} className="group">
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
                </motion.div>
              ))
            )}
          </motion.div>

        </div>
      </motion.section>

      {/* CTA */}
      <motion.section className="relative overflow-hidden gradient-green text-primary-foreground" {...reveal(fadeInUp)}>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[hsl(var(--iiv-gold))]/10 blur-3xl" />
        <div className="container relative py-24 md:py-32">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div>
              <p className="kicker text-[hsl(var(--iiv-gold))]"><span className="editorial-rule mr-3 bg-[hsl(var(--iiv-gold))]" /> {t("cta.kicker")}</p>
              <h2 className="font-serif text-4xl md:text-5xl mt-5 leading-[1.05]">
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
