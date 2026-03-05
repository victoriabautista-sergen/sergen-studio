import { FileText } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import ModulePlaceholder from "@/shared/components/ModulePlaceholder";

const ReportStudioPage = () => (
  <ModuleLayout title="Report Studio">
    <ModulePlaceholder
      name="Report Studio"
      description="Análisis de facturas de electricidad vs contratos, comparación de costos energéticos, análisis de demanda y generación de reportes PDF."
      icon={FileText}
    />
  </ModuleLayout>
);

export default ReportStudioPage;
