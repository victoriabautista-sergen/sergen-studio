import { TrendingUp } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import ModulePlaceholder from "@/shared/components/ModulePlaceholder";

const PredictionPage = () => (
  <ModuleLayout title="Predicción de Precios" icon={TrendingUp}>
    <ModulePlaceholder
      name="Predicción de Precios de Energía"
      description="Pronóstico de precios de electricidad, indicadores de riesgo y visualización histórica con explicaciones de IA sobre condiciones del mercado."
      icon={TrendingUp}
    />
  </ModuleLayout>
);

export default PredictionPage;
