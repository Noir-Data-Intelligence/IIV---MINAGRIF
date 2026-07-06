import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="gradient-primary text-primary-foreground">
        <div className="container flex h-9 items-center justify-between text-xs font-medium tracking-wide">
          <span className="opacity-80">Instituto de Investigação Veterinária — República de Angola</span>
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
              <p className="font-serif text-base leading-tight tracking-tight">Instituto de Investigação</p>
              <p className="font-serif text-base leading-tight tracking-tight text-primary">Veterinária</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {t(item.key)}
                {location.pathname === item.path && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
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
      {mobileMenuOpen && (
        <nav className="lg:hidden glass-strong border-t shadow-elevated">
          <div className="container flex flex-col gap-1 py-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
