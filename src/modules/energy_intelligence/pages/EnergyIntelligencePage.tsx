import { Zap } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EnergyIntelligencePage = () => {
  const navigate = useNavigate();

  const submodules = [
    {
      id: "prediction",
      name: "Predicción de Precios",
      description: "Pronóstico de precios de energía, indicadores de riesgo y análisis de mercado con IA",
      icon: TrendingUp,
      path: "/modules/energy-intelligence/prediction",
      color: "bg-sergen-orange/10 text-primary",
    },
    {
      id: "monitoring",
      name: "Monitoreo Energético",
      description: "Visualización de consumo en tiempo real, tendencias y alertas inteligentes",
      icon: Activity,
      path: "/modules/energy-intelligence/monitoring",
      color: "bg-sergen-warning/10 text-sergen-warning",
    },
  ];

  return (
    <ModuleLayout title="Energy Intelligence" icon={Zap}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-heading font-bold">Energy Intelligence</h2>
          <p className="text-muted-foreground mt-2">
            Herramientas de predicción y monitoreo para la gestión energética industrial
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submodules.map((sub) => {
            const Icon = sub.icon;
            return (
              <Card
                key={sub.id}
                className="group cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                onClick={() => navigate(sub.path)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${sub.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-heading text-lg">{sub.name}</CardTitle>
                  <CardDescription>{sub.description}</CardDescription>
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
      </div>
    </ModuleLayout>
  );
};

export default EnergyIntelligencePage;
