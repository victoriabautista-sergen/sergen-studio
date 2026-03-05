import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, FileText, Calculator, Activity, Bot, Construction } from "lucide-react";
import sergenLogo from "@/assets/sergen-logo.png";

const moduleInfo: Record<string, { name: string; description: string; icon: React.ElementType }> = {
  "energy-prediction": {
    name: "Predicción de Precios de Energía",
    description: "Pronóstico de precios de electricidad, indicadores de riesgo y visualización histórica con explicaciones de IA sobre condiciones del mercado.",
    icon: TrendingUp,
  },
  "report-studio": {
    name: "Report Studio",
    description: "Análisis de facturas de electricidad vs contratos, comparación de costos energéticos, análisis de demanda y generación de reportes PDF.",
    icon: FileText,
  },
  "billing-simulation": {
    name: "Simulación de Facturación",
    description: "Simula facturación eléctrica usando datos de medidores, asigna costos por línea de producción e identifica ineficiencias.",
    icon: Calculator,
  },
  "energy-monitoring": {
    name: "Monitoreo Energético",
    description: "Visualización de consumo energético en tiempo real con dashboards, tendencias de consumo y alertas inteligentes.",
    icon: Activity,
  },
  "induvex-ai": {
    name: "Induvex AI Assistant",
    description: "Asistente conversacional de IA para ingeniería industrial, soporte técnico, base de conocimiento y recomendaciones operativas.",
    icon: Bot,
  },
};

const ModulePage = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams<{ moduleId: string }>();
  const info = moduleId ? moduleInfo[moduleId] : null;

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Módulo no encontrado</p>
      </div>
    );
  }

  const Icon = info.icon;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={sergenLogo} alt="SERGEN" className="h-7" />
          <span className="text-muted-foreground">/</span>
          <h1 className="font-heading font-semibold">{info.name}</h1>
        </div>
      </header>

      <main className="container py-12">
        <Card className="max-w-2xl mx-auto animate-fade-in">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-heading text-2xl">{info.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">{info.description}</p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Construction className="h-5 w-5" />
              <span className="text-sm">Módulo en desarrollo — próximamente disponible</span>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ModulePage;
