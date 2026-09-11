import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ChevronRight, ExternalLink, CalendarDays, Microscope, Syringe, FlaskConical, BookOpen,
} from "lucide-react";
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { LiveStats } from "@/components/home/LiveStats";
import { SEO, BASE_URL } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/states/ErrorState";
import { useNoticiasList } from "@/hooks/queries/useNoticias";
import type { NoticiaDto } from "@/types/dto/noticia";
import { LABORATORIOS_PUBLICOS } from "@/data/laboratoriosPublicos";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import homePt from "@/i18n/locales/pt/public/home.json";
import homeEn from "@/i18n/locales/en/public/home.json";
import ptLaboratorios from "@/i18n/locales/pt/public/laboratorios.json";
import enLaboratorios from "@/i18n/locales/en/public/laboratorios.json";
import ptAgenda from "@/i18n/locales/pt/public/agenda.json";
import enAgenda from "@/i18n/locales/en/public/agenda.json";
import heroCampo from "@/assets/hero/hero-cattle-savanna.webp";
import heroLab from "@/assets/hero/hero-lab-microscope.webp";
import heroVacinas from "@/assets/hero/hero-scientist-vaccine.webp";
import noticiaFallback from "@/assets/noticias/noticias-fallback-card-sm.webp";

// Namespaces autónomos, registados em runtime (padrão de todas as páginas públicas).
if (!i18n.hasResourceBundle("pt", "home")) i18n.addResourceBundle("pt", "home", homePt, true, true);
if (!i18n.hasResourceBundle("en", "home")) i18n.addResourceBundle("en", "home", homeEn, true, true);
if (!i18n.hasResourceBundle("pt", "public-laboratorios"))
  i18n.addResourceBundle("pt", "public-laboratorios", ptLaboratorios, true, true);
if (!i18n.hasResourceBundle("en", "public-laboratorios"))
  i18n.addResourceBundle("en", "public-laboratorios", enLaboratorios, true, true);
if (!i18n.hasResourceBundle("pt", "agenda")) i18n.addResourceBundle("pt", "agenda", ptAgenda, true, true);
if (!i18n.hasResourceBundle("en", "agenda")) i18n.addResourceBundle("en", "agenda", enAgenda, true, true);

const serviceIcons = [Microscope, Syringe, FlaskConical, BookOpen];

const promoImages = [heroLab, heroVacinas, heroCampo];

const fallbackImages = [noticiaFallback, heroVacinas, heroCampo];
const noticiaImage = (path: string | null, i: number) =>
  path && /^https?:\/\//.test(path) ? path : fallbackImages[i % fallbackImages.length];

interface InterestLink {
  label: string;
  href: string;
  external: boolean;
}
interface PromoItem {
  title: string;
  cta: string;
  link: string;
}

