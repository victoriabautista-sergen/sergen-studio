import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import sergenLogo from "@/assets/sergen-logo.png";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Error de inicio de sesión", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Correo enviado", description: "Revisa tu correo para restablecer tu contraseña." });
      setShowRecovery(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (showRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <img src={sergenLogo} alt="SERGEN" className="h-12 mx-auto mb-4" />
            <CardTitle className="font-heading text-2xl">Recuperar contraseña</CardTitle>
            <CardDescription>Ingresa tu correo para recibir instrucciones</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecovery} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-email">Correo electrónico</Label>
                <Input id="recovery-email" type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" variant="sergen" disabled={loading}>
                {loading ? "Enviando..." : "Enviar instrucciones"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowRecovery(false)}>
                Volver al inicio de sesión
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src={sergenLogo} alt="SERGEN Eficiencia Energética" className="h-14 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Plataforma de Gestión Energética Industrial</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-1 mb-6">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <Input id="login-email" type="email" placeholder="correo@empresa.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" variant="sergen" disabled={loading}>
                    {loading ? "Ingresando..." : "Ingresar"}
                  </Button>
                  <button type="button" className="w-full text-sm text-primary hover:underline" onClick={() => setShowRecovery(true)}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </form>
              </TabsContent>
              
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
