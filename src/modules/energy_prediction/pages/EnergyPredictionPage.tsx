import { TrendingUp } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import ModulePlaceholder from "@/shared/components/ModulePlaceholder";

const EnergyPredictionPage = () => (
  <ModuleLayout title="Predicción de Precios de Energía">
    <ModulePlaceholder
      name="Predicción de Precios de Energía"
      description="Pronóstico de precios de electricidad, indicadores de riesgo y visualización histórica con explicaciones de IA sobre condiciones del mercado."
      icon={TrendingUp}
    />
  </ModuleLayout>
);

export default EnergyPredictionPage;
