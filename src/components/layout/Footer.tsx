import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Newspaper, CalendarDays, Scale, PhoneCall } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";
import i18n from "@/i18n";
import ptFooter from "@/i18n/locales/pt/public/footer.json";
import enFooter from "@/i18n/locales/en/public/footer.json";
import ptPartners from "@/i18n/locales/pt/public/partners.json";
import enPartners from "@/i18n/locales/en/public/partners.json";

// Namespace "footer" não faz parte do bundle central (src/i18n/index.ts, que só
// regista "common"/"nav"). Registamo-lo aqui em runtime para manter este componente
// autónomo sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "footer")) i18n.addResourceBundle("pt", "footer", ptFooter, true, true);
if (!i18n.hasResourceBundle("en", "footer")) i18n.addResourceBundle("en", "footer", enFooter, true, true);
// Reaproveita o mesmo namespace "partners" que PartnersBar.tsx já regista.
if (!i18n.hasResourceBundle("pt", "partners")) i18n.addResourceBundle("pt", "partners", ptPartners, true, true);
if (!i18n.hasResourceBundle("en", "partners")) i18n.addResourceBundle("en", "partners", enPartners, true, true);

const PARTNER_KEYS = ["fao", "oie", "minagrip", "uan", "sadc", "oms"] as const;

/**
 * Rodapé — réplica directa da anatomia do site de referência (uchile.cl):
 * barra de acessos rápidos com ícones, faixa fina de links secundários,
 * bloco principal (morada à esquerda / parcerias institucionais à direita,
 * no lugar dos selos de acreditação que não têm equivalente na IIV) e barra
 * final de direitos de autor.
 */
export function Footer() {
  const { t } = useTranslation("footer");
  const { t: tPartners } = useTranslation("partners");
  const prefersReducedMotion = useReducedMotion();
  const revealVariants = prefersReducedMotion ? {} : fadeInUp;

  const quickLinks = [
    { to: "/noticias", label: t("quickLinks.news"), icon: Newspaper },
    { to: "/agenda", label: t("quickLinks.agenda"), icon: CalendarDays },
    { to: "/legislacao", label: t("quickLinks.legislation"), icon: Scale },
    { to: "/contactos", label: t("quickLinks.contacts"), icon: PhoneCall },
  ];

  const secondaryLinks = [
    { to: "/sobre", label: t("secondaryLinks.about") },
    { to: "/laboratorios", label: t("secondaryLinks.labs") },
    { to: "/servicos", label: t("secondaryLinks.services") },
    { to: "/termos", label: t("secondaryLinks.terms") },
    { to: "/privacidade", label: t("secondaryLinks.privacy") },
  ];

  return (
    <footer className="relative">
      {/* Barra de acessos rápidos */}
      <div className="bg-[hsl(var(--iiv-green-dark))] text-primary-foreground">
        <div className="container grid grid-cols-2 sm:grid-cols-4 divide-x divide-primary-foreground/10">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center justify-center gap-2 py-4 text-sm font-semibold hover:bg-primary-foreground/5 transition-colors"
              >
                <Icon className="h-4 w-4 text-[hsl(var(--iiv-gold))]" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Faixa fina de links secundários */}
      <div className="bg-[hsl(152_48%_10%)] text-primary-foreground/70 border-t border-primary-foreground/10">
        <div className="container flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 text-xs">
          {secondaryLinks.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-primary-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bloco principal — morada / parcerias */}
      <div className="gradient-primary text-primary-foreground">
        <motion.div
          className="container py-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={revealVariants}
        >
          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 font-serif font-bold text-lg">
                  IIV
                </div>
                <div>
                  <p className="font-serif text-sm leading-tight">{t("brand.orgNameLine1")}</p>
                  <p className="font-serif text-sm leading-tight opacity-70">{t("brand.orgNameLine2")}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed opacity-70 max-w-sm">{t("brand.description")}</p>
              <ul className="space-y-2.5 pt-2">
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
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4">{t("partners.heading")}</h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {PARTNER_KEYS.map((key) => (
                  <li key={key} className="text-sm opacity-70">
                    {tPartners(`items.${key}.name`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[hsl(152_48%_8%)] text-primary-foreground">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-50">
          <span>© {new Date().getFullYear()} {t("bottom.copyright")}</span>
          <span>{t("bottom.rights")}</span>
        </div>
      </div>
    </footer>
  );
}
