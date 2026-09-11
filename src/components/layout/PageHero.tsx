import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";

interface PageHeroProps {
  kicker?: string;
  title: string;
  lead?: string;
  image?: string;
  breadcrumb?: { label: string; href?: string }[];
  align?: "left" | "center";
}

/**
 * Hero de página interna — layout dividido (imagem + painel de texto sólido)
 * replicando directamente a anatomia do hero do site de referência
 * (uchile.cl): banda a toda a largura, imagem estática à esquerda, painel de
 * cor sólida à direita com título, pequena barra de destaque e um parágrafo
 * de apoio. Sem imagem, o painel ocupa a largura toda (mantém o mesmo
 * vocabulário visual nas páginas ainda sem fotografia própria).
 */
export function PageHero({ kicker, title, lead, image, breadcrumb, align = "left" }: PageHeroProps) {
  const { t } = useTranslation("common");
  const prefersReducedMotion = useReducedMotion();
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;

  return (
    <section className="relative isolate bg-[hsl(var(--iiv-green-dark))] text-primary-foreground">
      <div
        className={cn(
          "grid lg:h-[380px]",
          image ? "lg:grid-cols-[1.6fr_1fr]" : "grid-cols-1 min-h-[320px] md:min-h-[380px]",
        )}
      >
        {image && (
          <div className="relative order-1 h-56 overflow-hidden md:h-72 lg:h-full">
            <img src={image} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className={cn("relative order-2 flex flex-col justify-center px-6 py-12 md:px-12 md:py-16", align === "center" && !image && "items-center text-center")}>
          {breadcrumb && breadcrumb.length > 0 && (
            <nav
              className={cn(
                "mb-5 flex flex-wrap items-center gap-1.5 text-xs text-primary-foreground/60",
                align === "center" && !image && "justify-center",
              )}
              aria-label={t("breadcrumb.ariaLabel")}
            >
              <Link to="/" className="hover:text-primary-foreground transition-colors">
                {t("breadcrumb.home")}
              </Link>
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 opacity-50" />
                  {b.href ? (
                    <Link to={b.href} className="hover:text-primary-foreground transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-primary-foreground/90">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          <motion.div initial="hidden" animate="visible" variants={revealVariants} className={cn("max-w-xl", align === "center" && !image && "mx-auto")}>
            {kicker && (
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[hsl(var(--iiv-gold))]">
                {kicker}
              </p>
            )}

            <h1 className="font-sans text-2xl md:text-3xl font-bold uppercase tracking-tight leading-[1.15]">
              {title}
            </h1>

            <span className={cn("mt-4 block h-1 w-14 bg-[hsl(var(--iiv-gold))]", align === "center" && !image && "mx-auto")} />

            {lead && <p className="mt-5 text-sm md:text-base leading-relaxed text-primary-foreground/85">{lead}</p>}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
