import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { fadeInUp, staggerContainer } from "@/lib/motion";

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

const navItems = [
  { key: "home", path: "/" },
  { key: "about", path: "/sobre" },
  { key: "services", path: "/servicos" },
  { key: "news", path: "/noticias" },
  { key: "legislation", path: "/legislacao" },
  { key: "contacts", path: "/contactos" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

      {/* Main nav */}
      <div className="glass-strong shadow-elegant">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground font-serif font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
              IIV
            </div>
            <div className="hidden sm:block">
              <p className="font-serif text-base leading-tight tracking-tight">{t("orgNameLine1")}</p>
              <p className="font-serif text-base leading-tight tracking-tight text-primary">{t("orgNameLine2")}</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="header-nav-indicator"
                      className="absolute inset-0 rounded-lg bg-accent"
                      transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-1 lg:hidden">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
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
              {navItems.map((item) => (
                <motion.div key={item.path} variants={prefersReducedMotion ? undefined : fadeInUp}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {t(item.key)}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