export default function Index() {
  const { t } = useTranslation("home");
  const { t: tLabs } = useTranslation("public-laboratorios");
  const { t: tAgenda } = useTranslation("agenda");
  const shouldReduceMotion = useReducedMotion();

  const { data, isLoading: loadingNoticias, error: errorNoticias } = useNoticiasList({
    page: 1,
    perPage: 3,
    published: true,
  });

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
  const services = serviceItems.map((item, i) => ({ ...item, icon: serviceIcons[i] }));
  const interestLinks = t("sidebar.interestLinks", { returnObjects: true }) as unknown as InterestLink[];
  const promos = t("sidebar.promos", { returnObjects: true }) as unknown as PromoItem[];
  const agendaPreview = (tAgenda("categories.items", { returnObjects: true }) as unknown as { title: string; text: string }[]).slice(0, 3);

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
      <HeroSlideshow />
      <LiveStats />

      {/* NOTÍCIAS + BARRA LATERAL — réplica directa da anatomia de corpo do
          site de referência (uchile.cl): coluna larga de notícias + coluna
          estreita com agenda, banners de destaque e ligações de interesse. */}
      <section className="py-16 md:py-20">
        <div className="container grid gap-12 lg:grid-cols-12">
          {/* Notícias */}
          <motion.div className="lg:col-span-8" {...reveal(fadeInUp)}>
            <div className="mb-6 flex items-center justify-between border-b-2 border-[hsl(var(--iiv-gold))] pb-3">
              <h2 className="font-sans text-lg font-bold uppercase tracking-wide">{t("news.title")}</h2>
            </div>

            <motion.div className="grid gap-6 sm:grid-cols-3" {...reveal(staggerContainer)}>
              {loadingNoticias ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : errorNoticias ? (
                <ErrorState className="col-span-3" />
              ) : noticias.length === 0 ? (
                <p className="col-span-3 text-muted-foreground py-6">{t("news.empty")}</p>
              ) : (
                noticias.map((n, i) => (
                  <motion.div key={n.id} variants={shouldReduceMotion ? undefined : fadeInUp}>
                    <Link to={`/noticias/${n.slug}`} className="group block">
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        <img
                          src={noticiaImage(n.image_path, i)}
                          alt={n.titulo}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold leading-snug text-primary group-hover:underline">
                        {n.titulo}
                      </h3>
                    </Link>
                  </motion.div>
                ))
              )}
            </motion.div>

            <Link
              to="/noticias"
              className="mt-8 inline-flex items-center gap-2 rounded bg-[hsl(var(--iiv-gold))] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-secondary-foreground hover:opacity-90 transition-opacity"
            >
              {t("news.viewAll")}
            </Link>
          </motion.div>

          {/* Barra lateral */}
          <motion.div className="lg:col-span-4 space-y-8" {...reveal(fadeInUp)}>
            {/* Próximas actividades */}
            <div className="border border-border/60">
              <h2 className="border-b-2 border-[hsl(var(--iiv-gold))] bg-muted/40 px-4 py-3 font-sans text-sm font-bold uppercase tracking-wide">
                {t("sidebar.agendaHeading")}
              </h2>
              <ul className="divide-y divide-border/60">
                {agendaPreview.map((item) => (
                  <li key={item.title}>
                    <Link to="/agenda" className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--iiv-gold-text))]" />
                      <span className="text-sm leading-snug">{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/agenda"
                className="flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wide text-primary hover:underline"
              >
                {t("sidebar.agendaViewAll")} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Banners de destaque */}
            <div className="space-y-3">
              {promos.map((promo, i) => (
                <Link
                  key={promo.link}
                  to={promo.link}
                  className="group relative block h-24 overflow-hidden"
                >
                  <img src={promoImages[i % promoImages.length]} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-[hsl(var(--iiv-green-dark))]/70" />
                  <div className="relative flex h-full flex-col justify-center px-4">
                    <p className="font-sans text-base font-bold uppercase leading-tight text-primary-foreground">{promo.title}</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--iiv-gold))]">
                      {promo.cta} <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Ligações de interesse */}
            <div className="border border-border/60">
              <h2 className="border-b-2 border-[hsl(var(--iiv-gold))] bg-muted/40 px-4 py-3 font-sans text-sm font-bold uppercase tracking-wide">
                {t("sidebar.interestHeading")}
              </h2>
              <ul className="divide-y divide-border/60">
                {interestLinks.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 px-4 py-3 text-sm text-primary hover:underline"
                      >
                        <span className="flex-1">{link.label}</span>
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
                      </a>
                    ) : (
                      <Link to={link.href} className="block px-4 py-3 text-sm text-primary hover:underline">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AS NOSSAS ÁREAS — réplica da grelha "Nuestros Programas de Estudio":
          blocos coloridos com listas de bullets ligadas. */}
      <section className="py-16 md:py-20 bg-muted/20">
        <div className="container">
          <motion.h2 className="mb-8 font-sans text-lg font-bold uppercase tracking-wide" {...reveal(fadeInUp)}>
            {t("areasSection.heading")}
          </motion.h2>
          <motion.div className="grid gap-6 md:grid-cols-2" {...reveal(staggerContainer)}>
            <motion.div variants={shouldReduceMotion ? undefined : fadeInUp} className="bg-[hsl(var(--iiv-green-dark))] text-primary-foreground p-6 md:p-8">
              <h3 className="font-sans text-base font-bold uppercase tracking-wide">{t("areasSection.labsBoxTitle")}</h3>
              <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                {LABORATORIOS_PUBLICOS.map((lab) => (
                  <li key={lab.slug}>
                    <Link
                      to={`/laboratorios/${lab.slug}`}
                      className="flex items-center gap-2 text-sm opacity-85 hover:opacity-100 hover:underline"
                    >
                      <lab.icon className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--iiv-gold))]" />
                      {tLabs(`areas.${lab.slug}.name`)}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/laboratorios" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[hsl(var(--iiv-gold))] hover:gap-2.5 transition-all">
                {t("areasSection.viewAllLabs")} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            <motion.div variants={shouldReduceMotion ? undefined : fadeInUp} className="bg-[hsl(38_75%_32%)] text-primary-foreground p-6 md:p-8">
              <h3 className="font-sans text-base font-bold uppercase tracking-wide">{t("areasSection.servicesBoxTitle")}</h3>
              <ul className="mt-5 space-y-2.5">
                {services.map((svc) => (
                  <li key={svc.title}>
                    <Link to="/servicos" className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100 hover:underline">
                      <svc.icon className="h-3.5 w-3.5 shrink-0" />
                      {svc.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/servicos" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground hover:gap-2.5 transition-all">
                {t("areasSection.viewAllServices")} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
