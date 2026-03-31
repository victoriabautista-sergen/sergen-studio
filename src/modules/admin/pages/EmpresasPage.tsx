import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Building2, ExternalLink, Eye, EyeOff, Loader2, Pencil, Plus, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminShell from "../components/AdminShell";

type CompanyRow = {
  id: string;
  company_name: string;
  ruc: string | null;
  industry: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  user_count: number;
  active_modules: number;
};

type ModuleRow = {
  id: string;
  name: string;
  slug: string;
};

const planLabel = (plan: string | null) => {
  if (plan === "trial") return "Prueba gratuita";
  if (plan === "basic") return "Plan Básico";
  if (plan === "advanced") return "Plan Avanzado";
  return null;
};

const StatusBadge = ({ status, plan }: { status: string | null; plan: string | null }) => {
  const label = planLabel(plan);
  if (status === "active" && label)
    return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">{label}</Badge>;
  if (status === "suspended" && label)
    return <Badge className="bg-destructive/15 text-destructive border-destructive/30">{label} (Suspendida)</Badge>;
  return <Badge variant="destructive">Sin plan</Badge>;
};

const BREADCRUMBS = [{ label: "Empresas" }];

const EmpresasPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  // Company fields
  const [name, setName] = useState("");
  const [ruc, setRuc] = useState("");
  const [industry, setIndustry] = useState("");
  // Admin user fields
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Module selection
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<string>("trial");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editRuc, setEditRuc] = useState("");

  // Fetch available modules for assignment
  const { data: availableModules = [] } = useQuery({
    queryKey: ["admin-modules-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, name, slug")
        .eq("is_active", true)
        .neq("slug", "admin-panel")
        .order("name");
      if (error) throw error;
      return (data ?? []) as ModuleRow[];
    },
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-empresas"],
    queryFn: async () => {
      const [{ data: clients, error }, { data: subs }, { data: clientUsers }, { data: companyMods }] = await Promise.all([
        supabase.from("clients").select("id, company_name, ruc, industry").order("company_name"),
        supabase.from("subscriptions").select("client_id, plan, status").order("created_at", { ascending: false }),
        supabase.from("client_users").select("client_id"),
        supabase.from("company_modules").select("company_id").eq("enabled", true),
      ]);
      if (error) throw error;

      const subByClient = new Map<string, { status: string; plan: string }>();
      for (const s of subs ?? []) {
        if (!subByClient.has(s.client_id)) subByClient.set(s.client_id, { status: s.status, plan: s.plan });
      }

      const userCountByClient = new Map<string, number>();
      for (const cu of clientUsers ?? []) {
        userCountByClient.set(cu.client_id, (userCountByClient.get(cu.client_id) ?? 0) + 1);
      }

      const modCountByClient = new Map<string, number>();
      for (const cm of companyMods ?? []) {
        modCountByClient.set(cm.company_id, (modCountByClient.get(cm.company_id) ?? 0) + 1);
      }

      return (clients ?? []).map((c): CompanyRow => ({
        id: c.id,
        company_name: c.company_name,
        ruc: c.ruc,
        industry: c.industry,
        subscription_status: subByClient.get(c.id) ?? null,
        user_count: userCountByClient.get(c.id) ?? 0,
        active_modules: modCountByClient.get(c.id) ?? 0,
      }));
    },
  });

  const filtered = companies.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.company_name.toLowerCase().includes(q) || (c.ruc?.toLowerCase().includes(q) ?? false);
  });

  const resetCreateForm = () => {
    setName(""); setRuc(""); setIndustry("");
    setAdminName(""); setAdminEmail(""); setAdminPassword("");
    setSelectedModuleIds([]); setShowPassword(false); setSelectedPlan("trial");
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-company-with-admin", {
        body: {
          company_name: name.trim(),
          ruc: ruc.trim() || null,
          industry: industry.trim() || null,
          admin_name: adminName.trim(),
          admin_email: adminEmail.trim().toLowerCase(),
          admin_password: adminPassword,
          module_ids: selectedModuleIds,
          plan: selectedPlan !== "none" ? selectedPlan : null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Empresa y administrador creados correctamente." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setCreateOpen(false);
      resetCreateForm();
    },
    onError: (err: Error) => {
      toast({ title: err.message || "Error al crear empresa.", variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").update({
        company_name: editName.trim(),
        ruc: editRuc.trim() || null,
      }).eq("id", editId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Empresa actualizada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setEditOpen(false);
    },
    onError: () => toast({ title: "Error al actualizar.", variant: "destructive" }),
  });

  const openEdit = (c: CompanyRow) => {
    setEditId(c.id);
    setEditName(c.company_name);
    setEditRuc(c.ruc ?? "");
    setEditOpen(true);
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const isCreateValid =
    name.trim() &&
    adminName.trim() &&
    adminEmail.trim() &&
    adminPassword.length >= 6;

  return (
    <AdminShell breadcrumbs={BREADCRUMBS}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Empresas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gestión de empresas clientes del sistema.
            </p>
          </div>
          <Button onClick={() => { resetCreateForm(); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Crear empresa
          </Button>
        </div>

        <Card>
          <div className="p-4 border-b">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o RUC…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Building2 className="h-10 w-10" />
                <p className="text-sm">{search ? "Sin resultados" : "No hay empresas registradas"}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>RUC</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead className="text-center">Usuarios</TableHead>
                    <TableHead className="text-center">Módulos activos</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.company_name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.ruc ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.industry ?? "—"}</TableCell>
                      <TableCell className="text-center">{c.user_count}</TableCell>
                      <TableCell className="text-center">{c.active_modules}</TableCell>
                      <TableCell><StatusBadge status={c.subscription_status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/admin-panel/empresas/${c.id}`)}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Abrir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create dialog — includes company info + admin user + module selection */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); resetCreateForm(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Company info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Datos de la empresa</h3>
              <div className="space-y-2">
                <Label>Nombre de la empresa *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Empresa ABC S.A.C." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>RUC</Label>
                  <Input value={ruc} onChange={(e) => setRuc(e.target.value)} placeholder="20123456789" />
                </div>
                <div className="space-y-2">
                  <Label>Sector</Label>
                  <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Manufactura..." />
                </div>
              </div>
            </div>

            <Separator />

            {/* Admin user */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Administrador de la empresa</h3>
              <p className="text-xs text-muted-foreground">
                Se creará una cuenta de administrador que podrá gestionar los usuarios y módulos de la empresa.
              </p>
              <div className="space-y-2">
                <Label>Nombre completo *</Label>
                <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Juan Pérez" />
              </div>
              <div className="space-y-2">
                <Label>Correo electrónico *</Label>
                <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Contraseña *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {adminPassword && adminPassword.length < 6 && (
                  <p className="text-xs text-destructive">La contraseña debe tener al menos 6 caracteres.</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Plan / subscription */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Plan de suscripción</h3>
              <p className="text-xs text-muted-foreground">
                Toda empresa requiere un plan activo para acceder a la plataforma.
              </p>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Prueba gratuita (30 días)</SelectItem>
                  <SelectItem value="basic">Plan Básico</SelectItem>
                  <SelectItem value="advanced">Plan Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Module selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Módulos habilitados</h3>
              <p className="text-xs text-muted-foreground">
                Selecciona los módulos que la empresa tendrá disponibles. El administrador también recibirá acceso a estos módulos.
              </p>
              {availableModules.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay módulos disponibles.</p>
              ) : (
                <div className="space-y-2">
                  {availableModules.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedModuleIds.includes(m.id)}
                        onCheckedChange={() => toggleModule(m.id)}
                      />
                      <span className="text-sm">{m.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetCreateForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !isCreateValid}
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</>
              ) : (
                "Crear empresa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar empresa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>RUC</Label>
              <Input value={editRuc} onChange={(e) => setEditRuc(e.target.value)} placeholder="20123456789" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending || !editName.trim()}>
              {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default EmpresasPage;
