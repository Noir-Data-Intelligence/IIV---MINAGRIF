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

export function PageHero({ kicker, title, lead, image, breadcrumb, align = "left" }: PageHeroProps) {
  const { t } = useTranslation("common");
  const prefersReducedMotion = useReducedMotion();
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;

  return (
    <section className="relative isolate overflow-hidden bg-[hsl(var(--iiv-green-dark))] text-primary-foreground">
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--iiv-green-dark))] via-[hsl(var(--iiv-green-dark))]/85 to-[hsl(var(--iiv-green-dark))]/55" />
        </>
      )}
      <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-[hsl(var(--iiv-gold))]/10 blur-3xl" aria-hidden />

      <div className={cn("container relative py-20 md:py-28", align === "center" && "text-center")}>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            className={cn(
              "mb-6 flex items-center gap-1.5 text-xs text-primary-foreground/60",
              align === "center" && "justify-center",
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

        <motion.div initial="hidden" animate="visible" variants={revealVariants}>
          {/* --iiv-gold (não a variante -text) — este kicker está sempre sobre o fundo
              verde escuro do hero (bg-[hsl(var(--iiv-green-dark))]), nunca sobre claro,
              pelo que o dourado base já contrasta bem (~7.9:1) sem escurecer. */}
          {kicker && (
            <div className={cn("kicker mb-5 text-[hsl(var(--iiv-gold))]", align === "center" && "flex justify-center")}>
              <span className="inline-block h-px w-8 align-middle bg-[hsl(var(--iiv-gold))]" />
              <span className="ml-3">{kicker}</span>
            </div>
          )}

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-tight max-w-3xl">
            {title}
          </h1>

          {lead && (
            <p
              className={cn(
                "mt-6 max-w-2xl text-base md:text-lg opacity-80 leading-relaxed",
                align === "center" && "mx-auto",
              )}
            >
              {lead}
            </p>
          )}
        </motion.div>

        <div
          className={cn(
            "mt-10 h-px w-16 bg-[hsl(var(--iiv-gold))]/70",
            align === "center" && "mx-auto",
          )}
        />
      </div>
    </section>
  );
}
