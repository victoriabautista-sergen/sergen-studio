import { Zap, BarChart2, TrendingUp, Activity } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const EnergyIntelligencePage = () => {
  const navigate = useNavigate();

  const submodules = [
    {
      id: "monitoring",
      name: "Control de Demanda",
      description: "Panel completo de gestión de riesgo, calendario de modulación y potencia máxima histórica",
      icon: BarChart2,
      path: "/modules/energy-intelligence/monitoring",
      color: "bg-sergen-warning/10 text-sergen-warning",
    },
    {
      id: "prediction",
      name: "Pronóstico COES",
      description: "Pronóstico de demanda del sistema eléctrico peruano con datos de reprogramación y demanda real",
      icon: TrendingUp,
      path: "/modules/energy-intelligence/prediction",
      color: "bg-sergen-orange/10 text-primary",
    },
  ];

  return (
    <ModuleLayout title="Control de Demanda">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-heading font-bold">Control de Demanda</h2>
          <p className="text-muted-foreground mt-2">
            Herramientas de control de demanda, pronóstico y monitoreo para la gestión energética industrial
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
