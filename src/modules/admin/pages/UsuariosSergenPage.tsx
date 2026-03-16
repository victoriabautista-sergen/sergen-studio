import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, Pencil, Shield, Trash2, UserPlus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import AdminShell from "../components/AdminShell";

type SergenUser = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  role: "super_admin" | "technical_user";
  role_row_id: string;
  telegram_chat_id: string | null;
};

const BREADCRUMBS = [{ label: "Usuarios" }];

const RoleBadge = ({ role }: { role: string }) =>
  role === "super_admin" ? (
    <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">
      Administrador
    </Badge>
  ) : (
    <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">
      Usuario
    </Badge>
  );

const UsuariosSergenPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, role: currentUserRole } = useAuthContext();
  const isAdmin = currentUserRole === "super_admin";

  const [deletingUser, setDeletingUser] = useState<SergenUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SergenUser | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"super_admin" | "technical_user">("technical_user");
  const [newPassword, setNewPassword] = useState("");
  const [newTelegramChatId, setNewTelegramChatId] = useState("");

  const resetForm = () => {
    setNewEmail("");
    setNewName("");
    setNewPassword("");
    setNewRole("technical_user");
    setNewTelegramChatId("");
    setEditingUser(null);
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (u: SergenUser) => {
    setEditingUser(u);
    setNewEmail(u.email ?? "");
    setNewName(u.full_name ?? "");
    setNewRole(u.role);
    setNewTelegramChatId(u.telegram_chat_id ?? "");
    setNewPassword("");
    setFormOpen(true);
  };

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
        .select("user_id, full_name, email, is_active, telegram_chat_id")
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
          telegram_chat_id: (p as any)?.telegram_chat_id ?? null,
        };
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_active: active }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sergen-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-resumen"] });
    },
    onError: () => toast({ title: "Error al cambiar estado.", variant: "destructive" }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "super_admin" | "technical_user" }) => {
      const { error } = await supabase.from("user_roles").update({ role }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-sergen-users"] }),
    onError: () => toast({ title: "Error al cambiar rol.", variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (roleRowId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleRowId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Rol eliminado. El usuario seguirá existiendo en la plataforma." });
      queryClient.invalidateQueries({ queryKey: ["admin-sergen-users"] });
      setDeletingUser(null);
    },
    onError: () => toast({ title: "Error al eliminar.", variant: "destructive" }),
  });

  const editUserMutation = useMutation({
    mutationFn: async ({
      userId, fullName, email, role, telegramChatId,
    }: {
      userId: string; fullName: string; email: string;
      role: "super_admin" | "technical_user"; telegramChatId: string | null;
    }) => {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          email: email || null,
          telegram_chat_id: telegramChatId,
        } as any)
        .eq("user_id", userId);
      if (profileError) throw profileError;

      // Update role
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      toast({ title: "Usuario actualizado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["admin-sergen-users"] });
      setFormOpen(false);
      resetForm();
    },
    onError: (err: Error) =>
      toast({ title: "Error al actualizar usuario.", description: err.message, variant: "destructive" }),
  });

  const createUserMutation = useMutation({
    mutationFn: async ({
      email, password, fullName, role, telegramChatId,
    }: {
      email: string; password: string; fullName: string;
      role: "super_admin" | "technical_user"; telegramChatId?: string;
    }) => {
      const { data: existing } = await supabase
        .from("profiles").select("user_id").eq("email", email.trim().toLowerCase()).maybeSingle();

      if (existing) {
        const { data: existingRole } = await supabase
          .from("user_roles").select("id, role").eq("user_id", existing.user_id).maybeSingle();
        if (existingRole) {
          await supabase.from("user_roles").update({ role }).eq("user_id", existing.user_id);
        } else {
          await supabase.from("user_roles").insert({ user_id: existing.user_id, role });
        }
        if (telegramChatId) {
          await supabase.from("profiles").update({ telegram_chat_id: telegramChatId } as any).eq("user_id", existing.user_id);
        }
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("No se pudo crear el usuario.");

      const { error: roleError } = await supabase.from("user_roles").insert({ user_id: authData.user.id, role });
      if (roleError) throw roleError;

      if (telegramChatId) {
        await supabase.from("profiles").update({ telegram_chat_id: telegramChatId } as any).eq("user_id", authData.user.id);
      }
    },
    onSuccess: () => {
      toast({ title: "Usuario creado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["admin-sergen-users"] });
      setFormOpen(false);
      resetForm();
    },
    onError: (err: Error) =>
      toast({ title: "Error al crear usuario.", description: err.message, variant: "destructive" }),
  });

  const handleFormSubmit = () => {
    if (editingUser) {
      editUserMutation.mutate({
        userId: editingUser.user_id,
        fullName: newName,
        email: newEmail,
        role: newRole,
        telegramChatId: newTelegramChatId.trim() || null,
      });
    } else {
      createUserMutation.mutate({
        email: newEmail,
        password: newPassword,
        fullName: newName,
        role: newRole,
        telegramChatId: newTelegramChatId.trim() || undefined,
      });
    }
  };

  const handleDeleteClick = (u: SergenUser) => {
    if (u.user_id === user?.id) {
      toast({ title: "No puedes eliminar tu propio usuario administrador.", variant: "destructive" });
      return;
    }
    setDeletingUser(u);
  };

  const isFormPending = editingUser ? editUserMutation.isPending : createUserMutation.isPending;
  const isFormValid = editingUser
    ? newEmail.trim().length > 0
    : newEmail.trim().length > 0 && newPassword.trim().length > 0;

  return (
    <AdminShell breadcrumbs={BREADCRUMBS}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Usuarios</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gestión de usuarios internos de la plataforma.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openCreateForm}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo usuario
            </Button>
          )}
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
                <p className="text-sm">No hay usuarios registrados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Telegram</TableHead>
                    <TableHead>Estado</TableHead>
                    {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm">
                          {u.telegram_chat_id ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5" /> ✔ Configurado
                            </span>
                          ) : (
                            <span className="text-muted-foreground">— No configurado</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isAdmin ? (
                            <>
                              <Switch
                                checked={u.is_active}
                                onCheckedChange={(active) => toggleActiveMutation.mutate({ userId: u.user_id, active })}
                              />
                              <span className="text-sm text-muted-foreground">{u.is_active ? "Activo" : "Inactivo"}</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">{u.is_active ? "Activo" : "Inactivo"}</span>
                          )}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditForm(u)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(u)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Create / Edit user dialog ── */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre Apellido" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="usuario@sergen.pe"
                disabled={!!editingUser}
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label>Contraseña temporal *</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={newRole} onValueChange={(r) => setNewRole(r as "super_admin" | "technical_user")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Administrador</SelectItem>
                  <SelectItem value="technical_user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Telegram Chat ID</Label>
              <Input
                value={newTelegramChatId}
                onChange={(e) => setNewTelegramChatId(e.target.value)}
                placeholder="Ejemplo: 123456789"
              />
              <p className="text-xs text-muted-foreground">
                ID de chat de Telegram que se utilizará para enviar alertas automáticas de la plataforma.
              </p>
            </div>
            {!editingUser && (
              <p className="text-xs text-muted-foreground">
                Si el email ya tiene cuenta en la plataforma, se le asignará el rol directamente sin necesidad de contraseña.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleFormSubmit} disabled={isFormPending || !isFormValid}>
              {isFormPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingUser ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete role confirm ── */}
      <AlertDialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario perderá su acceso al panel de administración. Su cuenta en la plataforma no se eliminará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingUser) deleteUserMutation.mutate(deletingUser.role_row_id); }}
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
