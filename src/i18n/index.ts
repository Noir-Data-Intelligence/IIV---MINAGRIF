import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptCommon from "./locales/pt/common.json";
import ptNav from "./locales/pt/nav.json";
import enCommon from "./locales/en/common.json";
import enNav from "./locales/en/nav.json";

export const defaultNS = "common";

export const resources = {
  pt: {
    common: ptCommon,
    nav: ptNav,
  },
  en: {
    common: enCommon,
    nav: enNav,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "pt",
    supportedLngs: ["pt", "en"],
    defaultNS,
    ns: ["common", "nav"],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
