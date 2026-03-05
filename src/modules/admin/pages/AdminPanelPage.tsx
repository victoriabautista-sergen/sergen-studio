import { Shield } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import ModulePlaceholder from "@/shared/components/ModulePlaceholder";

const AdminPanelPage = () => (
  <ModuleLayout title="SERGEN Admin Panel" icon={Shield}>
    <ModulePlaceholder
      name="SERGEN Admin Panel"
      description="Panel de administración para gestión de usuarios, clientes, roles y configuración de la plataforma."
      icon={Shield}
    />
  </ModuleLayout>
);

export default AdminPanelPage;
