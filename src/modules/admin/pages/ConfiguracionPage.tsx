import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminShell from "../components/AdminShell";

type Module = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};

const BREADCRUMBS = [{ label: "Configuración" }];

const ConfiguracionPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const toggleModuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("modules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules-all"] });
      queryClient.invalidateQueries({ queryKey: ["admin-modules-active"] });
    },
    onError: () =>
      toast({ title: "Error al actualizar módulo.", variant: "destructive" }),
  });

  return (
    <AdminShell breadcrumbs={BREADCRUMBS}>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold">Configuración</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ajustes globales de la plataforma SERGEN.
          </p>
        </div>

        {/* ── Módulos del sistema ── */}
        <Card>
          <CardHeader>
            <CardTitle>Módulos del sistema</CardTitle>
            <CardDescription>
              Activa o desactiva módulos globalmente. Un módulo desactivado no aparecerá
              para ningún usuario ni empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : modules.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Package className="h-8 w-8" />
                <p className="text-sm">No hay módulos registrados</p>
              </div>
            ) : (
              <div className="divide-y">
                {modules.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium">{m.name}</p>
                      {m.description && (
                        <p className="text-sm text-muted-foreground">{m.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">{m.slug}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {m.is_active ? "Activo" : "Inactivo"}
                      </span>
                      <Switch
                        checked={m.is_active}
                        onCheckedChange={(is_active) =>
                          toggleModuleMutation.mutate({ id: m.id, is_active })
                        }
                        disabled={toggleModuleMutation.isPending}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Ajustes generales (placeholder) ── */}
        <Card>
          <CardHeader>
            <CardTitle>Ajustes generales</CardTitle>
            <CardDescription>
              Configuración adicional de la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Próximamente: ajustes de notificaciones, branding y más.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
};

export default ConfiguracionPage;
