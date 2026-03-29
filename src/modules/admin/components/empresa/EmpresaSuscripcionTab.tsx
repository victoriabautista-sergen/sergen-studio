import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const formatDate = (value: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "active") return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Activa</Badge>;
  if (status === "suspended") return <Badge className="bg-destructive/15 text-destructive border-destructive/30">Suspendida</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
};

const EmpresaSuscripcionTab = ({ companyId }: { companyId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewEndDate, setRenewEndDate] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newPlan, setNewPlan] = useState("basic");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["admin-empresa-sub", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions")
        .select("id, plan, status, start_date, end_date")
        .eq("client_id", companyId)
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      if (!subscription) return;
      const { error } = await supabase.from("subscriptions").update({ status }).eq("id", subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Suscripción actualizada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-sub", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
    },
    onError: () => toast({ title: "Error.", variant: "destructive" }),
  });

  const renewSub = useMutation({
    mutationFn: async (endDate: string) => {
      if (!subscription) return;
      const { error } = await supabase.from("subscriptions").update({ status: "active", end_date: endDate }).eq("id", subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Suscripción renovada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-sub", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setRenewOpen(false); setRenewEndDate("");
    },
    onError: () => toast({ title: "Error.", variant: "destructive" }),
  });

  const createSub = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("subscriptions").insert({
        client_id: companyId,
        plan: newPlan,
        start_date: newStartDate,
        end_date: newEndDate || null,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Suscripción creada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-sub", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      setCreateOpen(false); setNewPlan("basic"); setNewStartDate(""); setNewEndDate("");
    },
    onError: () => toast({ title: "Error.", variant: "destructive" }),
  });

  if (isLoading) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Suscripción</CardTitle>
          {subscription ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setRenewOpen(true)}>Renovar</Button>
              {subscription.status === "active" ? (
                <Button variant="destructive" size="sm" onClick={() => updateStatus.mutate("suspended")} disabled={updateStatus.isPending}>Suspender</Button>
              ) : (
                <Button size="sm" onClick={() => updateStatus.mutate("active")} disabled={updateStatus.isPending}>Activar</Button>
              )}
            </div>
          ) : (
            <Button size="sm" onClick={() => setCreateOpen(true)}>Crear suscripción</Button>
          )}
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="grid sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Plan</p>
                <p className="font-medium capitalize">{subscription.plan}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estado</p>
                <StatusBadge status={subscription.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Inicio</p>
                <p className="font-medium">{formatDate(subscription.start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Vencimiento</p>
                <p className="font-medium">{formatDate(subscription.end_date)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Esta empresa no tiene suscripción activa.</p>
          )}
        </CardContent>
      </Card>

      {/* Renew dialog */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Renovar suscripción</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Nueva fecha de vencimiento</Label>
            <Input type="date" value={renewEndDate} onChange={(e) => setRenewEndDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewOpen(false)}>Cancelar</Button>
            <Button onClick={() => renewSub.mutate(renewEndDate)} disabled={renewSub.isPending || !renewEndDate}>
              {renewSub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Renovar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create subscription dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Crear suscripción</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
              <SelectItem value="trial">Prueba gratuita</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de inicio *</Label>
              <Input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de vencimiento</Label>
              <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={() => createSub.mutate()} disabled={createSub.isPending || !newStartDate}>
              {createSub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmpresaSuscripcionTab;
