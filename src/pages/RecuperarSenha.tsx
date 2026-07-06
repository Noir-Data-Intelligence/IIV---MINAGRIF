import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado", description: "Verifique a sua caixa de email para redefinir a palavra-passe." });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary">
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
              <KeyRound className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-serif text-4xl leading-[1.15]">
                Recuperar<br />Palavra-passe
              </h1>
              <p className="mt-4 text-lg text-primary-foreground/70 max-w-sm leading-relaxed">
                Insira o seu email institucional e receberá instruções para redefinir a sua palavra-passe.
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <KeyRound className="h-7 w-7" />
            </div>
          </div>

          {/* Form header */}
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-foreground">Recuperar acesso</h2>
            <p className="text-muted-foreground text-sm">Introduza o email associado à sua conta para receber as instruções.</p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email institucional</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@iiv.gov.mz" required className="h-11" />
            </div>
            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
              <Mail className="mr-2 h-4 w-4" />
              {loading ? "A enviar..." : "Enviar Instruções"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Lembrou-se da palavra-passe?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Voltar ao login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
