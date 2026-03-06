import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import sergenLogo from "@/assets/sergen-logo.png";
import { SubscriptionPlansModal } from "@/components/subscription/SubscriptionPlansModal";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPlans, setShowPlans] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — foto de fondo */}
      <div className="hidden md:block md:w-1/2 lg:w-3/5">
        <div
          className="h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/4e259b4d-ce76-41c2-8634-2c0f28d6505b.png")',
            backgroundSize: "cover",
          }}
        />
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={sergenLogo} alt="SERGEN" className="h-12" />
          </div>

          {!showRecovery ? (
            <>
              <h1 className="text-2xl font-bold text-center mb-2">Iniciar Sesión</h1>
              <div className="mb-6 text-center">
                <span className="text-gray-600 text-sm">¿No tienes cuenta? </span>
                <button onClick={() => setShowPlans(true)} className="text-primary hover:underline font-medium text-sm">
                  Regístrate ahora
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-blue-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-blue-50/50"
                  />
                </div>
                <div className="flex items-center">
                  <Checkbox id="remember" />
                  <label htmlFor="remember" className="ml-2 text-sm">
                    Recuérdame
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Procesando..." : "Iniciar Sesión"}
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-primary hover:underline text-center"
                  onClick={() => setShowRecovery(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-6">Recuperar contraseña</h1>
              <form onSubmit={handleRecovery} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">Correo electrónico</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    className="bg-blue-50/50"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar instrucciones"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setShowRecovery(false)}>
                  Volver al inicio de sesión
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <SubscriptionPlansModal open={showPlans} onOpenChange={setShowPlans} />
    </div>
  );
};

export default AuthPage;
