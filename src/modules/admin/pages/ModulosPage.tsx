import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
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

const BREADCRUMBS = [{ label: "Configuración de Módulos" }];

const ModulosPage = () => {
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["admin-modules-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, name, slug, description, is_active")
        .neq("slug", "admin-panel")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Module[];
    },
  });

  return (
    <AdminShell breadcrumbs={BREADCRUMBS}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Configuración de Módulos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona un módulo para ver su configuración.
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : modules.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Package className="h-10 w-10" />
            <p className="text-sm">No hay módulos registrados</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <Link
                key={m.id}
                to={`/admin-panel/modulos/${m.slug}`}
                className="group"
              >
                <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{m.name}</CardTitle>
                      </div>
                      <Badge
                        variant={m.is_active ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {m.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {m.description && (
                      <CardDescription className="mb-3">{m.description}</CardDescription>
                    )}
                    <div className="flex items-center justify-between">
                      <code className="text-[10px] text-muted-foreground font-mono">
                        {m.slug}
                      </code>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default ModulosPage;
