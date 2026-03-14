import { BarChart2, TrendingUp } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PARENT_GRADIENT = "from-amber-400 via-orange-500 to-red-500";

const submodules = [
  {
    id: "monitoring",
    name: "Control de Demanda",
    description: "Panel completo de gestión de riesgo, calendario de modulación y potencia máxima histórica",
    icon: BarChart2,
    path: "/modules/energy-intelligence/monitoring",
  },
  {
    id: "prediction",
    name: "Pronóstico COES",
    description: "Pronóstico de demanda del sistema eléctrico peruano con datos de reprogramación y demanda real",
    icon: TrendingUp,
    path: "/modules/energy-intelligence/prediction",
  },
];

const EnergyIntelligencePage = () => {
  const navigate = useNavigate();

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
                className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in overflow-hidden border-0 shadow-sm"
                onClick={() => navigate(sub.path)}
              >
                <div className={`relative bg-gradient-to-r ${PARENT_GRADIENT} px-6 py-5`}>
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-heading font-bold text-lg text-white">{sub.name}</span>
                  </div>
                </div>
                <div className="bg-card px-6 py-4 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{sub.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="group-hover:border-primary group-hover:text-primary transition-colors"
                  >
                    Acceder →
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </ModuleLayout>
  );
};

export default EnergyIntelligencePage;
