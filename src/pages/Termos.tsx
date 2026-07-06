import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { fadeInUp } from "@/lib/motion";
import heroLab from "@/assets/hero/hero-lab.jpg";
import i18n from "@/i18n";
import ptTermos from "@/i18n/locales/pt/public/termos.json";
import enTermos from "@/i18n/locales/en/public/termos.json";

// Namespace "termos" não faz parte do bundle central (src/i18n/index.ts, que só
// regista "common"/"nav"). Registamo-lo aqui em runtime para manter esta página
// autónoma sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "termos")) i18n.addResourceBundle("pt", "termos", ptTermos, true, true);
if (!i18n.hasResourceBundle("en", "termos")) i18n.addResourceBundle("en", "termos", enTermos, true, true);

const sectionKeys = ["scope", "use", "ip", "liability", "changes"] as const;

export default function Termos() {
  const { t } = useTranslation("termos");
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <SEO
        title={t("seo.title")}
        description={t("seo.description")}
        path="/termos"
      />
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        lead={t("hero.lead")}
        image={heroLab}
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />
      <section className="py-20">
        <motion.div
          className="container max-w-3xl prose-sm space-y-8"
          initial={shouldReduceMotion ? undefined : "hidden"}
          animate={shouldReduceMotion ? undefined : "visible"}
          variants={shouldReduceMotion ? undefined : fadeInUp}
        >
          {sectionKeys.map((key) => (
            <article key={key}>
              <h2 className="font-serif text-2xl mb-3">{t(`sections.${key}.title`)}</h2>
              <p className="text-muted-foreground leading-relaxed">{t(`sections.${key}.body`)}</p>
            </article>
          ))}
          <p className="text-xs text-muted-foreground mt-12">{t("lastUpdated")}</p>
        </motion.div>
      </section>
    </>
  );
}
