import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Variant local (não exportado) para o menu mobile: expande/recolhe altura + fade, curto e subtil. */
const mobileNavVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/**
 * Nav de nível único (6 itens planos) substituída por uma árvore de 2 níveis,
 * inspirada na estrutura multinível do site de referência (uchile.cl),
 * adaptada ao propósito real do IIV — instituto de investigação/diagnóstico,
 * não faculdade universitária (sem secções de admissão/graduação).
 */
interface NavChild {
  key: string;
  path: string;
}
interface NavItem {
  key: string;
  path?: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { key: "home", path: "/" },
  {
    key: "institute",
    children: [
      { key: "about", path: "/sobre" },
      { key: "stations", path: "/sobre/estacoes-zootecnicas" },
    ],
  },
  { key: "labs", path: "/laboratorios" },
  { key: "services", path: "/servicos" },
  {
    key: "newsActivity",
    children: [
      { key: "news", path: "/noticias" },
      { key: "agenda", path: "/agenda" },
    ],
  },
  { key: "legislation", path: "/legislacao" },
  { key: "contacts", path: "/contactos" },
];

/** Um item de grupo está "activo" quando a rota actual coincide com algum dos filhos. */
function isGroupActive(item: NavItem, pathname: string): boolean {
  if (item.path) return pathname === item.path;
  return (item.children ?? []).some((c) => pathname === c.path);
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileGroupOpen, setMobileGroupOpen] = useState<string | null>(null);
  const location = useLocation();
  const { t } = useTranslation("nav");
  const prefersReducedMotion = useReducedMotion();
  const navVariants = prefersReducedMotion ? {} : mobileNavVariants;

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="gradient-primary text-primary-foreground">
        <div className="container flex h-9 items-center justify-between text-xs font-medium tracking-wide">
          <span className="opacity-80">{t("topBar")}</span>
          <Link to="/login" className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
            {t("restrictedArea")} <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Logo row — replica a "fila do logótipo" do site de referência (uchile.cl):
          crachá + nome à esquerda, utilidades à direita, sem o menu principal
          nesta linha (o menu vive na faixa de separadores abaixo). */}
      <div className="bg-background border-b border-border/60">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground font-serif font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
              IIV
            </div>
            <div>
              <p className="font-serif text-lg leading-tight tracking-tight">{t("orgNameLine1")}</p>
              <p className="font-serif text-lg leading-tight tracking-tight text-primary">{t("orgNameLine2")}</p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Faixa de separadores — réplica directa da barra PORTADA/ADMISIÓN/... do
          site de referência: maiúsculas, sublinhado dourado no item activo,
          fundo sólido em vez dos pills arredondados usados anteriormente. */}
      <div className="hidden lg:block bg-background border-b border-border shadow-sm">
        <nav className="container flex items-center gap-1">
          {navItems.map((item) => {
            const active = isGroupActive(item, location.pathname);
            const tabClass = cn(
              "relative flex items-center gap-1 px-4 py-3.5 text-[13px] font-bold uppercase tracking-wide transition-colors duration-200 outline-none border-b-2",
              active
                ? "text-primary border-[hsl(var(--iiv-gold))]"
                : "text-foreground/80 border-transparent hover:text-primary hover:border-[hsl(var(--iiv-gold))]/50",
            );
            if (item.children) {
              return (
                <DropdownMenu key={item.key}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={tabClass}>
                      <span>{t(item.key)}</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-48 rounded-none border-t-2 border-t-[hsl(var(--iiv-gold))]">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.path} asChild>
                        <Link to={child.path} className="cursor-pointer">
                          {t(child.key)}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            return (
              <Link key={item.path} to={item.path as string} className={tabClass}>
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            key="mobile-nav"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={navVariants}
            className="lg:hidden glass-strong border-t shadow-elevated overflow-hidden"
          >
            <motion.div
              className="container flex flex-col gap-1 py-3"
              variants={prefersReducedMotion ? undefined : staggerContainer}
              initial={prefersReducedMotion ? undefined : "hidden"}
              animate={prefersReducedMotion ? undefined : "visible"}
            >
              {navItems.map((item) => {
                if (item.children) {
                  const expanded = mobileGroupOpen === item.key;
                  return (
                    <motion.div key={item.key} variants={prefersReducedMotion ? undefined : fadeInUp}>
                      <button
                        type="button"
                        onClick={() => setMobileGroupOpen(expanded ? null : item.key)}
                        className={cn(
                          "flex w-full items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isGroupActive(item, location.pathname)
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                        )}
                      >
                        {t(item.key)}
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pl-4"
                          >
                            {item.children.map((child) => (
                              <Link
                                key={child.path}
                                to={child.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                  "block px-4 py-2 rounded-lg text-sm transition-colors",
                                  location.pathname === child.path
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                                )}
                              >
                                {t(child.key)}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                }
                return (
                  <motion.div key={item.path} variants={prefersReducedMotion ? undefined : fadeInUp}>
                    <Link
                      to={item.path as string}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        location.pathname === item.path
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      {t(item.key)}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
