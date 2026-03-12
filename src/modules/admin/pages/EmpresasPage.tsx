import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  subscription_plan: string | null;
  subscription_status: string | null;
  user_count: number;
  module_count: number;
};

const StatusBadge = ({ status }: { status: string | null }) => {
  if (status === "active")
    return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Activa</Badge>;
  if (status === "suspended")
    return <Badge className="bg-destructive/15 text-destructive border-destructive/30">Suspendida</Badge>;
  return <Badge variant="secondary">Sin suscripción</Badge>;
};

const BREADCRUMBS = [{ label: "Empresas" }];

const EmpresasPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [ruc, setRuc] = useState("");
  const [industry, setIndustry] = useState("");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-empresas"],
    queryFn: async () => {
      const [{ data: clients, error }, { data: subs }, { data: clientUsers }, { data: compModules }] =
        await Promise.all([
          supabase.from("clients").select("id, company_name, ruc, industry").order("company_name"),
          supabase.from("subscriptions").select("client_id, status, plan").order("created_at", { ascending: false }),
          supabase.from("client_users").select("client_id"),
          supabase.from("company_modules").select("company_id").eq("enabled", true),
        ]);
      if (error) throw error;

      const subByClient = new Map<string, { status: string; plan: string }>();
      for (const s of subs ?? []) {
        if (!subByClient.has(s.client_id)) subByClient.set(s.client_id, { status: s.status, plan: s.plan });
      }

      const countByClient = new Map<string, number>();
      for (const cu of clientUsers ?? []) {
        countByClient.set(cu.client_id, (countByClient.get(cu.client_id) ?? 0) + 1);
      }

      const moduleCountByClient = new Map<string, number>();
      for (const cm of compModules ?? []) {
        moduleCountByClient.set(cm.company_id, (moduleCountByClient.get(cm.company_id) ?? 0) + 1);
      }

      return (clients ?? []).map((c): CompanyRow => ({
        id: c.id,
        company_name: c.company_name,
        ruc: c.ruc,
        industry: c.industry,
        subscription_plan: subByClient.get(c.id)?.plan ?? null,
        subscription_status: subByClient.get(c.id)?.status ?? null,
        user_count: countByClient.get(c.id) ?? 0,
        module_count: moduleCountByClient.get(c.id) ?? 0,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clients")
        .insert({ company_name: name.trim(), ruc: ruc.trim() || null, industry: industry.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Empresa creada correctamente." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setDialogOpen(false);
      setName(""); setRuc(""); setIndustry("");
    },
    onError: () => toast({ title: "Error al crear empresa.", variant: "destructive" }),
  });

  return (
    <AdminShell breadcrumbs={BREADCRUMBS}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Empresas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Centro de administración de empresas clientes.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva empresa
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : companies.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Building2 className="h-10 w-10" />
                <p className="text-sm">No hay empresas registradas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>RUC</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Módulos</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link to={`/admin-panel/empresas/${c.id}`} className="font-medium hover:underline">
                          {c.company_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.ruc ?? "—"}</TableCell>
                      <TableCell className="capitalize">{c.subscription_plan ?? "—"}</TableCell>
                      <TableCell>{c.user_count}</TableCell>
                      <TableCell>{c.module_count}</TableCell>
                      <TableCell><StatusBadge status={c.subscription_status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nueva empresa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la empresa *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Empresa ABC S.A.C." />
            </div>
            <div className="space-y-2">
              <Label>RUC</Label>
              <Input value={ruc} onChange={(e) => setRuc(e.target.value)} placeholder="Ej: 20123456789" />
            </div>
            <div className="space-y-2">
              <Label>Industria</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ej: Manufactura, Minería..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default EmpresasPage;
