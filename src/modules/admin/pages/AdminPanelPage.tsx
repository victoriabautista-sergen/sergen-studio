import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ModuleLayout from "@/shared/components/ModuleLayout";
import PrivateRoute from "@/core/auth/components/PrivateRoute";
import { Inbox, Loader2, MoreHorizontal, Shield } from "lucide-react";

type InquiryStatus = "pending" | "contacted" | "rejected";

type PlanInquiry = {
  id: string;
  full_name: string;
  company_name: string;
  position: string | null;
  email: string;
  phone: string | null;
  plan_selected: "basic" | "advanced";
  status: InquiryStatus;
  notes: string | null;
  created_at: string;
};

const statusFilterOptions: Array<{ value: "all" | InquiryStatus; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "contacted", label: "Contactado" },
  { value: "rejected", label: "Rechazado" },
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));

const statusBadgeClass = (status: InquiryStatus) => {
  if (status === "pending") return "bg-sergen-warning/20 text-sergen-warning border-sergen-warning/30";
  if (status === "contacted") return "bg-sergen-success/20 text-sergen-success border-sergen-success/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

const statusLabel = (status: InquiryStatus) => {
  if (status === "pending") return "Pendiente";
  if (status === "contacted") return "Contactado";
  return "Rechazado";
};

const planBadgeClass = (plan: "basic" | "advanced") =>
  plan === "basic"
    ? "bg-sergen-info/20 text-sergen-info border-sergen-info/30"
    : "bg-sergen-premium/20 text-sergen-premium border-sergen-premium/30";

const planLabel = (plan: "basic" | "advanced") => (plan === "basic" ? "Básico" : "Avanzado");

const AdminPanelContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatus>("all");
  const [rejectingInquiryId, setRejectingInquiryId] = useState<string | null>(null);
  const [notesInquiry, setNotesInquiry] = useState<PlanInquiry | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ["plan-inquiries"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_inquiries")
        .select("id, full_name, company_name, position, email, phone, plan_selected, status, notes, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PlanInquiry[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InquiryStatus }) => {
      const { error } = await supabase.from("plan_inquiries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Estado actualizado correctamente." });
      queryClient.invalidateQueries({ queryKey: ["plan-inquiries"] });
    },
    onError: () => {
      toast({ title: "Error al actualizar estado.", variant: "destructive" });
    },
  });

  const saveNoteMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("plan_inquiries").update({ notes: notes || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Nota guardada correctamente." });
      queryClient.invalidateQueries({ queryKey: ["plan-inquiries"] });
      setNotesInquiry(null);
      setNotesDraft("");
    },
    onError: () => {
      toast({ title: "Error al guardar nota.", variant: "destructive" });
    },
  });

  const filteredInquiries = useMemo(() => {
    if (statusFilter === "all") return inquiries;
    return inquiries.filter((inquiry) => inquiry.status === statusFilter);
  }, [inquiries, statusFilter]);

  const stats = useMemo(
    () => ({
      total: inquiries.length,
      pending: inquiries.filter((item) => item.status === "pending").length,
      contacted: inquiries.filter((item) => item.status === "contacted").length,
    }),
    [inquiries],
  );

  return (
    <ModuleLayout title="SERGEN Admin Panel" icon={Shield}>
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Solicitudes de Planes</h2>
          <p className="text-sm text-muted-foreground">Gestión de solicitudes entrantes de planes comerciales.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Total solicitudes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-3xl font-bold">{stats.pending}</p>
              <Badge className="bg-sergen-warning/20 text-sergen-warning border-sergen-warning/30">Pendiente</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Contactadas</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-3xl font-bold">{stats.contacted}</p>
              <Badge className="bg-sergen-success/20 text-sergen-success border-sergen-success/30">Contactado</Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Solicitudes</CardTitle>
            <div className="flex flex-wrap gap-2">
              {statusFilterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {inquiriesLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Inbox className="h-10 w-10" />
                <p className="text-sm">No hay solicitudes aún</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell>{formatDate(inquiry.created_at)}</TableCell>
                      <TableCell className="font-medium">{inquiry.full_name}</TableCell>
                      <TableCell>{inquiry.company_name}</TableCell>
                      <TableCell>{inquiry.position || "—"}</TableCell>
                      <TableCell>{inquiry.email}</TableCell>
                      <TableCell>{inquiry.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge className={planBadgeClass(inquiry.plan_selected)}>{planLabel(inquiry.plan_selected)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(inquiry.status)}>{statusLabel(inquiry.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: "contacted" })}
                              disabled={updateStatusMutation.isPending || inquiry.status === "contacted"}
                            >
                              Marcar como contactado
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setRejectingInquiryId(inquiry.id)}
                              disabled={updateStatusMutation.isPending || inquiry.status === "rejected"}
                              className="text-destructive"
                            >
                              Rechazar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setNotesInquiry(inquiry);
                                setNotesDraft(inquiry.notes ?? "");
                              }}
                              disabled={saveNoteMutation.isPending}
                            >
                              Agregar nota
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <AlertDialog open={Boolean(rejectingInquiryId)} onOpenChange={(open) => !open && setRejectingInquiryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la solicitud como rechazada y podrás cambiarla luego si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!rejectingInquiryId) return;
                updateStatusMutation.mutate({ id: rejectingInquiryId, status: "rejected" });
                setRejectingInquiryId(null);
              }}
            >
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(notesInquiry)} onOpenChange={(open) => !open && setNotesInquiry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar nota</DialogTitle>
            <DialogDescription>Guarda comentarios internos para esta solicitud.</DialogDescription>
          </DialogHeader>

          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Escribe una nota interna"
            rows={5}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesInquiry(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!notesInquiry) return;
                saveNoteMutation.mutate({ id: notesInquiry.id, notes: notesDraft.trim() });
              }}
              disabled={saveNoteMutation.isPending}
            >
              Guardar nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
};

const AdminPanelPage = () => (
  <PrivateRoute allowedRoles={["super_admin", "technical_user"]}>
    <AdminPanelContent />
  </PrivateRoute>
);

export default AdminPanelPage;
