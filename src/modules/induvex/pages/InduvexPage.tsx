import { Bot } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import ModulePlaceholder from "@/shared/components/ModulePlaceholder";

const InduvexPage = () => (
  <ModuleLayout title="Induvex – Engineering Assistant" icon={Bot}>
    <ModulePlaceholder
      name="Induvex – Engineering Assistant"
      description="Asistente conversacional de IA para ingeniería industrial, soporte técnico, base de conocimiento y recomendaciones operativas."
      icon={Bot}
    />
  </ModuleLayout>
);

export default InduvexPage;
