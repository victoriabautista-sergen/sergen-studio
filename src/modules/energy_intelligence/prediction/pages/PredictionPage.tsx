import { TrendingUp } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import { PowerCharts } from "../../components/forecast/PowerCharts";

const PredictionPage = () => (
  <ModuleLayout title="Predicción de Precios" icon={TrendingUp}>
    <div className="mb-4">
      <h2 className="text-2xl font-heading font-bold mb-1">Pronóstico de Demanda COES</h2>
      <p className="text-sm text-muted-foreground">
        Visualización de pronóstico, reprogramación y demanda real del sistema eléctrico peruano
      </p>
    </div>
    <PowerCharts />
  </ModuleLayout>
);

export default PredictionPage;
