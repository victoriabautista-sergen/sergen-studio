import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import AdminShell from "../components/AdminShell";
import EmpresaInfoTab from "../components/empresa/EmpresaInfoTab";
import EmpresaUsuariosTab from "../components/empresa/EmpresaUsuariosTab";
import EmpresaModulosTab from "../components/empresa/EmpresaModulosTab";
import EmpresaReportesTab from "../components/empresa/EmpresaReportesTab";
import EmpresaSuscripcionTab from "../components/empresa/EmpresaSuscripcionTab";

const EmpresaDetailPage = () => {
  const { id: companyId } = useParams<{ id: string }>();

  const { data: company, isLoading } = useQuery({
    queryKey: ["admin-empresa", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, ruc, industry")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const breadcrumbs = [
    { label: "Empresas", href: "/admin-panel/empresas" },
    { label: company?.company_name ?? "…" },
  ];

  if (isLoading) {
    return (
      <AdminShell breadcrumbs={breadcrumbs}>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  if (!company) {
    return (
      <AdminShell breadcrumbs={breadcrumbs}>
        <p className="text-muted-foreground">Empresa no encontrada.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">{company.company_name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {company.ruc ? `RUC: ${company.ruc}` : ""}{company.industry ? ` · ${company.industry}` : ""}
          </p>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="modulos">Módulos</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
            <TabsTrigger value="suscripcion">Suscripción</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="mt-6">
            <EmpresaInfoTab company={company} />
          </TabsContent>
          <TabsContent value="usuarios" className="mt-6">
            <EmpresaUsuariosTab companyId={company.id} />
          </TabsContent>
          <TabsContent value="modulos" className="mt-6">
            <EmpresaModulosTab companyId={company.id} />
          </TabsContent>
          <TabsContent value="reportes" className="mt-6">
            <EmpresaReportesTab companyId={company.id} />
          </TabsContent>
          <TabsContent value="suscripcion" className="mt-6">
            <EmpresaSuscripcionTab companyId={company.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
};

export default EmpresaDetailPage;
