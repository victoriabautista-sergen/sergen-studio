import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageSquare, Save, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminShell from "../../components/AdminShell";
import { ForecastChart } from "@/modules/energy_intelligence/components/forecast/ForecastChart";
import { useForecastData } from "@/modules/energy_intelligence/hooks/useForecastData";
import { format, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

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
  const [demandaEstimada, setDemandaEstimada] = useState("");
  const [demandaManuallyEdited, setDemandaManuallyEdited] = useState(false);
  const [mensaje, setMensaje] = useState("Solo usar equipos indispensables.");
  const [estatus, setEstatus] = useState(() => {
    const lastDay = endOfMonth(new Date());
    return `Activo hasta el ${format(lastDay, "d 'de' MMMM", { locale: es })}.`;
  });
  const [recipientEmail, setRecipientEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [loading, setLoading] = useState(true);

  const { data: forecastData } = useForecastData();

  const breadcrumbs = [
    { label: "Configuración de Módulos", href: "/admin-panel/modulos" },
    { label: "Control de Demanda", href: "/admin-panel/modulos/energy-intelligence" },
    { label: "Actualización de Alerta" },
  ];

  // Callback from ForecastChart: use exact same peak value as the chart label
  const handlePeakValueChange = (value: number | null) => {
    if (value != null && !demandaManuallyEdited) {
      setDemandaEstimada(value.toFixed(2));
    }
  };

  // Auto-set mensaje based on risk level
  useEffect(() => {
    if (riskLevel === "BAJO") {
      setMensaje("El día de hoy puede usar sus equipos sin rango horario de restricción.");
    } else {
      setMensaje("Solo usar equipos indispensables.");
    }
  }, [riskLevel]);

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
          .insert({ risk_level: riskLevel, modulation_time: timeRange });
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

  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) {
      toast.error("Ingresa un correo electrónico de destino");
      return;
    }

    setSendingEmail(true);
    try {
      const todayFormatted = format(new Date(), "d 'de' MMMM 'del' yyyy", { locale: es });

      const { data, error } = await supabase.functions.invoke("send-alert-notification", {
        body: {
          to: recipientEmail.trim(),
          riskLevel,
          timeRange,
          demandaEstimada,
          mensaje,
          estatus,
          fecha: todayFormatted,
        },
      });

      if (error) throw error;
      toast.success("Correo enviado correctamente");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al enviar el correo");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsApp = () => {
    toast.info("Funcionalidad de envío por WhatsApp próximamente");
  };

  const todayFormatted = format(new Date(), "d 'de' MMMM 'del' yyyy", { locale: es });
  const isLowRisk = riskLevel === "BAJO";

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
            Actualiza la información de alerta y envía notificaciones a los usuarios.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Panel de edición */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración de Alerta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
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

              <div className="space-y-2">
                <Label htmlFor="timeRange">Rango horario</Label>
                <Input
                  id="timeRange"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  placeholder="06:30 pm - 08:30 pm"
                />
                {isLowRisk && (
                  <p className="text-xs text-muted-foreground">
                    En riesgo bajo se mostrará "Uso libre de equipos" en lugar del rango horario.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="demanda">Demanda estimada (MW)</Label>
                <Input
                  id="demanda"
                  value={demandaEstimada}
                  onChange={(e) => { setDemandaEstimada(e.target.value); setDemandaManuallyEdited(true); }}
                  placeholder="8173.83"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensaje">Mensaje (Recuerde)</Label>
                <Textarea
                  id="mensaje"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estatus">Estatus</Label>
                <Input
                  id="estatus"
                  value={estatus}
                  onChange={(e) => setEstatus(e.target.value)}
                  placeholder="Activo hasta el 31 de marzo."
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="email">Correo de destino</Label>
                <Input
                  id="email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Guardar cambios en Vista General"}
              </Button>
            </CardContent>
          </Card>

          {/* Vista previa del correo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vista previa del mensaje</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Email preview matching reference */}
              <div className="rounded-lg border overflow-hidden bg-white text-foreground">
                {/* Header */}
                <div className="flex flex-col items-center pt-10 pb-6 px-6">
                  <div className="h-16 w-16 rounded-full border-4 border-blue-400 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Pronóstico de potencia máxima</h3>
                  <p className="text-lg font-bold text-gray-900 mt-2 capitalize">{todayFormatted}</p>
                </div>

                {/* Chart */}
                <div className="px-5 pt-2 pb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3 px-1">
                    Pronóstico de Demanda - {format(new Date(), "dd/MM/yyyy")}
                  </p>
                  <div className="h-[450px]">
                    <ForecastChart data={forecastData} onPeakValueChange={handlePeakValueChange} />
                  </div>
                </div>

                {/* Rango horario + Demanda estimada */}
                <div className="px-6 pt-4 pb-4">
                  <div className="grid grid-cols-2 text-sm font-bold text-gray-800 border-b-2 border-gray-300 pb-3">
                    <span>Rango horario</span>
                    <span className="text-right">Demanda estimada</span>
                  </div>
                  <div className="grid grid-cols-2 text-sm py-4 border-b border-gray-200">
                    <span className="text-gray-700">
                      {isLowRisk ? "Uso libre de equipos" : timeRange}
                    </span>
                    <span className="text-gray-700 text-right">{demandaEstimada || "—"}</span>
                  </div>
                </div>

                {/* Recuerde + Estatus */}
                <div className="px-6 py-6">
                  <div className="grid grid-cols-[3fr_2fr] gap-16">
                    <div className="pr-4 border-r border-gray-200">
                      <p className="text-sm font-bold text-gray-800">Recuerde:</p>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{mensaje}</p>
                    </div>
                    <div className="pl-4">
                      <p className="text-sm font-bold text-gray-800">Estatus:</p>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{estatus}</p>
                    </div>
                  </div>
                </div>

                {/* Footer banner */}
                <div
                  className="mt-8 py-6 text-center text-white font-bold text-lg tracking-wider"
                  style={{ backgroundColor: "hsl(35, 91%, 55%)" }}
                >
                  USUARIO ACTIVO
                </div>
              </div>

              {/* Send buttons */}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {sendingEmail ? "Enviando..." : "Enviar correo"}
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
