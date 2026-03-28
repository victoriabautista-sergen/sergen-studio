import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  company_name: string;
  ruc: string | null;
  industry: string | null;
  contract_info: any;
  energy_supply_info: any;
}

const CompanyInfoSection = ({ company, readOnly = false }: { company: Company; readOnly?: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const contractInfo = company.contract_info ?? {};

  const [formName, setFormName] = useState(company.company_name);
  const [formRuc, setFormRuc] = useState(company.ruc ?? "");
  const [formEmail, setFormEmail] = useState(contractInfo.email ?? "");
  const [formPhone, setFormPhone] = useState(contractInfo.phone ?? "");
  const [formEngineer, setFormEngineer] = useState(contractInfo.ingeniero_asignado ?? "");

  const { data: subscription } = useQuery({
    queryKey: ["company-mgmt-sub", company.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("client_id", company.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const status = subscription?.status ?? "inactive";

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clients")
        .update({
          company_name: formName.trim(),
          ruc: formRuc.trim() || null,
          contract_info: {
            ...contractInfo,
            email: formEmail.trim() || null,
            phone: formPhone.trim() || null,
            ingeniero_asignado: formEngineer.trim() || null,
          },
        })
        .eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Información actualizada." });
      queryClient.invalidateQueries({ queryKey: ["company-mgmt-detail", company.id] });
    },
    onError: () => toast({ title: "Error al actualizar.", variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Información de empresa</CardTitle>
        <Badge
          className={
            status === "active"
              ? "bg-green-500/20 text-green-700 border-green-500/30"
              : "bg-muted text-muted-foreground"
          }
        >
          {status === "active" ? "Activa" : status === "suspended" ? "Suspendida" : "Inactiva"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Nombre empresa</Label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>RUC</Label>
            <Input value={formRuc} onChange={(e) => setFormRuc(e.target.value)} placeholder="20123456789" disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="contacto@empresa.com" disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+51 999 999 999" disabled={readOnly} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Ingeniero asignado</Label>
            <Input value={formEngineer} onChange={(e) => setFormEngineer(e.target.value)} placeholder="Nombre del ingeniero" disabled={readOnly} />
          </div>
        </div>
        {!readOnly && (
          <div className="flex justify-end mt-6">
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !formName.trim()}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar cambios
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyInfoSection;
