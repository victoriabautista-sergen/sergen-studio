import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageSquare, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminShell from "../../components/AdminShell";

const RISK_OPTIONS = [
  { value: "BAJO", label: "Bajo", color: "bg-green-500" },
  { value: "MEDIO", label: "Medio", color: "bg-amber-500" },
  { value: "ALTO", label: "Alto", color: "bg-red-600" },
];

const getRiskColor = (level: string) => {
  switch (level) {
    case "ALTO": return "#C00000";
    case "MEDIO": return "#D4A017";
    case "BAJO": return "#196B24";
    default: return "#D4A017";
  }
};

const ActualizacionAlertaPage = () => {
  const [timeRange, setTimeRange] = useState("18:00 - 23:00");
  const [riskLevel, setRiskLevel] = useState("MEDIO");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const breadcrumbs = [
    { label: "Configuración de Módulos", href: "/admin-panel/modulos" },
    { label: "Control de Demanda", href: "/admin-panel/modulos/energy-intelligence" },
    { label: "Actualización de Alerta" },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("forecast_settings")
          .select("risk_level, modulation_time")
          .order("last_update", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error("Error fetching settings:", error);
          return;
        }
        if (data) {
          setRiskLevel(data.risk_level || "MEDIO");
          setTimeRange(data.modulation_time || "18:00 - 23:00");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Try to get existing record
      const { data: existing } = await supabase
        .from("forecast_settings")
        .select("id")
        .order("last_update", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("forecast_settings")
          .update({
            risk_level: riskLevel,
            modulation_time: timeRange,
            last_update: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("forecast_settings")
          .insert({
            risk_level: riskLevel,
            modulation_time: timeRange,
          });
        if (error) throw error;
      }

      toast.success("Alerta actualizada correctamente");
    } catch (err: any) {
      console.error(err);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = () => {
    toast.info("Funcionalidad de envío por correo próximamente");
  };

  const handleSendWhatsApp = () => {
    toast.info("Funcionalidad de envío por WhatsApp próximamente");
  };

  const today = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <AdminShell breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Actualización de Alerta</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Actualiza la información de alerta que se mostrará en la Vista General de Control de Demanda.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Panel de edición */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración de Alerta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="timeRange">Rango horario</Label>
                <Input
                  id="timeRange"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  placeholder="18:00 - 23:00"
                />
                <p className="text-xs text-muted-foreground">
                  Ejemplo: 18:30 pm – 20:30 pm
                </p>
              </div>

              <div className="space-y-2">
                <Label>Riesgo de coincidencia</Label>
                <Select value={riskLevel} onValueChange={setRiskLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <span className={`inline-block h-3 w-3 rounded-full ${opt.color}`} />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </CardContent>
          </Card>

          {/* Vista previa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vista previa del mensaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Pronóstico de Demanda</h3>
                  <p className="text-sm text-muted-foreground capitalize">{today}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rango horario</span>
                    <span
                      className="text-sm font-semibold text-white px-3 py-1 rounded"
                      style={{ backgroundColor: "#156082" }}
                    >
                      {timeRange}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Riesgo de coincidencia</span>
                    <span
                      className="text-sm font-semibold text-white px-3 py-1 rounded"
                      style={{ backgroundColor: getRiskColor(riskLevel) }}
                    >
                      {riskLevel}
                    </span>
                  </div>
                </div>

                <Separator />

                <p className="text-xs text-muted-foreground text-center">
                  Esta información se mostrará en la Vista General de Control de Demanda.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSendEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar correo
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSendWhatsApp}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
};

export default ActualizacionAlertaPage;
