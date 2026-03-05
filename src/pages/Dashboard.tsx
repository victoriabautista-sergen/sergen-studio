import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import sergenLogo from "@/assets/sergen-logo.png";
import {
  TrendingUp,
  FileText,
  Calculator,
  Activity,
  Bot,
  LogOut,
  Users,
  Settings,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
}

const allModules: ModuleConfig[] = [
  {
    id: "energy-prediction",
    name: "Predicción de Precios",
    description: "Pronóstico de precios de energía e indicadores de riesgo",
    icon: TrendingUp,
    route: "/modules/energy-prediction",
    color: "bg-sergen-orange/10 text-primary",
  },
  {
    id: "report-studio",
    name: "Report Studio",
    description: "Análisis de facturas y generación de reportes técnicos",
    icon: FileText,
    route: "/modules/report-studio",
    color: "bg-sergen-info/10 text-sergen-info",
  },
  {
    id: "billing-simulation",
    name: "Simulación de Facturación",
    description: "Simula facturación eléctrica y asigna costos por línea",
    icon: Calculator,
    route: "/modules/billing-simulation",
    color: "bg-sergen-success/10 text-sergen-success",
  },
  {
    id: "energy-monitoring",
    name: "Monitoreo Energético",
    description: "Visualización de consumo energético en tiempo real",
    icon: Activity,
    route: "/modules/energy-monitoring",
    color: "bg-sergen-warning/10 text-sergen-warning",
  },
  {
    id: "induvex-ai",
    name: "Induvex AI Assistant",
    description: "Asistente de ingeniería con IA para plantas industriales",
    icon: Bot,
    route: "/modules/induvex-ai",
    color: "bg-purple-100 text-purple-600",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={sergenLogo} alt="SERGEN" className="h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clients")}>
              <Users className="h-4 w-4 mr-1" />
              Clientes
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/settings")}>
              <Settings className="h-4 w-4 mr-1" />
              Configuración
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Bienvenido, {session?.user?.user_metadata?.full_name || "Usuario"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Selecciona un módulo para comenzar
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}
                onClick={() => navigate(module.route)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${module.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-heading text-lg">{module.name}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary transition-colors">
                    Acceder →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
