import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin empresa",
  client_user: "Operador",
  super_admin: "Super Admin",
  technical_user: "Técnico",
};

const CompanyUsersSection = ({ companyId, readOnly = false }: { companyId: string; readOnly?: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("client_user");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["company-mgmt-users", companyId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("client_users").select("user_id").eq("client_id", companyId);
      if (error) throw error;
      const userIds = (rows ?? []).map((r) => r.user_id);
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

  const removeUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("client_users").delete().eq("client_id", companyId).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Usuario removido." });
      queryClient.invalidateQueries({ queryKey: ["company-mgmt-users", companyId] });
      setRemovingUserId(null);
    },
    onError: () => toast({ title: "Error al remover.", variant: "destructive" }),
  });

  const addUser = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", email.trim().toLowerCase()).maybeSingle();
      if (!profile) throw new Error("USER_NOT_FOUND");
      const { data: existing } = await supabase.from("client_users").select("id").eq("client_id", companyId).eq("user_id", profile.user_id).maybeSingle();
      if (existing) throw new Error("ALREADY_IN_COMPANY");
      await supabase.from("client_users").insert({ client_id: companyId, user_id: profile.user_id });
      const { data: existingRole } = await supabase.from("user_roles").select("id").eq("user_id", profile.user_id).maybeSingle();
      if (existingRole) {
        await supabase.from("user_roles").update({ role: role as any }).eq("user_id", profile.user_id);
      } else {
        await supabase.from("user_roles").insert({ user_id: profile.user_id, role: role as any });
      }
    },
    onSuccess: () => {
      toast({ title: "Usuario agregado." });
      queryClient.invalidateQueries({ queryKey: ["company-mgmt-users", companyId] });
      setAddOpen(false); setAddEmail(""); setAddRole("client_user");
    },
    onError: (err: Error) => {
      const msg = err.message === "USER_NOT_FOUND" ? "No existe un usuario con ese email." :
        err.message === "ALREADY_IN_COMPANY" ? "El usuario ya pertenece a esta empresa." : "Error al agregar.";
      toast({ title: msg, variant: "destructive" });
    },
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Usuarios</CardTitle>
          {!readOnly && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />Crear usuario
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">No hay usuarios en esta empresa.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  {!readOnly && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={u.is_active ? "bg-green-500/20 text-green-700 border-green-500/30" : "bg-muted text-muted-foreground"}>
                        {u.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {!readOnly && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setRemovingUserId(u.user_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Agregar usuario</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email del usuario *</Label>
                  <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="usuario@ejemplo.com" />
                  <p className="text-xs text-muted-foreground">El usuario debe tener una cuenta existente.</p>
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
                <Button onClick={() => addUser.mutate({ email: addEmail, role: addRole })} disabled={addUser.isPending || !addEmail.trim()}>
                  {addUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
      )}
    </>
  );
};

export default CompanyUsersSection;
