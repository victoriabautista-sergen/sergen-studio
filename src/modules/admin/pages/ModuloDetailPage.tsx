import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import AdminShell from "../components/AdminShell";

type Module = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};

const ModuloDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: mod, isLoading } = useQuery({
    queryKey: ["admin-module-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, name, slug, description, is_active")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as Module | null;
    },
    enabled: !!slug,
  });

  const breadcrumbs = [
    { label: "Configuración de Módulos", href: "/admin-panel/modulos" },
    { label: mod?.name ?? slug ?? "" },
  ];

  if (isLoading) {
    return (
      <AdminShell breadcrumbs={breadcrumbs}>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  if (!mod) {
    return (
      <AdminShell breadcrumbs={breadcrumbs}>
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Package className="h-10 w-10" />
          <p>Módulo no encontrado</p>
          <Link to="/admin-panel/modulos" className="text-sm text-primary underline">
            Volver a módulos
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">{mod.name}</h2>
              <Badge variant={mod.is_active ? "default" : "secondary"}>
                {mod.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            {mod.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{mod.description}</p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración del módulo</CardTitle>
            <CardDescription>
              Ajustes específicos para {mod.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Construction className="h-10 w-10" />
              <p className="text-sm">Configuración en desarrollo</p>
              <p className="text-xs">Próximamente podrás gestionar los ajustes de este módulo.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
};

export default ModuloDetailPage;
