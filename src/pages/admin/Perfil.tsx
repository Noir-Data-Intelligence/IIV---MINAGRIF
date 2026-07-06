import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Save, Loader2, KeyRound, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function Perfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await (supabase as any).rpc("get_my_profile");
      const rows = Array.isArray(data) ? data : data ? [data] : [];
      const row: any = rows[0] ?? null;
      if (row) {
        setProfile(row as Profile);
        setFullName(row.full_name || "");
        setPhone(row.phone || "");
        setAvatarUrl(row.avatar_url || null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      setUploadingAvatar(false);
      toast({ title: "Erro", description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${pub.publicUrl}?t=${Date.now()}`;
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    setUploadingAvatar(false);
    if (updErr) {
      toast({ title: "Erro", description: updErr.message, variant: "destructive" });
      return;
    }
    setAvatarUrl(url);
    toast({ title: "Foto actualizada" });
  };

  const handleAvatarRemove = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", user.id);
    setUploadingAvatar(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setAvatarUrl(null);
    toast({ title: "Foto removida" });
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível guardar o perfil.", variant: "destructive" });
    } else {
      toast({ title: "Perfil actualizado", description: "Os seus dados foram guardados com sucesso." });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: "Erro", description: "Preencha todos os campos de senha.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível alterar a senha.", variant: "destructive" });
    } else {
      toast({ title: "Senha alterada", description: "A sua senha foi alterada com sucesso." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="space-y-6 max-w-2xl">
      <AdminPageHeader
        icon={User}
        title="Meu Perfil"
        description="Visualize e edite os seus dados pessoais"
      />

      <AdminCard title="Dados Pessoais" icon={User} loading={loading}>
        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 text-lg">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{fullName || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={uploadingAvatar} asChild>
                  <label className="cursor-pointer">
                    {uploadingAvatar ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                    Carregar foto
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </Button>
                {avatarUrl && (
                  <Button size="sm" variant="ghost" onClick={handleAvatarRemove} disabled={uploadingAvatar} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-3 w-3" /> Remover
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Insira o seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+244 9XX XXX XXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Membro desde</Label>
              <Input
                value={profile ? new Date(profile.created_at).toLocaleDateString("pt-AO") : "—"}
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Alterações
            </Button>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Alterar Senha" icon={KeyRound}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Alterar Senha
            </Button>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
