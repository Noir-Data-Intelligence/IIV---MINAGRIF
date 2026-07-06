import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { PageHero } from "@/components/layout/PageHero";
import { SEO } from "@/components/SEO";
import { fadeInUp } from "@/lib/motion";
import heroInvestigacao from "@/assets/hero/hero-investigacao.jpg";
import i18n from "@/i18n";
import ptPrivacidade from "@/i18n/locales/pt/public/privacidade.json";
import enPrivacidade from "@/i18n/locales/en/public/privacidade.json";

// Namespace "privacidade" não faz parte do bundle central (src/i18n/index.ts, que só
// regista "common"/"nav"). Registamo-lo aqui em runtime para manter esta página
// autónoma sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "privacidade")) i18n.addResourceBundle("pt", "privacidade", ptPrivacidade, true, true);
if (!i18n.hasResourceBundle("en", "privacidade")) i18n.addResourceBundle("en", "privacidade", enPrivacidade, true, true);

export default function Privacidade() {
  const { t } = useTranslation("privacidade");
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <SEO
        title={t("seo.title")}
        description={t("seo.description")}
        path="/privacidade"
      />
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        lead={t("hero.lead")}
        image={heroInvestigacao}
        breadcrumb={[{ label: t("hero.breadcrumb") }]}
      />
      <section className="py-20">
        <motion.div
          className="container max-w-3xl space-y-8"
          initial={shouldReduceMotion ? undefined : "hidden"}
          animate={shouldReduceMotion ? undefined : "visible"}
          variants={shouldReduceMotion ? undefined : fadeInUp}
        >
          <article>
            <h2 className="font-serif text-2xl mb-3">{t("sections.controller.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("sections.controller.body")}</p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">{t("sections.dataCollected.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("sections.dataCollected.body")}</p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">{t("sections.purpose.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("sections.purpose.body")}</p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">{t("sections.retention.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("sections.retention.body")}</p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">{t("sections.rights.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("sections.rights.bodyBefore")}{" "}
              <a href="mailto:info@iiv.gov.ao" className="text-primary underline">info@iiv.gov.ao</a>
              {t("sections.rights.bodyAfter")}
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl mb-3">{t("sections.security.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("sections.security.body")}</p>
          </article>
          <p className="text-xs text-muted-foreground mt-12">{t("lastUpdated")}</p>
        </motion.div>
      </section>
    </>
  );
}
