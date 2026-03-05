import { Receipt } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BillingOptimizationPage = () => {
  const navigate = useNavigate();

  const submodules = [
    {
      id: "report-studio",
      name: "Report Studio",
      description: "Análisis de facturas vs contratos, comparación de costos y generación de reportes PDF",
      icon: FileText,
      path: "/modules/billing-optimization/report-studio",
      color: "bg-sergen-info/10 text-sergen-info",
    },
    {
      id: "billing-simulation",
      name: "Simulación de Facturación",
      description: "Simula facturación eléctrica, asigna costos por línea de producción e identifica ineficiencias",
      icon: Calculator,
      path: "/modules/billing-optimization/billing-simulation",
      color: "bg-sergen-success/10 text-sergen-success",
    },
  ];

  return (
    <ModuleLayout title="Billing Optimization" icon={Receipt}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-heading font-bold">Billing Optimization</h2>
          <p className="text-muted-foreground mt-2">
            Herramientas de análisis y simulación de facturación energética
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

export default BillingOptimizationPage;
