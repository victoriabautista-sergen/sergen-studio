import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import AdminShell from "../components/AdminShell";

const BREADCRUMBS = [{ label: "Resumen" }];

const ResumenPage = () => {
  const { data: totalEmpresas, isLoading: l1 } = useQuery({
    queryKey: ["admin-resumen", "empresas"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: usuariosActivos, isLoading: l2 } = useQuery({
    queryKey: ["admin-resumen", "usuarios"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: suscripcionesActivas, isLoading: l3 } = useQuery({
    queryKey: ["admin-resumen", "suscripciones"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const metrics = [
    { title: "Total empresas", value: totalEmpresas, loading: l1, icon: Building2 },
    { title: "Usuarios activos", value: usuariosActivos, loading: l2, icon: Users },
    { title: "Suscripciones activas", value: suscripcionesActivas, loading: l3, icon: CheckCircle2 },
  ];

  return (
    <AdminShell breadcrumbs={BREADCRUMBS}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Resumen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas generales de la plataforma.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map(({ title, value, loading, icon: Icon }) => (
            <Card key={title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground font-normal">
                  {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
};

export default ResumenPage;
