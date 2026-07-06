import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/motion";
import i18n from "@/i18n";
import ptNotFound from "@/i18n/locales/pt/public/notfound.json";
import enNotFound from "@/i18n/locales/en/public/notfound.json";

// Namespace "notfound" não faz parte do bundle central (src/i18n/index.ts, que só
// regista "common"/"nav"). Registamo-lo aqui em runtime para manter esta página
// autónoma sem tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "notfound")) i18n.addResourceBundle("pt", "notfound", ptNotFound, true, true);
if (!i18n.hasResourceBundle("en", "notfound")) i18n.addResourceBundle("en", "notfound", enNotFound, true, true);

const NotFound = () => {
  const { t } = useTranslation("notfound");
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <motion.div
        className="text-center space-y-6 max-w-md"
        initial={shouldReduceMotion ? undefined : "hidden"}
        animate={shouldReduceMotion ? undefined : "visible"}
        variants={shouldReduceMotion ? undefined : fadeInUp}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <SearchX className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-6xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-lg text-muted-foreground">{t("message")}</p>
        </div>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backButton")}
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
