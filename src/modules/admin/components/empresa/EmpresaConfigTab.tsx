import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EmpresaConfigTab = ({ companyId }: { companyId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load company config from contract_info JSON
  const { data: company, isLoading } = useQuery({
    queryKey: ["admin-empresa-config", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients")
        .select("contract_info, energy_supply_info")
        .eq("id", companyId).single();
      if (error) throw error;
      return data;
    },
  });

  const contractInfo = (company?.contract_info as any) ?? {};
  const notificationEmails: string[] = contractInfo.notification_emails ?? [];

  const [emails, setEmails] = useState<string[]>(notificationEmails);
  const [newEmail, setNewEmail] = useState("");

  // Sync when data loads
  const [initialized, setInitialized] = useState(false);
  if (company && !initialized) {
    setEmails(notificationEmails);
    setInitialized(true);
  }

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || emails.includes(email)) return;
    setEmails([...emails, email]);
    setNewEmail("");
  };

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").update({
        contract_info: { ...contractInfo, notification_emails: emails },
      }).eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Configuración guardada." });
      queryClient.invalidateQueries({ queryKey: ["admin-empresa-config", companyId] });
    },
    onError: () => toast({ title: "Error al guardar.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Correos de notificación
          </CardTitle>
          <CardDescription>
            Correos que recibirán alertas y reportes generados por el sistema para esta empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
              className="max-w-sm"
            />
            <Button variant="outline" size="sm" onClick={addEmail} disabled={!newEmail.trim()}>
              <Plus className="h-4 w-4 mr-1" />Agregar
            </Button>
          </div>
          {emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay correos configurados.</p>
          ) : (
            <div className="space-y-2">
              {emails.map((email, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{email}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeEmail(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module parameters placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Parámetros de módulos</CardTitle>
          <CardDescription>
            Configuraciones específicas por módulo para esta empresa. Los parámetros se configuran desde la sección de cada módulo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay parámetros adicionales configurados.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar configuración
        </Button>
      </div>
    </div>
  );
};

export default EmpresaConfigTab;
