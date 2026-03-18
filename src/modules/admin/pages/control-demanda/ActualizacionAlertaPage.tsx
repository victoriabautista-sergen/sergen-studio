import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageSquare, Save, Loader2, X, Plus, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminShell from "../../components/AdminShell";
import { ForecastChart } from "@/modules/energy_intelligence/components/forecast/ForecastChart";
import { useForecastData } from "@/modules/energy_intelligence/hooks/useForecastData";
import { format, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
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

const TIME_12H_RANGE_REGEX = /^\d{1,2}:\d{2}\s?(AM|PM)\s?-\s?\d{1,2}:\d{2}\s?(AM|PM)$/i;

const ActualizacionAlertaPage = () => {
  const [timeRange, setTimeRange] = useState("18:00 - 23:00");
  const [riskLevel, setRiskLevel] = useState("MEDIO");
  const [timeRangeError, setTimeRangeError] = useState("");
  const [demandaEstimada, setDemandaEstimada] = useState("");
  const [demandaManuallyEdited, setDemandaManuallyEdited] = useState(false);
  const [mensaje, setMensaje] = useState("Solo usar equipos indispensables.");
  const computeEstatus = () => {
    const peruNow = toZonedTime(new Date(), "America/Lima");
    const lastDay = endOfMonth(peruNow);
    return `Activo hasta el ${format(lastDay, "d 'de' MMMM", { locale: es })}`;
  };
  const [estatus, setEstatus] = useState(computeEstatus);
  const [recipients, setRecipients] = useState<{ id: string; email: string }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [bccRecipients, setBccRecipients] = useState<{ id: string; email: string }[]>([]);
  const [newBccEmail, setNewBccEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [telegramUsers, setTelegramUsers] = useState<{ user_id: string; full_name: string | null; email: string | null; telegram_chat_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [previewHtml, setPreviewHtml] = useState("");

  const { data: forecastData } = useForecastData();

  const breadcrumbs = [
    { label: "Configuración", href: "/admin-panel/configuracion" },
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
      setTimeRange("Libre");
      setTimeRangeError("");
    } else {
      setMensaje("Solo usar equipos indispensables.");
      setTimeRange(prev => prev === "Libre" ? "" : prev);
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

  const fetchRecipients = useCallback(async () => {
    const { data, error } = await supabase
      .from("alert_recipients")
      .select("id, email, recipient_type")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setRecipients(data.filter((r: any) => r.recipient_type === "to" || !r.recipient_type).map((r: any) => ({ id: r.id, email: r.email })));
      setBccRecipients(data.filter((r: any) => r.recipient_type === "bcc").map((r: any) => ({ id: r.id, email: r.email })));
    }
  }, []);

  useEffect(() => { fetchRecipients(); }, [fetchRecipients]);

  const fetchTelegramUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, telegram_chat_id")
      .not("telegram_chat_id", "is", null)
      .eq("is_active", true);
    if (!error && data) setTelegramUsers(data.filter(p => p.telegram_chat_id) as any);
  }, []);

  useEffect(() => { fetchTelegramUsers(); }, [fetchTelegramUsers]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddBcc = async () => {
    const email = newBccEmail.trim().toLowerCase();
    if (!email) return;
    if (!isValidEmail(email)) { toast.error("Formato de correo BCC inválido"); return; }
    if (bccRecipients.some(r => r.email === email)) { toast.error("Este correo BCC ya está en la lista"); return; }
    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase.from("alert_recipients").insert({ email, added_by: session.session?.user.id, recipient_type: "bcc" });
    if (error) { toast.error("Error al agregar correo BCC"); console.error(error); return; }
    setNewBccEmail("");
    fetchRecipients();
    toast.success("Correo BCC agregado");
  };

  const handleRemoveBcc = async (id: string) => {
    const { error } = await supabase.from("alert_recipients").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar correo BCC"); return; }
    setBccRecipients(prev => prev.filter(r => r.id !== id));
  };

  const handleAddRecipient = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!isValidEmail(email)) { toast.error("Formato de correo inválido"); return; }
    if (recipients.some(r => r.email === email)) { toast.error("Este correo ya está en la lista"); return; }
    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase.from("alert_recipients").insert({ email, added_by: session.session?.user.id, recipient_type: "to" });
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
    if (riskLevel === "ALTO") {
      if (!timeRange.trim()) {
        toast.error("El rango horario es obligatorio cuando el riesgo es ALTO");
        return;
      }
      if (!TIME_12H_RANGE_REGEX.test(timeRange.trim())) {
        toast.error("El rango horario debe estar en formato de 12 horas (AM/PM). Ejemplo: 6:00 PM - 8:30 PM.");
        return;
      }
    }
    setEstatus(computeEstatus());
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
          .update({ risk_level: riskLevel, modulation_time: timeRange, last_update: toZonedTime(new Date(), "America/Lima").toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("forecast_settings")
          .insert({ risk_level: riskLevel, modulation_time: timeRange });
        if (error) throw error;
      }

      setRefreshKey(Date.now());
      toast.success("Configuración guardada correctamente");
    } catch (err: any) {
      console.error(err);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const nowPeru = toZonedTime(new Date(), "America/Lima");
  const todayRaw = format(nowPeru, "d 'de' MMMM 'del' yyyy", { locale: es });
  const todayFormatted = todayRaw.toLowerCase();
  const isLowRisk = riskLevel === "BAJO";

  // Preview HTML (sin imagen - la imagen se genera en el servidor al enviar)
  useEffect(() => {
    const html = generarHTMLCorreo({
      fecha: todayFormatted,
      riskColor: getRiskColor(riskLevel),
      riskLabel: RISK_OPTIONS.find(o => o.value === riskLevel)?.label || riskLevel,
      timeRange: isLowRisk ? "Uso libre de equipos" : timeRange,
      demandaEstimada: demandaEstimada || "—",
      mensaje,
      estatus,
    });
    setPreviewHtml(html);
  }, [riskLevel, timeRange, demandaEstimada, mensaje, estatus, todayFormatted, isLowRisk]);

  const handleSendEmail = async () => {
    if (recipients.length === 0) {
      toast.error("Debe ingresar al menos un correo de destino");
      return;
    }

    setSendingEmail(true);
    try {
      const emails = recipients.map(r => r.email);
      const bccList = bccRecipients.map(r => r.email);

      toast.info("Generando imagen y enviando correo...");

      // El servidor genera la imagen en tiempo real y la embebe en el correo
      const { data, error } = await supabase.functions.invoke("send-email-alert", {
        body: {
          emails,
          bccEmails: bccList,
          fecha: todayFormatted,
          riskLevel,
          riskLabel: RISK_OPTIONS.find(o => o.value === riskLevel)?.label || riskLevel,
          riskColor: getRiskColor(riskLevel),
          timeRange: isLowRisk ? "Uso libre de equipos" : timeRange,
          demandaEstimada: demandaEstimada || "—",
          mensaje,
          estatus,
        },
      });

      if (error) throw error;

      // Backend blocks email if chart capture failed
      if (data?.blocked) {
        toast.error(data.error || "No hay datos disponibles para generar el gráfico. El correo no fue enviado.");
        return;
      }

      if (!data?.success) throw new Error("Error al enviar el correo");

      toast.success(`Correo enviado a ${recipients.length} destinatario(s) con gráfico embebido`);
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
                <Label htmlFor="timeRange">Rango horario {riskLevel === "ALTO" && <span className="text-destructive">*</span>}</Label>
                <Input
                  id="timeRange"
                  value={timeRange}
                  onChange={(e) => {
                    setTimeRange(e.target.value);
                    if (riskLevel === "ALTO" && e.target.value && !TIME_12H_RANGE_REGEX.test(e.target.value.trim())) {
                      setTimeRangeError('El rango horario debe estar en formato de 12 horas (AM/PM). Ejemplo: 6:00 PM - 8:30 PM.');
                    } else {
                      setTimeRangeError("");
                    }
                  }}
                  placeholder="6:00 PM - 8:30 PM"
                  readOnly={isLowRisk}
                  className={isLowRisk ? "bg-muted cursor-not-allowed" : ""}
                />
                {timeRangeError && (
                  <p className="text-xs text-destructive">{timeRangeError}</p>
                )}
                {isLowRisk && (
                  <p className="text-xs text-muted-foreground">
                    En riesgo bajo el rango horario se establece como "Libre" automáticamente.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="demanda">Demanda estimada (MW)</Label>
                <Input id="demanda" value={demandaEstimada} onChange={(e) => { setDemandaEstimada(e.target.value); setDemandaManuallyEdited(true); }} placeholder="8173.83" />
              </div>

              {/* Mensaje y Estatus se generan automáticamente y no se muestran en el panel */}

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
                <div className="flex gap-2">
                  <Input type="email" value={newBccEmail} onChange={(e) => setNewBccEmail(e.target.value)} placeholder="operaciones@empresa.com" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddBcc(); } }} />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddBcc}><Plus className="h-4 w-4" /></Button>
                </div>
                {bccRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {bccRecipients.map((r) => (
                      <Badge key={r.id} variant="secondary" className="gap-1 pl-3 pr-1 py-1.5 text-xs">
                        {r.email}
                        <button type="button" onClick={() => handleRemoveBcc(r.id)} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {bccRecipients.length === 0 && <p className="text-xs text-muted-foreground">No hay correos BCC guardados.</p>}
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Telegram – Usuarios autorizados
                </Label>
                {telegramUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {telegramUsers.map((u) => (
                      <Badge key={u.user_id} variant="secondary" className="pl-3 pr-3 py-1.5 text-xs">
                        {u.full_name || u.email || u.telegram_chat_id}
                        <span className="ml-1 text-muted-foreground">({u.telegram_chat_id})</span>
                      </Badge>
                    ))}
                  </div>
                )}
                {telegramUsers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No hay usuarios con Telegram configurado. Configure el Chat ID desde el módulo Usuarios.
                  </p>
                )}
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
              <p className="text-xs text-muted-foreground">
                Esta vista previa muestra los datos actuales que se enviarán en el correo.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hidden: only used to compute peak value */}
              {forecastData && forecastData.length > 0 && (
                <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
                  <ForecastChart data={forecastData} onPeakValueChange={handlePeakValueChange} showPeakLabel={false} />
                </div>
              )}

              {/* Gráfico en vivo desde /render/pronostico */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Pronóstico de Demanda (vista actual)</p>
                <iframe
                  key={refreshKey}
                  src={`/render/pronostico?t=${refreshKey}`}
                  title="Gráfico de pronóstico en vivo"
                  style={{
                    width: "100%",
                    height: "420px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#fff",
                    marginBottom: "16px",
                  }}
                />
              </div>

              {/* iframe que muestra el HTML del correo */}
              <iframe
                srcDoc={previewHtml}
                title="Vista previa del correo"
                className="w-full border rounded-lg bg-white"
                style={{ height: "700px" }}
                sandbox=""
              />

              {/* Send buttons */}
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={handleSendEmail} disabled={sendingEmail}>
                  {sendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  {sendingEmail ? "Generando imagen y enviando..." : "Enviar correo"}
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
