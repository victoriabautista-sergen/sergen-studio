import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2, Trash2, UserPlus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type CompanyUser = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  role: string;
};

const EmpresaUsuariosTab = ({ companyId }: { companyId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("client_user");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Fetch company users
  const { data: companyUsers = [], isLoading } = useQuery({
    queryKey: ["admin-empresa-users", companyId],
    queryFn: async () => {
      const { data: clientUserRows, error } = await supabase
        .from("client_users").select("user_id").eq("client_id", companyId);
      if (error) throw error;
      const userIds = (clientUserRows ?? []).map((r) => r.user_id);
      if (userIds.length === 0) return [];

      const [{ data: profiles }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email, is_active").in("user_id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
      ]);

      const roleByUser = new Map((roleRows ?? []).map((r) => [r.user_id, r.role]));
      return (profiles ?? []).map((p): CompanyUser => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        is_active: p.is_active,
        role: roleByUser.get(p.user_id) ?? "client_user",
      }));
    },
  });

  // Fetch company modules (for user permission toggles)
  const { data: companyModules = [] } = useQuery({
    queryKey: ["admin-empresa-company-modules", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_modules")
        .select("module_id, modules(id, name, slug)")
        .eq("company_id", companyId)
        .eq("enabled", true);
      return (data ?? []).map((r: any) => ({ id: r.modules.id, name: r.modules.name, slug: r.modules.slug }));
    },
  });

  // Fetch user_modules for permission toggles
  const { data: userModulesMap = {} } = useQuery({
    queryKey: ["admin-empresa-user-modules", companyId],
    enabled: companyUsers.length > 0,
    queryFn: async () => {
      const userIds = companyUsers.map((u) => u.user_id);
      const { data } = await supabase.from("user_modules").select("id, user_id, module_id, enabled").in("user_id", userIds);
      const map: Record<string, Record<string, { id: string; enabled: boolean }>> = {};
      for (const row of data ?? []) {
        if (!map[row.user_id]) map[row.user_id] = {};
        map[row.user_id][row.module_id] = { id: row.id, enabled: row.enabled };
      }
      return map;
    },
  });

  const toggleUserActive = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_active: active }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-empresa-users", companyId] }),
    onError: () => toast({ title: "Error al cambiar estado.", variant: "destructive" }),
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data: existing } = await supabase.from("user_roles").select("id").eq("user_id", userId).maybeSingle();
      if (existing) {
        await supabase.from("user_roles").update({ role: role as any }).eq("user_id", userId);
      } else {
        await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-empresa-users", companyId] }),
    onError: () => toast({ title: "Error al cambiar rol.", variant: "destructive" }),
  });

  const removeUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("client_users").delete().eq("client_id", companyId).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Usuario removido." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-users", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setRemovingUserId(null);
    },
    onError: () => toast({ title: "Error al remover.", variant: "destructive" }),
  });

  const addUser = useMutation({
    mutationFn: async ({ name, email, password, role }: { name: string; email: string; password: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke("add-user-to-company", {
        body: {
          company_id: companyId,
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        },
      });
      if (error) throw new Error("Error de conexión");
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Usuario creado y asignado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-users", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setAddOpen(false); setAddName(""); setAddEmail(""); setAddPassword(""); setAddRole("client_user");
    },
    onError: (err: Error) => {
      toast({ title: err.message || "Error al crear usuario.", variant: "destructive" });
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-empresa-user-modules", companyId] }),
    onError: () => toast({ title: "Error al cambiar módulo.", variant: "destructive" }),
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Usuarios de la empresa</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />Agregar usuario
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : companyUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">No hay usuarios en esta empresa.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyUsers.map((user) => (
                  <>
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <button onClick={() => setExpandedUserId(expandedUserId === user.user_id ? null : user.user_id)}
                          className="text-muted-foreground hover:text-foreground" title="Permisos de módulos">
                          {expandedUserId === user.user_id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{user.full_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email ?? "—"}</TableCell>
                      <TableCell>
                        <Select value={user.role} onValueChange={(role) => changeRole.mutate({ userId: user.user_id, role })}>
                          <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client_user">Operador</SelectItem>
                            <SelectItem value="admin">Admin empresa</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={user.is_active} onCheckedChange={(active) => toggleUserActive.mutate({ userId: user.user_id, active })} />
                          <span className="text-sm text-muted-foreground">{user.is_active ? "Activo" : "Inactivo"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setRemovingUserId(user.user_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedUserId === user.user_id && (
                      <TableRow key={`${user.user_id}-mods`} className="bg-muted/30">
                        <TableCell colSpan={6} className="py-3 pl-10">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Permisos de módulos (solo módulos contratados por la empresa)</p>
                          <div className="flex flex-wrap gap-4">
                            {companyModules.length === 0 ? (
                              <p className="text-xs text-muted-foreground">La empresa no tiene módulos asignados.</p>
                            ) : companyModules.map((m) => {
                              const state = userModulesMap[user.user_id]?.[m.id] ?? { id: null, enabled: false };
                              return (
                                <div key={m.id} className="flex items-center gap-2">
                                  <Switch checked={state.enabled} onCheckedChange={(checked) => toggleModule.mutate({ userId: user.user_id, moduleId: m.id, enabled: checked })} />
                                  <Label className="text-sm font-normal">{m.name}</Label>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add user dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Crear usuario para la empresa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Nombre del usuario" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="usuario@ejemplo.com" />
            </div>
            <div className="space-y-2">
              <Label>Contraseña *</Label>
              <Input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={addRole} onValueChange={setAddRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_user">Operador</SelectItem>
                  <SelectItem value="admin">Admin empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => addUser.mutate({ name: addName, email: addEmail, password: addPassword, role: addRole })}
              disabled={addUser.isPending || !addEmail.trim() || !addName.trim() || addPassword.length < 6}
            >
              {addUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove user confirm */}
      <AlertDialog open={Boolean(removingUserId)} onOpenChange={(open) => !open && setRemovingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover usuario?</AlertDialogTitle>
            <AlertDialogDescription>El usuario dejará de pertenecer a esta empresa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (removingUserId) removeUser.mutate(removingUserId); }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmpresaUsuariosTab;
