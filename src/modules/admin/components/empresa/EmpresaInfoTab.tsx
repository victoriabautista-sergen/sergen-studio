import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Company {
  id: string;
  company_name: string;
  ruc: string | null;
  industry: string | null;
}

const EmpresaInfoTab = ({ company }: { company: Company }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [formName, setFormName] = useState(company.company_name);
  const [formRuc, setFormRuc] = useState(company.ruc ?? "");
  const [formIndustry, setFormIndustry] = useState(company.industry ?? "");
  const [formPlan, setFormPlan] = useState("");

  // Extra fields from contract_info / energy_supply_info JSON
  const { data: fullCompany } = useQuery({
    queryKey: ["admin-empresa-full", company.id],
    queryFn: async () => {
      const { data } = await supabase.from("clients")
        .select("contract_info, energy_supply_info")
        .eq("id", company.id).single();
      return data;
    },
  });

  const contractInfo = (fullCompany?.contract_info as any) ?? {};
  const energyInfo = (fullCompany?.energy_supply_info as any) ?? {};

  const [distribuidora, setDistribuidora] = useState(energyInfo.distribuidora ?? "");
  const [potenciaContratada, setPotenciaContratada] = useState(energyInfo.potencia_contratada ?? "");

  // Subscription for status display
  const { data: subscription } = useQuery({
    queryKey: ["admin-empresa-sub", company.id],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions")
        .select("status").eq("client_id", company.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const status = subscription?.status ?? "inactive";

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").update({
        company_name: formName.trim(),
        ruc: formRuc.trim() || null,
        industry: formIndustry.trim() || null,
        energy_supply_info: {
          ...energyInfo,
          distribuidora: distribuidora.trim() || null,
          potencia_contratada: potenciaContratada.trim() || null,
        },
      }).eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Información actualizada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa", company.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-full", company.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
    },
    onError: () => toast({ title: "Error al actualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").delete().eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Empresa eliminada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresas"] });
      navigate("/admin-panel/empresas");
    },
    onError: () => toast({ title: "Error al eliminar.", variant: "destructive" }),
  });

  const StatusBadge = () => {
    if (status === "active") return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Activa</Badge>;
    if (status === "suspended") return <Badge className="bg-destructive/15 text-destructive border-destructive/30">Suspendida</Badge>;
    return <Badge variant="secondary">Inactiva</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Información general</CardTitle>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />Eliminar empresa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nombre de la empresa *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>RUC</Label>
              <Input value={formRuc} onChange={(e) => setFormRuc(e.target.value)} placeholder="20123456789" />
            </div>
            <div className="space-y-2">
              <Label>Sector</Label>
              <Input value={formIndustry} onChange={(e) => setFormIndustry(e.target.value)} placeholder="Manufactura, Minería…" />
            </div>
            <div className="space-y-2">
              <Label>Distribuidora eléctrica</Label>
              <Input value={distribuidora} onChange={(e) => setDistribuidora(e.target.value)} placeholder="Ej: Luz del Sur" />
            </div>
            <div className="space-y-2">
              <Label>Potencia contratada (kW)</Label>
              <Input value={potenciaContratada} onChange={(e) => setPotenciaContratada(e.target.value)} placeholder="Ej: 2500" />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <div className="flex items-center h-10">
                <StatusBadge />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !formName.trim()}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará la empresa y todos sus datos. No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate()}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmpresaInfoTab;
