import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type PlanType = "basic" | "advanced";

type Plan = {
  id: PlanType;
  name: string;
  price: string;
  features: string[];
  recommendedFor: string;
};

interface SubscriptionPlansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans: Plan[] = [
  {
    id: "basic",
    name: "Plan Básico",
    price: "$1,000/mes",
    features: [
      "Control del perfil de carga eléctrico",
      "Seguimiento del consumo y proyección de energía",
      "Reportes de evolución de energía",
      "Consultoría en Eficiencia Energética",
    ],
    recommendedFor: "Pequeñas y medianas empresas con consumos mensuales de 0-250 MWh.",
  },
  {
    id: "advanced",
    name: "Plan Avanzado",
    price: "$1,500/mes",
    features: [
      "Consultoría en Eficiencia Energética",
      "Análisis de requerimientos energéticos",
      "Consultoría en Generación Distribuida",
      "Control del perfil de carga eléctrico",
      "Seguimiento del consumo y proyección de energía",
      "Reportes de evolución de energía",
      "Control de la facturación de energía",
      "Análisis del contrato de suministro eléctrico",
      "Gestión del costo de la potencia en horas punta",
    ],
    recommendedFor: "Empresas con consumos mensuales superiores a 250 MWh.",
  },
];

const initialForm = {
  full_name: "",
  company_name: "",
  position: "",
  email: "",
  phone: "",
};

export const SubscriptionPlansModal = ({ open, onOpenChange }: SubscriptionPlansModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedPlan(null);
      setSubmitting(false);
      setForm(initialForm);
    }
  }, [open]);

  const selectedPlanName = useMemo(
    () => (selectedPlan === "advanced" ? "Plan Avanzado" : "Plan Básico"),
    [selectedPlan],
  );

  const selectPlan = (planId: PlanType) => {
    setSelectedPlan(planId);
    setStep(2);
  };

  const closeModal = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setSubmitting(true);

    const { error } = await supabase.from("plan_inquiries").insert({
      full_name: form.full_name.trim(),
      company_name: form.company_name.trim(),
      position: form.position.trim() || null,
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      plan_selected: selectedPlan,
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: "Error al enviar. Intenta nuevamente.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "¡Solicitud enviada! Te contactaremos pronto.",
    });

    closeModal();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Selecciona tu plan</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <Card key={plan.id} className="border-border/80">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <p className="text-3xl font-bold text-sergen-orange">{plan.price}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p className="font-semibold">Recomendado para:</p>
                      <p className="text-muted-foreground">{plan.recommendedFor}</p>
                    </div>

                    <Button
                      type="button"
                      className="w-full bg-sergen-orange text-primary-foreground hover:bg-sergen-orange/90"
                      onClick={() => selectPlan(plan.id)}
                    >
                      Adquirir
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Completa tus datos</DialogTitle>
            </DialogHeader>

            <Button
              type="button"
              variant="ghost"
              className="w-fit px-0 text-muted-foreground hover:text-foreground"
              onClick={() => setStep(1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Volver a planes
            </Button>

            <p className="text-sm text-muted-foreground">Plan seleccionado: {selectedPlanName}</p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombres completos*</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Empresa*</Label>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={form.position}
                  onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico*</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-sergen-orange text-primary-foreground hover:bg-sergen-orange/90"
              >
                {submitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
