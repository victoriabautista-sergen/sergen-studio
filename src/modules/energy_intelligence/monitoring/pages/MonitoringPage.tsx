import { Activity } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import ModulePlaceholder from "@/shared/components/ModulePlaceholder";

const MonitoringPage = () => (
  <ModuleLayout title="Monitoreo Energético" icon={Activity}>
    <ModulePlaceholder
      name="Monitoreo Energético"
      description="Visualización de consumo energético en tiempo real con dashboards, tendencias de consumo y alertas inteligentes."
      icon={Activity}
    />
  </ModuleLayout>
);

export default MonitoringPage;
