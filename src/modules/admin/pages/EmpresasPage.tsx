import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Building2, ExternalLink, Loader2, Pencil, Plus } from "lucide-react";
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
  subscription_status: string | null;
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
  const navigate = useNavigate();

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [ruc, setRuc] = useState("");
  const [industry, setIndustry] = useState("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editRuc, setEditRuc] = useState("");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-empresas"],
    queryFn: async () => {
      const [{ data: clients, error }, { data: subs }] = await Promise.all([
        supabase.from("clients").select("id, company_name, ruc").order("company_name"),
        supabase.from("subscriptions").select("client_id, status").order("created_at", { ascending: false }),
      ]);
      if (error) throw error;

      const subByClient = new Map<string, string>();
      for (const s of subs ?? []) {
        if (!subByClient.has(s.client_id)) subByClient.set(s.client_id, s.status);
      }

      return (clients ?? []).map((c): CompanyRow => ({
        id: c.id,
        company_name: c.company_name,
        ruc: c.ruc,
        subscription_status: subByClient.get(c.id) ?? null,
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
      setCreateOpen(false);
      setName(""); setRuc(""); setIndustry("");
    },
    onError: () => toast({ title: "Error al crear empresa.", variant: "destructive" }),
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
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear empresa
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
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.company_name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.ruc ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={c.subscription_status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" onClick={() => navigate(`/admin-panel/empresas/${c.id}`)}>
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Crear empresa</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear empresa"}
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
