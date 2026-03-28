import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CompanyModulesSection = ({ companyId, readOnly = false }: { companyId: string; readOnly?: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["company-mgmt-users", companyId],
    queryFn: async () => {
      const { data: rows } = await supabase.from("client_users").select("user_id").eq("client_id", companyId);
      const userIds = (rows ?? []).map((r) => r.user_id);
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      return profiles ?? [];
    },
  });

  const { data: companyModules = [], isLoading: loadingModules } = useQuery({
    queryKey: ["company-mgmt-company-modules", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_modules")
        .select("module_id, modules(id, name, slug)")
        .eq("company_id", companyId)
        .eq("enabled", true);
      return (data ?? []).map((r: any) => ({ id: r.modules.id, name: r.modules.name, slug: r.modules.slug }));
    },
  });

  const { data: userModulesMap = {} } = useQuery({
    queryKey: ["company-mgmt-user-modules", companyId],
    enabled: users.length > 0,
    queryFn: async () => {
      const userIds = users.map((u) => u.user_id);
      const { data } = await supabase.from("user_modules").select("id, user_id, module_id, enabled").in("user_id", userIds);
      const map: Record<string, Record<string, { id: string; enabled: boolean }>> = {};
      for (const row of data ?? []) {
        if (!map[row.user_id]) map[row.user_id] = {};
        map[row.user_id][row.module_id] = { id: row.id, enabled: row.enabled };
      }
      return map;
    },
  });

  const toggleModule = useMutation({
    mutationFn: async ({ userId, moduleId, enabled }: { userId: string; moduleId: string; enabled: boolean }) => {
      const existing = userModulesMap[userId]?.[moduleId];
      if (existing?.id) {
        await supabase.from("user_modules").update({ enabled }).eq("id", existing.id);
      } else {
        await supabase.from("user_modules").insert({ user_id: userId, module_id: moduleId, enabled });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-mgmt-user-modules", companyId] }),
    onError: () => toast({ title: "Error al cambiar permiso.", variant: "destructive" }),
  });

  const isLoading = loadingUsers || loadingModules;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (companyModules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Esta empresa no tiene módulos habilitados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permisos de módulos por usuario</CardTitle>
        <CardDescription>
          {readOnly
            ? "Vista de los permisos de módulos asignados a cada usuario."
            : "Activa o desactiva el acceso a cada módulo para cada usuario."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              {companyModules.map((m) => (
                <TableHead key={m.id} className="text-center">{m.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={companyModules.length + 1} className="text-center text-muted-foreground py-8">
                  No hay usuarios.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{u.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </TableCell>
                  {companyModules.map((m) => {
                    const state = userModulesMap[u.user_id]?.[m.id];
                    const enabled = state?.enabled ?? false;
                    return (
                      <TableCell key={m.id} className="text-center">
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) =>
                            toggleModule.mutate({ userId: u.user_id, moduleId: m.id, enabled: checked })
                          }
                          disabled={readOnly || toggleModule.isPending}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CompanyModulesSection;
