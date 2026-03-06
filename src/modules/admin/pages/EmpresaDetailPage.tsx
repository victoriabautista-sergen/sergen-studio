import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Loader2, Pencil, Trash2, UserPlus } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Company = {
  id: string;
  company_name: string;
  industry: string | null;
};

type Subscription = {
  id: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string | null;
};

type CompanyUser = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  role: string;
};

type Module = {
  id: string;
  name: string;
  slug: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (value: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const SubscriptionBadge = ({ status }: { status: string }) => {
  if (status === "active")
    return (
      <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Activa</Badge>
    );
  if (status === "suspended")
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/30">
        Suspendida
      </Badge>
    );
  return <Badge variant="secondary">{status}</Badge>;
};

// ─── User modules row (expandable) ────────────────────────────────────────────

const UserModulesRow = ({
  userId,
  modules,
  userModules,
  onToggle,
}: {
  userId: string;
  modules: Module[];
  userModules: Record<string, { id: string | null; enabled: boolean }>;
  onToggle: (userId: string, moduleId: string, enabled: boolean) => void;
}) => (
  <TableRow className="bg-muted/30">
    <TableCell colSpan={5} className="py-3 pl-10">
      <div className="flex flex-wrap gap-4">
        {modules.map((m) => {
          const state = userModules[m.id] ?? { id: null, enabled: false };
          return (
            <div key={m.id} className="flex items-center gap-2">
              <Switch
                checked={state.enabled}
                onCheckedChange={(checked) => onToggle(userId, m.id, checked)}
                id={`mod-${userId}-${m.id}`}
              />
              <Label htmlFor={`mod-${userId}-${m.id}`} className="text-sm font-normal">
                {m.name}
              </Label>
            </div>
          );
        })}
        {modules.length === 0 && (
          <p className="text-xs text-muted-foreground">No hay módulos activos.</p>
        )}
      </div>
    </TableCell>
  </TableRow>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const EmpresaDetailPage = () => {
  const { id: companyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog state
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");

  const [renewOpen, setRenewOpen] = useState(false);
  const [renewEndDate, setRenewEndDate] = useState("");

  const [deleteCompanyOpen, setDeleteCompanyOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserRole, setAddUserRole] = useState<string>("client_user");

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["admin-empresa", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, industry")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data as Company;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["admin-empresa-sub", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id, plan, status, start_date, end_date")
        .eq("client_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as Subscription) ?? null;
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["admin-modules-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, name, slug")
        .eq("is_active", true)
        .neq("slug", "admin-panel")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Module[];
    },
  });

  const { data: companyUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-empresa-users", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data: clientUserRows, error } = await supabase
        .from("client_users")
        .select("user_id")
        .eq("client_id", companyId!);
      if (error) throw error;
      const userIds = (clientUserRows ?? []).map((r) => r.user_id);
      if (userIds.length === 0) return [];

      const [{ data: profiles }, { data: roleRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, full_name, email, is_active")
          .in("user_id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
      ]);

      const roleByUser = new Map((roleRows ?? []).map((r) => [r.user_id, r.role]));

      return (profiles ?? []).map(
        (p): CompanyUser => ({
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          is_active: p.is_active,
          role: roleByUser.get(p.user_id) ?? "client_user",
        }),
      );
    },
  });

  // user_modules map: userId -> moduleId -> { id, enabled }
  const { data: userModulesMap = {} } = useQuery({
    queryKey: ["admin-empresa-user-modules", companyId],
    enabled: companyUsers.length > 0,
    queryFn: async () => {
      const userIds = companyUsers.map((u) => u.user_id);
      const { data } = await supabase
        .from("user_modules")
        .select("id, user_id, module_id, enabled")
        .in("user_id", userIds);

      const map: Record<string, Record<string, { id: string | null; enabled: boolean }>> = {};
      for (const row of data ?? []) {
        if (!map[row.user_id]) map[row.user_id] = {};
        map[row.user_id][row.module_id] = { id: row.id, enabled: row.enabled };
      }
      return map;
    },
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ name, industry }: { name: string; industry: string }) => {
      const { error } = await supabase
        .from("clients")
        .update({ company_name: name, industry: industry || null })
        .eq("id", companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Empresa actualizada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setEditCompanyOpen(false);
    },
    onError: () => toast({ title: "Error al actualizar empresa.", variant: "destructive" }),
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").delete().eq("id", companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Empresa eliminada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      queryClient.invalidateQueries({ queryKey: ["admin-resumen"] });
      navigate("/admin-panel/empresas");
    },
    onError: () => toast({ title: "Error al eliminar empresa.", variant: "destructive" }),
  });

  const updateSubStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!subscription) throw new Error("No subscription");
      const { error } = await supabase
        .from("subscriptions")
        .update({ status })
        .eq("id", subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Suscripción actualizada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-sub", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
    },
    onError: () =>
      toast({ title: "Error al actualizar suscripción.", variant: "destructive" }),
  });

  const renewSubMutation = useMutation({
    mutationFn: async (endDate: string) => {
      if (!subscription) throw new Error("No subscription");
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "active", end_date: endDate })
        .eq("id", subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Suscripción renovada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-sub", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setRenewOpen(false);
      setRenewEndDate("");
    },
    onError: () => toast({ title: "Error al renovar.", variant: "destructive" }),
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: active })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-users", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-resumen"] });
    },
    onError: () =>
      toast({ title: "Error al cambiar estado del usuario.", variant: "destructive" }),
  });

  const changeUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: role as "admin" | "client_user" })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: role as "admin" | "client_user" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-users", companyId] });
    },
    onError: () => toast({ title: "Error al cambiar rol.", variant: "destructive" }),
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("client_users")
        .delete()
        .eq("client_id", companyId!)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Usuario removido de la empresa." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-users", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-user-modules", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setRemovingUserId(null);
    },
    onError: () => toast({ title: "Error al remover usuario.", variant: "destructive" }),
  });

  const addUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      // Find user by email in profiles
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();
      if (error) throw error;
      if (!profile) throw new Error("USER_NOT_FOUND");

      // Check if already in company
      const { data: existing } = await supabase
        .from("client_users")
        .select("id")
        .eq("client_id", companyId!)
        .eq("user_id", profile.user_id)
        .maybeSingle();
      if (existing) throw new Error("ALREADY_IN_COMPANY");

      // Add to company
      const { error: insertError } = await supabase
        .from("client_users")
        .insert({ client_id: companyId!, user_id: profile.user_id });
      if (insertError) throw insertError;

      // Set role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.user_id)
        .maybeSingle();
      if (existingRole) {
        await supabase
          .from("user_roles")
          .update({ role: role as "admin" | "client_user" })
          .eq("user_id", profile.user_id);
      } else {
        await supabase
          .from("user_roles")
          .insert({ user_id: profile.user_id, role: role as "admin" | "client_user" });
      }
    },
    onSuccess: () => {
      toast({ title: "Usuario agregado a la empresa." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-users", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setAddUserOpen(false);
      setAddUserEmail("");
      setAddUserRole("client_user");
    },
    onError: (err: Error) => {
      if (err.message === "USER_NOT_FOUND") {
        toast({
          title: "Usuario no encontrado.",
          description: "No existe un usuario con ese email en la plataforma.",
          variant: "destructive",
        });
      } else if (err.message === "ALREADY_IN_COMPANY") {
        toast({
          title: "El usuario ya pertenece a esta empresa.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error al agregar usuario.", variant: "destructive" });
      }
    },
  });

  const toggleModuleMutation = useMutation({
    mutationFn: async ({
      userId,
      moduleId,
      enabled,
    }: {
      userId: string;
      moduleId: string;
      enabled: boolean;
    }) => {
      const existing = userModulesMap[userId]?.[moduleId];
      if (existing?.id) {
        const { error } = await supabase
          .from("user_modules")
          .update({ enabled })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_modules")
          .insert({ user_id: userId, module_id: moduleId, enabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-empresa-user-modules", companyId],
      });
    },
    onError: () => toast({ title: "Error al cambiar módulo.", variant: "destructive" }),
  });

  // ─── Breadcrumbs ──────────────────────────────────────────────────────────

  const breadcrumbs = [
    { label: "Empresas", href: "/admin-panel/empresas" },
    { label: company?.company_name ?? "…" },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loadingCompany) {
    return (
      <AdminShell breadcrumbs={breadcrumbs}>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  if (!company) {
    return (
      <AdminShell breadcrumbs={breadcrumbs}>
        <p className="text-muted-foreground">Empresa no encontrada.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        {/* ── Datos generales ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Datos generales</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditName(company.company_name);
                  setEditIndustry(company.industry ?? "");
                  setEditCompanyOpen(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteCompanyOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar empresa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Nombre
              </p>
              <p className="font-medium">{company.company_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Industria
              </p>
              <p className="font-medium">{company.industry ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Suscripción ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Suscripción</CardTitle>
            {subscription && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRenewOpen(true)}
                >
                  Renovar
                </Button>
                {subscription.status === "active" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => updateSubStatusMutation.mutate("suspended")}
                    disabled={updateSubStatusMutation.isPending}
                  >
                    Suspender
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => updateSubStatusMutation.mutate("active")}
                    disabled={updateSubStatusMutation.isPending}
                  >
                    Activar
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="grid sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Plan
                  </p>
                  <p className="font-medium capitalize">{subscription.plan}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Estado
                  </p>
                  <SubscriptionBadge status={subscription.status} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Inicio
                  </p>
                  <p className="font-medium">{formatDate(subscription.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Vencimiento
                  </p>
                  <p className="font-medium">{formatDate(subscription.end_date)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta empresa no tiene suscripción activa.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Usuarios ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usuarios</CardTitle>
            <Button size="sm" onClick={() => setAddUserOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar usuario
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingUsers ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : companyUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">
                No hay usuarios en esta empresa.
              </p>
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
                          <button
                            onClick={() =>
                              setExpandedUserId(
                                expandedUserId === user.user_id ? null : user.user_id,
                              )
                            }
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Ver módulos"
                          >
                            {expandedUserId === user.user_id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
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
                              changeUserRoleMutation.mutate({
                                userId: user.user_id,
                                role,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client_user">
                                Usuario cliente
                              </SelectItem>
                              <SelectItem value="admin">Admin empresa</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.is_active}
                              onCheckedChange={(active) =>
                                toggleUserActiveMutation.mutate({
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
                            onClick={() => setRemovingUserId(user.user_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {expandedUserId === user.user_id && (
                        <UserModulesRow
                          key={`${user.user_id}-modules`}
                          userId={user.user_id}
                          modules={modules}
                          userModules={userModulesMap[user.user_id] ?? {}}
                          onToggle={(userId, moduleId, enabled) =>
                            toggleModuleMutation.mutate({ userId, moduleId, enabled })
                          }
                        />
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Edit company dialog ── */}
      <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nombre de la empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Industria</Label>
              <Input
                value={editIndustry}
                onChange={(e) => setEditIndustry(e.target.value)}
                placeholder="Ej: Manufactura"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCompanyOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                updateCompanyMutation.mutate({
                  name: editName.trim(),
                  industry: editIndustry.trim(),
                })
              }
              disabled={updateCompanyMutation.isPending || !editName.trim()}
            >
              {updateCompanyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Renew subscription dialog ── */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renovar suscripción</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nueva fecha de vencimiento</Label>
            <Input
              type="date"
              value={renewEndDate}
              onChange={(e) => setRenewEndDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => renewSubMutation.mutate(renewEndDate)}
              disabled={renewSubMutation.isPending || !renewEndDate}
            >
              {renewSubMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Renovar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add user dialog ── */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar usuario a la empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email del usuario *</Label>
              <Input
                type="email"
                value={addUserEmail}
                onChange={(e) => setAddUserEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
              <p className="text-xs text-muted-foreground">
                El usuario debe tener una cuenta existente en la plataforma.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={addUserRole} onValueChange={setAddUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_user">Usuario cliente</SelectItem>
                  <SelectItem value="admin">Admin empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                addUserMutation.mutate({ email: addUserEmail, role: addUserRole })
              }
              disabled={addUserMutation.isPending || !addUserEmail.trim()}
            >
              {addUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Agregar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete company confirm ── */}
      <AlertDialog open={deleteCompanyOpen} onOpenChange={setDeleteCompanyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la empresa y todos sus datos asociados (usuarios,
              suscripciones). No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCompanyMutation.mutate()}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Remove user confirm ── */}
      <AlertDialog
        open={Boolean(removingUserId)}
        onOpenChange={(open) => !open && setRemovingUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Remover usuario de la empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario dejará de pertenecer a esta empresa. Su cuenta no se eliminará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removingUserId) removeUserMutation.mutate(removingUserId);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
};

export default EmpresaDetailPage;
