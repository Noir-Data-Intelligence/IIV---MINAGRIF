import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { changePassword } from "@/services/api/auth";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLE_LABEL } from "@/lib/permissions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Save, Loader2, KeyRound, Upload, Trash2, Mail, Phone, ShieldCheck, IdCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { usePerfilQuery, useUpdatePerfil } from "@/hooks/queries/usePerfil";
import i18n from "@/i18n";
import ptPerfil from "@/i18n/locales/pt/admin/perfil.json";
import enPerfil from "@/i18n/locales/en/admin/perfil.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Documentos.tsx.
if (!i18n.hasResourceBundle("pt", "admin-perfil"))
  i18n.addResourceBundle("pt", "admin-perfil", ptPerfil, true, true);
if (!i18n.hasResourceBundle("en", "admin-perfil"))
  i18n.addResourceBundle("en", "admin-perfil", enPerfil, true, true);

export default function Perfil() {
  const { t } = useTranslation("admin-perfil");
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const prefersReduced = useReducedMotion();

  // --- Dados de perfil (nome, telefone, avatar) — migrados para a camada mock ---
  const { data: perfil, isLoading } = usePerfilQuery();
  const updatePerfil = useUpdatePerfil();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setFullName(perfil.fullName || "");
    setPhone(perfil.phone || "");
    setAvatarUrl(perfil.avatarUrl || null);
  }, [perfil]);

  // --- Alteração de password ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("toast.error"), description: t("avatar.tooLarge"), variant: "destructive" });
      return;
    }
    // Sem storage real: gera uma pré-visualização local imediata (tal como
    // Documentos.tsx simula uploads sem persistir o ficheiro em si).
    const url = URL.createObjectURL(file);
    setUploadingAvatar(true);
    try {
      const updated = await updatePerfil.mutateAsync({ avatarUrl: url });
      setAvatarUrl(updated.avatarUrl);
      toast({ title: t("toast.avatarUpdated") });
    } catch (error) {
      toast({
        title: t("toast.error"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    try {
      const updated = await updatePerfil.mutateAsync({ avatarUrl: null });
      setAvatarUrl(updated.avatarUrl);
      toast({ title: t("toast.avatarRemoved") });
    } catch (error) {
      toast({
        title: t("toast.error"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePerfil.mutateAsync({ fullName, phone: phone || null });
      toast({ title: t("toast.profileUpdated"), description: t("toast.profileUpdatedDescription") });
    } catch (error) {
      toast({
        title: t("toast.error"),
        description: error instanceof Error ? error.message : t("toast.profileError"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: t("toast.error"), description: t("toast.passwordFillAll"), variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: t("toast.error"), description: t("toast.passwordTooShort"), variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t("toast.error"), description: t("toast.passwordMismatch"), variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(newPassword);
      toast({ title: t("toast.passwordChanged"), description: t("toast.passwordChangedDescription") });
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: t("toast.error"), description: t("toast.passwordError"), variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const securityTips = [t("security.tip1"), t("security.tip2"), t("security.tip3")];

  return (
    <motion.div
      className="space-y-6 max-w-3xl"
      variants={prefersReduced ? undefined : staggerContainer}
      initial={prefersReduced ? undefined : "hidden"}
      animate={prefersReduced ? undefined : "visible"}
    >
      <AdminPageHeader
        icon={User}
        title={t("page.title")}
        description={t("page.description")}
      />

      {/* Hero de perfil — banner com gradiente + avatar sobreposto */}
      <motion.div variants={prefersReduced ? undefined : fadeInUp}>
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-xl transition-all duration-300">
          <div className="relative h-28 gradient-green-soft">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-[hsl(var(--iiv-gold))]/25 blur-2xl" />
          </div>
          <div className="relative px-6 pb-6">
            <div className="flex flex-col gap-4 -mt-12 sm:flex-row sm:items-end sm:gap-5">
              {isLoading ? (
                <Skeleton className="h-24 w-24 rounded-full ring-4 ring-card shrink-0" />
              ) : (
                <Avatar className="h-24 w-24 text-xl ring-4 ring-card shadow-lg shrink-0">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                  <AvatarFallback className="gradient-green-soft text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-serif font-semibold text-foreground truncate">
                    {fullName || t("avatar.noName")}
                  </p>
                  {role && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium px-2.5 py-0.5">
                      <ShieldCheck className="h-3 w-3" />
                      {t("hero.rolePrefix")}: {ROLE_LABEL[role]}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> {user?.email}
                </p>
              </div>
              <div className="flex gap-2 pb-1 shrink-0">
                <Button size="sm" variant="outline" disabled={uploadingAvatar} asChild>
                  <label className="cursor-pointer">
                    {uploadingAvatar ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                    {t("avatar.upload")}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </Button>
                {avatarUrl && (
                  <Button size="sm" variant="ghost" onClick={handleAvatarRemove} disabled={uploadingAvatar} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-3 w-3" /> {t("avatar.remove")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={prefersReduced ? undefined : fadeInUp}>
        <AdminCard title={t("card.personalData")} icon={IdCard} loading={isLoading}>
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {t("form.labels.email")}
                </Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" /> {t("form.labels.fullName")}
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("form.placeholders.fullName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {t("form.labels.phone")}
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("form.placeholders.phone")}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t("form.save")}
              </Button>
            </div>
          </div>
        </AdminCard>
      </motion.div>

      <motion.div variants={prefersReduced ? undefined : fadeInUp}>
        <AdminCard title={t("card.changePassword")} icon={KeyRound}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("password.labels.newPassword")}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("password.placeholders.newPassword")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("password.labels.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("password.placeholders.confirmPassword")}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  {t("password.submit")}
                </Button>
              </div>
            </div>

            {/* Dicas de segurança */}
            <div className={cn("rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3")}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md gradient-green-soft text-primary-foreground shadow-sm shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                </span>
                {t("security.tipsTitle")}
              </p>
              <ul className="space-y-2">
                {securityTips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AdminCard>
      </motion.div>
    </motion.div>
  );
}
