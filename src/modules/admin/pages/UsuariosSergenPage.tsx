import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, Trash2, UserPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminShell from "../components/AdminShell";

type SergenUser = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  role: "super_admin" | "technical_user";
  role_row_id: string;
};

const BREADCRUMBS = [{ label: "Usuarios Sergen" }];

const RoleBadge = ({ role }: { role: string }) =>
  role === "super_admin" ? (
    <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">
      Super Admin
    </Badge>
  ) : (
    <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">
      Usuario técnico
    </Badge>
  );

const UsuariosSergenPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"super_admin" | "technical_user">("technical_user");
  const [newPassword, setNewPassword] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-sergen-users"],
    queryFn: async () => {
      const { data: roleRows, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .in("role", ["super_admin", "technical_user"]);
      if (error) throw error;
      if (!roleRows || roleRows.length === 0) return [];

      const userIds = roleRows.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, is_active")
        .in("user_id", userIds);

      const profileByUser = new Map(
        (profiles ?? []).map((p) => [p.user_id, p]),
      );

      return roleRows.map((r): SergenUser => {
        const p = profileByUser.get(r.user_id);
        return {
          user_id: r.user_id,
          full_name: p?.full_name ?? null,
          email: p?.email ?? null,
          is_active: p?.is_active ?? true,
          role: r.role as "super_admin" | "technical_user",
          role_row_id: r.id,
        };
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: active })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sergen-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-resumen"] });
    },
    onError: () =>
      toast({ title: "Error al cambiar estado.", variant: "destructive" }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "super_admin" | "technical_user";
    }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-sergen-users"] }),
    onError: () => toast({ title: "Error al cambiar rol.", variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (roleRowId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleRowId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Rol Sergen eliminado. El usuario seguirá existiendo en la plataforma." });
      queryClient.invalidateQueries({ queryKey: ["admin-sergen-users"] });
      setDeletingId(null);
    },
    onError: () => toast({ title: "Error al eliminar.", variant: "destructive" }),
  });

  // Note: creating auth users requires server-side (service_role).
  // We use supabase.auth.signUp here, which works only if email confirmations
  // are disabled in the Supabase project settings.
  const createUserMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      fullName,
      role,
    }: {
      email: string;
      password: string;
      fullName: string;
      role: "super_admin" | "technical_user";
    }) => {
      // Check if profile already exists
      const { data: existing } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        // User already exists — just assign Sergen role
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id, role")
          .eq("user_id", existing.user_id)
          .maybeSingle();

        if (existingRole) {
          const { error } = await supabase
            .from("user_roles")
            .update({ role })
            .eq("user_id", existing.user_id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: existing.user_id, role });
          if (error) throw error;
        }
        return;
      }

      // New user — sign up via Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("No se pudo crear el usuario.");

      // Insert role (profile may be created by DB trigger)
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: authData.user.id, role });
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      toast({ title: "Usuario Sergen creado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["admin-sergen-users"] });
      setCreateOpen(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewRole("technical_user");
    },
    onError: (err: Error) =>
      toast({
        title: "Error al crear usuario.",
        description: err.message,
        variant: "destructive",
      }),
  });

  return (
    <AdminShell breadcrumbs={BREADCRUMBS}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Usuarios Sergen</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Usuarios internos con acceso al panel de administración.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo usuario Sergen
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Shield className="h-10 w-10" />
                <p className="text-sm">No hay usuarios Sergen registrados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(role) =>
                            changeRoleMutation.mutate({
                              userId: user.user_id,
                              role: role as "super_admin" | "technical_user",
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="technical_user">Usuario técnico</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={(active) =>
                              toggleActiveMutation.mutate({
                                userId: user.user_id,
                                active,
                              })
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            {user.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingId(user.role_row_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Create user dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo usuario Sergen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre Apellido"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="usuario@sergen.pe"
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña temporal *</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={newRole}
                onValueChange={(r) => setNewRole(r as "super_admin" | "technical_user")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="technical_user">Usuario técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Si el email ya tiene cuenta en la plataforma, se le asignará el rol Sergen
              directamente sin necesidad de contraseña.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                createUserMutation.mutate({
                  email: newEmail,
                  password: newPassword,
                  fullName: newName,
                  role: newRole,
                })
              }
              disabled={
                createUserMutation.isPending || !newEmail.trim() || !newPassword.trim()
              }
            >
              {createUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Crear usuario"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete role confirm ── */}
      <AlertDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol Sergen?</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario perderá su acceso al panel de administración. Su cuenta en la
              plataforma no se eliminará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingId) deleteUserMutation.mutate(deletingId);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
};

export default UsuariosSergenPage;
