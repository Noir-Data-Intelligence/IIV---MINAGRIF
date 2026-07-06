import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import i18n from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, KeyRound, Lock } from "lucide-react";
import { fadeIn, fadeInUp, staggerContainer } from "@/lib/motion";
import ptRedefinirSenha from "@/i18n/locales/pt/auth/redefinir-senha.json";
import enRedefinirSenha from "@/i18n/locales/en/auth/redefinir-senha.json";

const AUTH_REDEFINIR_SENHA_NS = "auth-redefinir-senha";
if (!i18n.hasResourceBundle("pt", AUTH_REDEFINIR_SENHA_NS)) {
  i18n.addResourceBundle("pt", AUTH_REDEFINIR_SENHA_NS, ptRedefinirSenha);
}
if (!i18n.hasResourceBundle("en", AUTH_REDEFINIR_SENHA_NS)) {
  i18n.addResourceBundle("en", AUTH_REDEFINIR_SENHA_NS, enRedefinirSenha);
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

export default function RedefinirSenha() {
  const { t } = useTranslation(AUTH_REDEFINIR_SENHA_NS);
  const shouldReduceMotion = useReducedMotion();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase coloca a sessão de recuperação no hash da URL
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasRecoverySession(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasRecoverySession(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: t("toast.shortPasswordTitle"), description: t("toast.shortPasswordDescription"), variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: t("toast.mismatchTitle"), description: t("toast.mismatchDescription"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: t("toast.errorTitle"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("toast.successTitle"), description: t("toast.successDescription") });
      await supabase.auth.signOut();
      navigate("/login");
    }
  };

  return (
    <motion.div
      className="min-h-screen flex"
      variants={staggerContainer}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
    >
      <motion.div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary" variants={fadeIn}>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-primary-foreground/5 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t("backToPortal")}
          </Link>
          <div className="space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15">
              <Lock className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-serif text-4xl leading-[1.15]">{renderMultiline(t("brand.title"))}</h1>
              <p className="mt-4 text-lg text-primary-foreground/70 max-w-sm leading-relaxed">
                {t("brand.subtitle")}
              </p>
            </div>
          </div>
          <p className="text-xs text-primary-foreground/40">{t("footer.copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </motion.div>

      <motion.div className="flex-1 flex items-center justify-center bg-background px-6 py-12" variants={fadeInUp}>
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <KeyRound className="h-7 w-7" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-foreground">{t("form.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {hasRecoverySession
                ? t("form.subtitleReady")
                : t("form.subtitleValidating")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{t("form.passwordLabel")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("form.passwordPlaceholder")} required minLength={6} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium">{t("form.confirmLabel")}</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className="h-11" />
            </div>
            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading || !hasRecoverySession}>
              <Lock className="mr-2 h-4 w-4" />
              {loading ? t("form.submitLoading") : t("form.submitDefault")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">{t("backToLogin")}</Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
