import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ModuleLayout from "@/shared/components/ModuleLayout";
import PrivateRoute from "@/core/auth/components/PrivateRoute";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import { Building2, Loader2, Users } from "lucide-react";

type UserProfile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
};

type ModuleRow = {
  id: string;
  slug: string;
  name: string;
};

type UserModuleRow = {
  id: string;
  user_id: string;
  module_id: string;
  enabled: boolean;
};

const CompanyAdminContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { clientIds } = useAuthContext();
  const clientId = clientIds[0] ?? null;

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // 1. Fetch user_ids linked to this company
  const { data: companyUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["company-users", clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      // Step 1: get user_ids for this company
      const { data: clientUserRows, error: cuError } = await supabase
        .from("client_users")
        .select("user_id")
        .eq("client_id", clientId!);

      if (cuError) throw cuError;
      if (!clientUserRows || clientUserRows.length === 0) return [];

      const userIds = clientUserRows.map((r) => r.user_id);

      // Step 2: get their profiles
      const { data: profileRows, error: pError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, is_active")
        .in("user_id", userIds);

      if (pError) throw pError;
      return (profileRows ?? []) as UserProfile[];
    },
  });

  // 2. Fetch all active modules (excluding admin-panel)
  const { data: allModules = [] } = useQuery({
    queryKey: ["modules-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, slug, name")
        .eq("is_active", true)
        .neq("slug", "admin-panel");
      if (error) throw error;
      return (data ?? []) as ModuleRow[];
    },
  });

  // 3. Fetch user_modules for the selected user
  const { data: userModules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["user-modules", selectedUser?.user_id],
    enabled: Boolean(selectedUser),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_modules")
        .select("id, user_id, module_id, enabled")
        .eq("user_id", selectedUser!.user_id);
      if (error) throw error;
      return (data ?? []) as UserModuleRow[];
    },
  });

  // Toggle user active/inactive
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Estado del usuario actualizado." });
      queryClient.invalidateQueries({ queryKey: ["company-users", clientId] });
    },
    onError: () => {
      toast({ title: "Error al actualizar usuario.", variant: "destructive" });
    },
  });

  // Toggle module permission
  const toggleModuleMutation = useMutation({
    mutationFn: async ({
      userId,
      moduleId,
      enabled,
      existingId,
    }: {
      userId: string;
      moduleId: string;
      enabled: boolean;
      existingId: string | null;
    }) => {
      if (existingId) {
        const { error } = await supabase
          .from("user_modules")
          .update({ enabled })
          .eq("id", existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_modules")
          .insert({ user_id: userId, module_id: moduleId, enabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-modules", selectedUser?.user_id] });
    },
    onError: () => {
      toast({ title: "Error al actualizar permisos.", variant: "destructive" });
    },
  });

  const isModuleEnabled = (moduleId: string) =>
    userModules.find((um) => um.module_id === moduleId)?.enabled ?? false;

  const getModuleRecordId = (moduleId: string) =>
    userModules.find((um) => um.module_id === moduleId)?.id ?? null;

  if (!clientId) {
    return (
      <ModuleLayout title="Panel de Administrador" icon={Building2}>
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          No se encontró empresa asociada a tu cuenta.
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title="Panel de Administrador" icon={Building2}>
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de Usuarios</h2>
          <p className="text-sm text-muted-foreground">
            Administra los usuarios de tu empresa y sus permisos de acceso a módulos.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios de la empresa
            </CardTitle>
            <CardDescription>
              Activa o desactiva cuentas, y gestiona qué módulos puede ver cada usuario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : companyUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No hay usuarios registrados en tu empresa.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Módulos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.full_name ?? "—"}</TableCell>
                      <TableCell>{user.email ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ userId: user.user_id, isActive: checked })
                            }
                            disabled={toggleActiveMutation.isPending}
                          />
                          <Badge
                            variant="outline"
                            className={
                              user.is_active
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {user.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                          Gestionar módulos
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Module permissions dialog */}
      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Permisos de módulos</DialogTitle>
            <DialogDescription>
              Activa o desactiva módulos para{" "}
              <strong>{selectedUser?.full_name ?? selectedUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          {modulesLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : allModules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay módulos disponibles.
            </p>
          ) : (
            <div className="space-y-1 py-2">
              {allModules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between py-3 px-1 border-b last:border-0"
                >
                  <span className="text-sm font-medium">{module.name}</span>
                  <Switch
                    checked={isModuleEnabled(module.id)}
                    onCheckedChange={(enabled) => {
                      if (!selectedUser) return;
                      toggleModuleMutation.mutate({
                        userId: selectedUser.user_id,
                        moduleId: module.id,
                        enabled,
                        existingId: getModuleRecordId(module.id),
                      });
                    }}
                    disabled={toggleModuleMutation.isPending}
                  />
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedUser(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
};

const CompanyAdminPage = () => (
  <PrivateRoute allowedRoles={["admin"]}>
    <CompanyAdminContent />
  </PrivateRoute>
);

export default CompanyAdminPage;
