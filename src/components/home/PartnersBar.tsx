import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptPartners from "@/i18n/locales/pt/public/partners.json";
import enPartners from "@/i18n/locales/en/public/partners.json";
import partnersTexture from "@/assets/partners/partners-texture.webp";

// Namespace "partners" não faz parte do bundle central (src/i18n/index.ts, que só
// regista "common"/"nav"). Registamo-lo aqui em runtime para manter este componente
// autónomo sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "partners")) i18n.addResourceBundle("pt", "partners", ptPartners, true, true);
if (!i18n.hasResourceBundle("en", "partners")) i18n.addResourceBundle("en", "partners", enPartners, true, true);

const partnerKeys = ["fao", "oie", "minagrip", "uan", "sadc", "oms"] as const;

export function PartnersBar() {
  const { t } = useTranslation("partners");
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = prefersReducedMotion ? {} : staggerContainer;
  const itemVariants = prefersReducedMotion ? {} : fadeInUp;

  return (
    <section className="section-divider relative py-16 md:py-20 overflow-hidden">
      <img
        src={partnersTexture}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.06] dark:opacity-[0.08] pointer-events-none"
        loading="lazy"
      />
      <div className="container relative">
        <div className="text-center mb-10">
          <p className="kicker text-[hsl(var(--iiv-gold-text))] justify-center inline-flex">
            <span className="editorial-rule mr-3" /> {t("kicker")}
          </p>
          <h2 className="font-serif text-2xl md:text-3xl mt-4">
            {t("title")}
          </h2>
        </div>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border rounded-2xl overflow-hidden border border-border/60"
          role="list"
          aria-label={t("ariaLabel")}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          {partnerKeys.map((key) => (
            <motion.div
              key={key}
              role="listitem"
              title={t(`items.${key}.desc`)}
              className="bg-card aspect-[3/2] flex flex-col items-center justify-center p-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              variants={itemVariants}
            >
              <p className="font-serif text-xl md:text-2xl text-primary tracking-tight">{t(`items.${key}.name`)}</p>
              <p className="text-[10px] text-muted-foreground text-center mt-1 line-clamp-2 uppercase tracking-wider">
                {t(`items.${key}.desc`)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
