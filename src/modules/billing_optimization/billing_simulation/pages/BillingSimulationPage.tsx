import { Calculator } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import ModulePlaceholder from "@/shared/components/ModulePlaceholder";

const BillingSimulationPage = () => (
  <ModuleLayout title="Simulación de Facturación" icon={Calculator}>
    <ModulePlaceholder
      name="Simulación de Facturación"
      description="Simula facturación eléctrica usando datos de medidores, asigna costos por línea de producción e identifica ineficiencias."
      icon={Calculator}
    />
  </ModuleLayout>
);

export default BillingSimulationPage;
