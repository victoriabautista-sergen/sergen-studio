import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import sergenLogo from "@/assets/sergen-logo.png";
import { SubscriptionPlansModal } from "@/components/subscription/SubscriptionPlansModal";
import type { AppRole } from "@/core/auth/context/AuthContext";


const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPlans, setShowPlans] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  // Show feedback when redirected here with a reason
  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "inactive") {
      toast({
        title: "Cuenta desactivada",
        description: "Tu cuenta está desactivada. Contacta a tu administrador.",
        variant: "destructive",
      });
    } else if (reason === "subscription") {
      toast({
        title: "Suscripción inactiva",
        description: "Tu empresa no tiene una suscripción activa.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data.user.id;

      // Check profile is active
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile && !profile.is_active) {
        await supabase.auth.signOut();
        toast({
          title: "Cuenta desactivada",
          description: "Tu cuenta está desactivada. Contacta a tu administrador.",
          variant: "destructive",
        });
        return;
      }

      // Get role — user_roles is the single source of truth
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const role = (roleRow?.role ?? "client_user") as AppRole;

      // Verify active subscription for company users
      if (role === "admin" || role === "client_user") {
        const { data: clientUser } = await supabase
          .from("client_users")
          .select("client_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (clientUser) {
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("client_id", clientUser.client_id)
            .eq("status", "active")
            .maybeSingle();

          if (!subscription) {
            await supabase.auth.signOut();
            toast({
              title: "Suscripción inactiva",
              description: "Tu empresa no tiene una suscripción activa. Contacta a SERGEN.",
              variant: "destructive",
            });
            return;
          }
        }
      }

      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error de inicio de sesión", description: message, variant: "destructive" });
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error", description: message, variant: "destructive" });
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
