import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Youtube, Twitter, Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Main footer */}
      <div className="gradient-primary text-primary-foreground">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full border border-primary-foreground" />
          <div className="absolute bottom-10 left-10 h-60 w-60 rounded-full border border-primary-foreground" />
        </div>

        <div className="container relative py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 font-serif font-bold text-lg">
                  IIV
                </div>
                <div>
                  <p className="font-serif text-sm leading-tight">Instituto de Investigação</p>
                  <p className="font-serif text-sm leading-tight opacity-70">Veterinária</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed opacity-70 max-w-xs">
                Instituição pública dedicada à investigação, diagnóstico e produção no domínio da saúde animal em Angola.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">Navegação</h4>
              <ul className="space-y-2.5">
                {[
                  { to: "/sobre", label: "Sobre o IIV" },
                  { to: "/servicos", label: "Serviços" },
                  { to: "/legislacao", label: "Legislação" },
                  { to: "/noticias", label: "Notícias" },
                ].map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1 group">
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><Link to="/termos" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Política de Privacidade</Link></li>
                <li><Link to="/legislacao" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Legislação Aplicável</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">Contactos</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-sm opacity-70">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Luanda, Angola</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm opacity-70">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>+244 222 000 000</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm opacity-70">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>info@iiv.gov.ao</span>
                </li>
              </ul>

              {/* Social */}
              <div className="mt-5 flex gap-2">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Twitter, label: "X" },
                  { icon: Instagram, label: "Instagram" },
                  { icon: Linkedin, label: "LinkedIn" },
                  { icon: Youtube, label: "YouTube" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/5 hover:bg-primary-foreground/10 transition-colors"
                  >
                    <s.icon className="h-4 w-4 opacity-70" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[hsl(152_48%_10%)] text-primary-foreground">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-50">
          <span>© {new Date().getFullYear()} Instituto de Investigação Veterinária</span>
          <span>Todos os direitos reservados</span>
        </div>
      </div>
    </footer>
  );
}
