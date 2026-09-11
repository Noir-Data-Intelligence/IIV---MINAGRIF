import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";
import i18n from "@/i18n";
import ptFooter from "@/i18n/locales/pt/public/footer.json";
import enFooter from "@/i18n/locales/en/public/footer.json";

// Namespace "footer" não faz parte do bundle central (src/i18n/index.ts, que só
// regista "common"/"nav"). Registamo-lo aqui em runtime para manter este componente
// autónomo sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "footer")) i18n.addResourceBundle("pt", "footer", ptFooter, true, true);
if (!i18n.hasResourceBundle("en", "footer")) i18n.addResourceBundle("en", "footer", enFooter, true, true);

export function Footer() {
  const { t } = useTranslation("footer");
  const prefersReducedMotion = useReducedMotion();
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;

  const navLinks = [
    { to: "/sobre", label: t("nav.links.about") },
    { to: "/sobre/estacoes-zootecnicas", label: t("nav.links.stations") },
    { to: "/laboratorios", label: t("nav.links.labs") },
    { to: "/servicos", label: t("nav.links.services") },
    { to: "/noticias", label: t("nav.links.news") },
    { to: "/agenda", label: t("nav.links.agenda") },
  ];

  return (
    <footer className="relative overflow-hidden">
      {/* Main footer */}
      <div className="gradient-primary text-primary-foreground">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full border border-primary-foreground" />
          <div className="absolute bottom-10 left-10 h-60 w-60 rounded-full border border-primary-foreground" />
        </div>

        <motion.div
          className="container relative py-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={revealVariants}
        >
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 font-serif font-bold text-lg">
                  IIV
                </div>
                <div>
                  <p className="font-serif text-sm leading-tight">{t("brand.orgNameLine1")}</p>
                  <p className="font-serif text-sm leading-tight opacity-70">{t("brand.orgNameLine2")}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed opacity-70 max-w-xs">
                {t("brand.description")}
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">{t("nav.heading")}</h4>
              <ul className="space-y-2.5">
                {navLinks.map((link) => (
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
              <h4 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">{t("legal.heading")}</h4>
              <ul className="space-y-2.5">
                <li><Link to="/termos" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t("legal.terms")}</Link></li>
                <li><Link to="/privacidade" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t("legal.privacy")}</Link></li>
                <li><Link to="/legislacao" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t("legal.legislation")}</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">{t("contact.heading")}</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-sm opacity-70">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t("contact.address")}</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm opacity-70">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{t("contact.phone")}</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm opacity-70">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{t("contact.email")}</span>
                </li>
              </ul>

              {/* TODO: adicionar redes sociais reais quando confirmadas (ver PLANO-ATUALIZACAO-FRONTEND.txt secao 9, decisao D5) */}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[hsl(152_48%_10%)] text-primary-foreground">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-50">
          <span>© {new Date().getFullYear()} {t("bottom.copyright")}</span>
          <span>{t("bottom.rights")}</span>
        </div>
      </div>
    </footer>
  );
}
