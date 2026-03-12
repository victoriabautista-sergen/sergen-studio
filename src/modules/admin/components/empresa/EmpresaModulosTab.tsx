import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/core/auth/context/AuthContext";

const EmpresaModulosTab = ({ companyId }: { companyId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  // All active global modules
  const { data: allModules = [], isLoading: loadingModules } = useQuery({
    queryKey: ["admin-modules-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("id, name, slug, description, is_active")
        .eq("is_active", true).neq("slug", "admin-panel").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Company's assigned modules
  const { data: companyModules = [], isLoading: loadingCompanyModules } = useQuery({
    queryKey: ["admin-empresa-company-modules", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_modules")
        .select("id, module_id, enabled, assigned_at").eq("company_id", companyId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const companyModuleMap = new Map(companyModules.map((cm) => [cm.module_id, cm]));

  const toggleMutation = useMutation({
    mutationFn: async ({ moduleId, enabled }: { moduleId: string; enabled: boolean }) => {
      const existing = companyModuleMap.get(moduleId);
      if (existing) {
        const { error } = await supabase.from("company_modules").update({ enabled }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_modules").insert({
          company_id: companyId,
          module_id: moduleId,
          enabled,
          assigned_by: user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-company-modules", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
    },
    onError: () => toast({ title: "Error al actualizar módulo.", variant: "destructive" }),
  });

  const isLoading = loadingModules || loadingCompanyModules;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Módulos contratados</CardTitle>
        <CardDescription>
          Asigna los módulos que esta empresa tiene contratados según su plan. Los usuarios solo podrán acceder a los módulos habilitados aquí.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : allModules.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Package className="h-8 w-8" />
            <p className="text-sm">No hay módulos activos en el sistema</p>
          </div>
        ) : (
          <div className="divide-y">
            {allModules.map((m) => {
              const cm = companyModuleMap.get(m.id);
              const enabled = cm?.enabled ?? false;
              return (
                <div key={m.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.name}</p>
                      {enabled && <Badge className="bg-green-500/20 text-green-700 border-green-500/30 text-xs">Activo</Badge>}
                    </div>
                    {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => toggleMutation.mutate({ moduleId: m.id, enabled: checked })}
                    disabled={toggleMutation.isPending}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmpresaModulosTab;
