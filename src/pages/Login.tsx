import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary">
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
              <ArrowLeft className="h-4 w-4" /> Voltar ao portal
            </Link>
          </div>

          <div className="space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15">
              <span className="font-serif text-3xl">IIV</span>
            </div>
            <div>
              <h1 className="font-serif text-4xl leading-[1.15]">
                Instituto de<br />Investigação<br />Veterinária
              </h1>
              <p className="mt-4 text-lg text-primary-foreground/70 max-w-sm leading-relaxed">
                Sistema integrado de gestão laboratorial, produção e controle de qualidade.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 backdrop-blur-sm p-4 border border-primary-foreground/10 max-w-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary-foreground/80" />
              <p className="text-sm text-primary-foreground/70">
                Acesso seguro e encriptado. Os seus dados estão protegidos.
              </p>
            </div>
          </div>

          <p className="text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} IIV — Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden text-center space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar ao portal
            </Link>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-serif font-bold text-2xl">
              IIV
            </div>
          </div>

          {/* Form header */}
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm">Introduza as suas credenciais para aceder ao sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email institucional</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@iiv.gov.mz"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Palavra-passe</Label>
                <Link to="/recuperar-senha" className="text-xs text-primary hover:underline">Esqueceu?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              {loading ? "A entrar..." : "Entrar no sistema"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/registar" className="font-medium text-primary hover:underline">Solicitar acesso</Link>
          </p>

          {/* Quick access demo credentials */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acesso rápido (demo)</p>
            <div className="grid gap-1.5">
              {[
                { label: "Admin", email: "admin@iiv.demo", password: "admin123" },
                { label: "Técnico", email: "tecnico@iiv.demo", password: "tecnico123" },
                { label: "Gestor", email: "gestor@iiv.demo", password: "gestor123" },
                { label: "Director", email: "diretor@iiv.demo", password: "diretor123" },
                { label: "Colaborador", email: "colaborador@iiv.demo", password: "colaborador123" },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                >
                  <span className="font-medium">{acc.label}</span>
                  <span className="opacity-60">{acc.email}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center">Clique num perfil para preencher automaticamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
