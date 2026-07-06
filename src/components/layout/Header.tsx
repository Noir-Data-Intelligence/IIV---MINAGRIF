import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Sobre o IIV", path: "/sobre" },
  { label: "Serviços", path: "/servicos" },
  { label: "Notícias", path: "/noticias" },
  { label: "Legislação", path: "/legislacao" },
  { label: "Contactos", path: "/contactos" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="gradient-primary text-primary-foreground">
        <div className="container flex h-9 items-center justify-between text-xs font-medium tracking-wide">
          <span className="opacity-80">Instituto de Investigação Veterinária — República de Angola</span>
          <Link to="/login" className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
            Área Restrita <ChevronRight className="h-3 w-3" />
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
                {item.label}
                {location.pathname === item.path && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
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
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
