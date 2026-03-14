import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageSquare, Save, Loader2, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminShell from "../../components/AdminShell";
import { ForecastChart } from "@/modules/energy_intelligence/components/forecast/ForecastChart";
import { useForecastData } from "@/modules/energy_intelligence/hooks/useForecastData";
import { format, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import html2canvas from "html2canvas";
import { generarHTMLCorreo } from "../../utils/generarHTMLCorreo";

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
  const [recipients, setRecipients] = useState<{ id: string; email: string }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [bccEmails, setBccEmails] = useState<string>(() => {
    return localStorage.getItem("alert_bcc_emails") || "";
  });
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartBase64, setChartBase64] = useState<string>("");

  const { data: forecastData } = useForecastData();

  const breadcrumbs = [
    { label: "Configuración de Módulos", href: "/admin-panel/modulos" },
    { label: "Control de Demanda", href: "/admin-panel/modulos/energy-intelligence" },
    { label: "Actualización de Alerta" },
  ];

  const handlePeakValueChange = (value: number | null) => {
    if (value != null && !demandaManuallyEdited) {
      setDemandaEstimada(value.toFixed(2));
    }
  };

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

        if (error) { console.error("Error fetching settings:", error); return; }
        if (data) {
          setRiskLevel(data.risk_level || "MEDIO");
          setTimeRange(data.modulation_time || "18:00 - 23:00");
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  // Capture chart as base64 whenever forecast data changes
  useEffect(() => {
    const captureChart = async () => {
      // Wait for chart to render
      await new Promise(r => setTimeout(r, 1500));
      const grafico = document.getElementById("grafico-pronostico");
      if (grafico) {
        try {
          const canvas = await html2canvas(grafico, { useCORS: true, scale: 2 });
          setChartBase64(canvas.toDataURL("image/png"));
        } catch (err) {
          console.warn("No se pudo capturar el gráfico:", err);
        }
      }
    };
    if (forecastData.length > 0) captureChart();
  }, [forecastData]);

  const fetchRecipients = useCallback(async () => {
    const { data, error } = await supabase
      .from("alert_recipients")
      .select("id, email")
      .order("created_at", { ascending: true });
    if (!error && data) setRecipients(data);
  }, []);

  useEffect(() => { fetchRecipients(); }, [fetchRecipients]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddRecipient = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!isValidEmail(email)) { toast.error("Formato de correo inválido"); return; }
    if (recipients.some(r => r.email === email)) { toast.error("Este correo ya está en la lista"); return; }

    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase.from("alert_recipients").insert({ email, added_by: session.session?.user.id });
    if (error) { toast.error("Error al agregar correo"); console.error(error); return; }
    setNewEmail("");
    fetchRecipients();
    toast.success("Correo agregado");
  };

  const handleRemoveRecipient = async (id: string) => {
    const { error } = await supabase.from("alert_recipients").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar correo"); return; }
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

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
          .update({ risk_level: riskLevel, modulation_time: timeRange, last_update: new Date().toISOString() })
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

  const todayFormatted = format(new Date(), "d 'de' MMMM 'del' yyyy", { locale: es });
  const isLowRisk = riskLevel === "BAJO";

  // Build template data for shared HTML generator
  const templateData = useMemo(() => ({
    fecha: todayFormatted,
    riskColor: getRiskColor(riskLevel),
    riskLabel: RISK_OPTIONS.find(o => o.value === riskLevel)?.label || riskLevel,
    timeRange: isLowRisk ? "Uso libre de equipos" : timeRange,
    demandaEstimada: demandaEstimada || "—",
    mensaje,
    estatus,
    graficoBase64: chartBase64,
  }), [todayFormatted, riskLevel, isLowRisk, timeRange, demandaEstimada, mensaje, estatus, chartBase64]);

  // previewHtml no longer needed — preview uses React components directly

  const handleSendEmail = async () => {
    if (recipients.length === 0) {
      toast.error("Debe ingresar al menos un correo de destino");
      return;
    }

    setSendingEmail(true);
    try {
      const emails = recipients.map(r => r.email);
      const bccList = bccEmails.split(",").map(e => e.trim().toLowerCase()).filter(e => isValidEmail(e));
      localStorage.setItem("alert_bcc_emails", bccEmails);

      // Re-capture chart right before sending for freshest image
      let freshBase64 = chartBase64;
      const grafico = document.getElementById("grafico-pronostico");
      if (grafico) {
        try {
          const canvas = await html2canvas(grafico, { useCORS: true, scale: 2 });
          freshBase64 = canvas.toDataURL("image/png");
        } catch (err) {
          console.warn("No se pudo re-capturar el gráfico:", err);
        }
      }

      // Generate the EXACT same HTML that is previewed
      const htmlContent = generarHTMLCorreo({ ...templateData, graficoBase64: freshBase64 });

      const { data, error } = await supabase.functions.invoke("send-email-alert", {
        body: { emails, bccEmails: bccList, htmlContent },
      });

      if (error) throw error;
      if (!data?.success) throw new Error("Algunos correos no se enviaron");
      toast.success(`Correo enviado a ${recipients.length} destinatario(s)`);
    } catch (err: any) {
      console.error("Error enviando correo:", err);
      toast.error("Error al enviar el correo");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsApp = () => {
    toast.info("Funcionalidad de envío por WhatsApp próximamente");
  };

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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input id="timeRange" value={timeRange} onChange={(e) => setTimeRange(e.target.value)} placeholder="06:30 pm - 08:30 pm" />
                {isLowRisk && (
                  <p className="text-xs text-muted-foreground">
                    En riesgo bajo se mostrará "Uso libre de equipos" en lugar del rango horario.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="demanda">Demanda estimada (MW)</Label>
                <Input id="demanda" value={demandaEstimada} onChange={(e) => { setDemandaEstimada(e.target.value); setDemandaManuallyEdited(true); }} placeholder="8173.83" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensaje">Mensaje (Recuerde)</Label>
                <Textarea id="mensaje" value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estatus">Estatus</Label>
                <Input id="estatus" value={estatus} onChange={(e) => setEstatus(e.target.value)} placeholder="Activo hasta el 31 de marzo." />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-semibold">Correos de destino</Label>
                <div className="flex gap-2">
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="usuario@empresa.com" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRecipient())} />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddRecipient}><Plus className="h-4 w-4" /></Button>
                </div>
                {recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recipients.map((r) => (
                      <Badge key={r.id} variant="secondary" className="gap-1 pl-3 pr-1 py-1.5 text-xs">
                        {r.email}
                        <button type="button" onClick={() => handleRemoveRecipient(r.id)} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {recipients.length === 0 && <p className="text-xs text-muted-foreground">No hay correos guardados.</p>}
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-semibold">Destinatarios ocultos (BCC)</Label>
                <Textarea value={bccEmails} onChange={(e) => setBccEmails(e.target.value)} placeholder="operaciones@empresa.com, mantenimiento@empresa.com" rows={2} />
                <p className="text-xs text-muted-foreground">Ingrese múltiples correos separados por coma. Se guardan automáticamente.</p>
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
              {/* Gráfico interactivo visible en el dashboard */}
              <div className="rounded-lg border overflow-hidden bg-white text-foreground">
                {/* Header del correo */}
                <div className="flex flex-col items-center pt-10 pb-6 px-6">
                  <div className="h-16 w-16 rounded-full border-4 border-blue-400 flex items-center justify-center mb-4">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Pronóstico de potencia máxima</h3>
                  <p className="text-lg font-bold text-gray-900 mt-2 capitalize">{todayFormatted}</p>
                </div>

                {/* Badge de riesgo */}
                <div className="flex justify-center pb-6">
                  <span
                    className="text-white text-sm font-bold px-7 py-2 rounded-full tracking-wide"
                    style={{ backgroundColor: getRiskColor(riskLevel) }}
                  >
                    RIESGO {(RISK_OPTIONS.find(o => o.value === riskLevel)?.label || riskLevel).toUpperCase()}
                  </span>
                </div>

                <div className="mx-6 border-t border-gray-200" />

                {/* Gráfico interactivo (se captura con html2canvas al enviar) */}
                <div className="px-5 pt-4 pb-2">
                  <p className="text-sm font-semibold text-gray-700 mb-3 px-1">Pronóstico de Demanda</p>
                  <div id="grafico-pronostico" className="h-[450px]">
                    <ForecastChart data={forecastData} onPeakValueChange={handlePeakValueChange} />
                  </div>
                </div>

                {/* Tabla: Rango horario + Demanda estimada */}
                <div className="px-6 pt-4 pb-4">
                  <div className="grid grid-cols-2 text-sm font-bold text-gray-800 border-b-2 border-gray-300 pb-3">
                    <span>Rango horario</span>
                    <span className="text-right">Demanda estimada</span>
                  </div>
                  <div className="grid grid-cols-2 text-sm py-4 border-b border-gray-200">
                    <span className="text-gray-700">{isLowRisk ? "Uso libre de equipos" : timeRange}</span>
                    <span className="text-gray-700 text-right">{demandaEstimada || "—"} MW</span>
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

                {/* Banner */}
                <div className="py-5 text-center text-white font-bold text-lg tracking-wider" style={{ backgroundColor: "#e8920d" }}>
                  USUARIO ACTIVO
                </div>

                {/* Footer */}
                <div className="text-center py-5">
                  <p className="text-xs text-gray-400">Este correo fue enviado por <strong className="text-gray-700">SERGEN</strong></p>
                  <p className="text-xs text-gray-400 mt-1">info@sergen.pe</p>
                </div>
              </div>

              {/* Send buttons */}
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={handleSendEmail} disabled={sendingEmail}>
                  {sendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  {sendingEmail ? "Enviando..." : "Enviar correo"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleSendWhatsApp}>
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
