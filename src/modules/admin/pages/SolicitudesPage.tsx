import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Inbox, Loader2, XCircle } from "lucide-react";
import AdminShell from "../components/AdminShell";

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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(value));

const statusBadgeClass = (status: InquiryStatus) => {
  if (status === "pending") return "bg-sergen-warning/20 text-sergen-warning border-sergen-warning/30";
  if (status === "contacted") return "bg-sergen-success/20 text-sergen-success border-sergen-success/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

const statusLabel = (status: InquiryStatus) => {
  if (status === "pending") return "Pendiente";
  if (status === "contacted") return "Aprobado";
  return "Rechazado";
};

const statusFilterOptions: Array<{ value: "all" | InquiryStatus; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "contacted", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
];

const BREADCRUMBS = [{ label: "Solicitudes de Planes" }];

const SolicitudesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatus>("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [notesInquiry, setNotesInquiry] = useState<PlanInquiry | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const { data: inquiries = [], isLoading } = useQuery({
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

  const approveMutation = useMutation({
    mutationFn: async (inquiry: PlanInquiry) => {
      // Create the company
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({ company_name: inquiry.company_name.trim() })
        .select("id")
        .single();
      if (clientError) throw clientError;

      // Create subscription with the selected plan
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("subscriptions").insert({
        client_id: newClient.id,
        plan: inquiry.plan_selected,
        start_date: today,
        status: "active",
      });

      // Mark inquiry as contacted (approved)
      const { error: updateError } = await supabase
        .from("plan_inquiries")
        .update({ status: "contacted" })
        .eq("id", inquiry.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast({ title: "Solicitud aprobada y empresa creada." });
      queryClient.invalidateQueries({ queryKey: ["plan-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
    },
    onError: () => toast({ title: "Error al aprobar solicitud.", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plan_inquiries").update({ status: "rejected" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Solicitud rechazada." });
      queryClient.invalidateQueries({ queryKey: ["plan-inquiries"] });
      setRejectingId(null);
    },
    onError: () => toast({ title: "Error al rechazar.", variant: "destructive" }),
  });

  const saveNoteMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("plan_inquiries").update({ notes: notes || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Nota guardada." });
      queryClient.invalidateQueries({ queryKey: ["plan-inquiries"] });
      setNotesInquiry(null); setNotesDraft("");
    },
    onError: () => toast({ title: "Error al guardar nota.", variant: "destructive" }),
  });

  const filteredInquiries = useMemo(
    () => statusFilter === "all" ? inquiries : inquiries.filter((i) => i.status === statusFilter),
    [inquiries, statusFilter],
  );

  return (
    <AdminShell breadcrumbs={BREADCRUMBS}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Solicitudes de Planes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Lista de espera de empresas que solicitan acceso al sistema.
          </p>
        </div>

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

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Inbox className="h-10 w-10" />
                <p className="text-sm">No hay solicitudes</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{inquiry.company_name}</p>
                          <p className="text-xs text-muted-foreground">Plan: {inquiry.plan_selected === "basic" ? "Básico" : "Avanzado"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{inquiry.full_name}</p>
                          <p className="text-xs text-muted-foreground">{inquiry.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(inquiry.created_at)}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(inquiry.status)}>
                          {statusLabel(inquiry.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inquiry.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate(inquiry)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setRejectingId(inquiry.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </>
                          )}
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

      {/* Reject confirm */}
      <AlertDialog open={Boolean(rejectingId)} onOpenChange={(open) => !open && setRejectingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la solicitud como rechazada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (rejectingId) rejectMutation.mutate(rejectingId); }}
            >
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notes dialog */}
      <Dialog open={Boolean(notesInquiry)} onOpenChange={(open) => !open && setNotesInquiry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar nota</DialogTitle>
            <DialogDescription>Guarda comentarios internos para esta solicitud.</DialogDescription>
          </DialogHeader>
          <Textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} placeholder="Escribe una nota interna" rows={5} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesInquiry(null)}>Cancelar</Button>
            <Button onClick={() => { if (notesInquiry) saveNoteMutation.mutate({ id: notesInquiry.id, notes: notesDraft.trim() }); }} disabled={saveNoteMutation.isPending}>
              Guardar nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default SolicitudesPage;
