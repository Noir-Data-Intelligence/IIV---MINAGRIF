import { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import i18n from "@/i18n";
import { login } from "@/services/api/auth";
import { useAuth } from "@/hooks/useAuth";
import type { ApiError } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck } from "lucide-react";
import { fadeIn, fadeInUp, staggerContainer } from "@/lib/motion";
import ptLogin from "@/i18n/locales/pt/auth/login.json";
import enLogin from "@/i18n/locales/en/auth/login.json";
import authLoginImage from "@/assets/auth/auth-login-microscope.webp";

const AUTH_LOGIN_NS = "auth-login";
if (!i18n.hasResourceBundle("pt", AUTH_LOGIN_NS)) {
  i18n.addResourceBundle("pt", AUTH_LOGIN_NS, ptLogin);
}
if (!i18n.hasResourceBundle("en", AUTH_LOGIN_NS)) {
  i18n.addResourceBundle("en", AUTH_LOGIN_NS, enLogin);
}

/** Divide um texto por "\n" e insere <br /> entre as linhas (mantém traduções como frases simples). */
function renderMultiline(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}

const DEMO_ACCOUNTS = [
  { roleKey: "admin", email: "admin@iiv.demo", password: "admin123" },
  { roleKey: "tecnico", email: "tecnico@iiv.demo", password: "tecnico123" },
  { roleKey: "gestor", email: "gestor@iiv.demo", password: "gestor123" },
  { roleKey: "diretor", email: "diretor@iiv.demo", password: "diretor123" },
  { roleKey: "colaborador", email: "colaborador@iiv.demo", password: "colaborador123" },
] as const;

export default function Login() {
  const { t } = useTranslation(AUTH_LOGIN_NS);
  const shouldReduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refresh } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      await refresh();
      navigate("/admin");
    } catch (error) {
      toast({
        title: t("toast.loginErrorTitle"),
        description: (error as ApiError).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex"
      variants={staggerContainer}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
    >
      {/* Left panel - branding */}
      <motion.div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary" variants={fadeIn}>
        <img src={authLoginImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-overlay" loading="lazy" />
        {/* Decorative pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-primary-foreground/5 blur-3xl" />
          <div className="absolute top-20 -left-10 h-72 w-72 rounded-full border border-primary-foreground/10" />
          <div className="absolute bottom-32 right-10 h-56 w-56 rounded-full border border-primary-foreground/10" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> {t("backToPortal")}
            </Link>
          </div>

          <div className="space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15">
              <span className="font-serif text-3xl">IIV</span>
            </div>
            <div>
              <h1 className="font-serif text-4xl leading-[1.15]">
                {renderMultiline(t("brand.title"))}
              </h1>
              <p className="mt-4 text-lg text-primary-foreground/70 max-w-sm leading-relaxed">
                {t("brand.subtitle")}
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 backdrop-blur-sm p-4 border border-primary-foreground/10 max-w-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary-foreground/80" />
              <p className="text-sm text-primary-foreground/70">
                {t("brand.securityNote")}
              </p>
            </div>
          </div>

          <p className="text-xs text-primary-foreground/40">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </motion.div>

      {/* Right panel - form */}
      <motion.div className="flex-1 flex items-center justify-center bg-background px-6 py-12" variants={fadeInUp}>
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden text-center space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> {t("backToPortal")}
            </Link>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-serif font-bold text-2xl">
              IIV
            </div>
          </div>

          {/* Form header */}
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-foreground">{t("form.title")}</h2>
            <p className="text-muted-foreground text-sm">{t("form.subtitle")}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t("form.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("form.emailPlaceholder")}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">{t("form.passwordLabel")}</Label>
                <Link to="/recuperar-senha" className="text-xs text-primary hover:underline">{t("form.forgotPassword")}</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("form.passwordPlaceholder")}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? t("form.submitLoading") : t("form.submitDefault")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link to="/registar" className="font-medium text-primary hover:underline">{t("requestAccess")}</Link>
          </p>

          {/* Quick access demo credentials — visível em dev local OU sempre que a build corre
              contra a camada mock (VITE_API_MOCK=true), nunca contra um backend real */}
          {(import.meta.env.DEV || import.meta.env.VITE_API_MOCK === "true") && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("demo.title")}</p>
              <div className="grid gap-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                    onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  >
                    <span className="font-medium">{t(`demo.roles.${acc.roleKey}`)}</span>
                    <span>{acc.email}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">{t("demo.hint")}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
