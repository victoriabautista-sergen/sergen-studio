import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageSquare, Save, Loader2, X, Plus, Bot, RefreshCw, UserPlus } from "lucide-react";
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
  const [alertSentToday, setAlertSentToday] = useState(false);
  const [alertSentAt, setAlertSentAt] = useState<string | null>(null);
  const [lastSentRecipients, setLastSentRecipients] = useState<string[]>([]);
  // Resend mode: null = no resend, "new" = send to new only, "modify" = modify & resend all
  const [resendMode, setResendMode] = useState<"new" | "modify" | null>(null);

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
          .select("risk_level, modulation_time, alert_sent_at")
          .order("last_update", { ascending: false })
          .limit(1)
          .single();

        if (error) { console.error("Error fetching settings:", error); return; }
        if (data) {
          setRiskLevel(data.risk_level || "MEDIO");
          setTimeRange(data.modulation_time || "18:00 - 23:00");

          if (data.alert_sent_at) {
            const sentDate = new Date(data.alert_sent_at);
            const peruNow = toZonedTime(new Date(), "America/Lima");
            if (
              sentDate.getFullYear() === peruNow.getFullYear() &&
              sentDate.getMonth() === peruNow.getMonth() &&
              sentDate.getDate() === peruNow.getDate()
            ) {
              setAlertSentToday(true);
              setAlertSentAt(data.alert_sent_at);
            }
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  // Fetch last sent recipients separately (column may not be in types yet)
  useEffect(() => {
    const fetchLastSent = async () => {
      try {
        const { data } = await supabase
          .from("forecast_settings")
          .select("last_sent_recipients")
          .order("last_update", { ascending: false })
          .limit(1)
          .single();
        if (data && (data as any).last_sent_recipients) {
          setLastSentRecipients((data as any).last_sent_recipients as string[]);
        }
      } catch {}
    };
    fetchLastSent();
  }, [alertSentToday]);

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
    if (alertSentToday && resendMode !== "modify") {
      toast.error("La alerta de hoy ya fue enviada. No se pueden modificar los datos.");
      return;
    }
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

  const chartPreviewBaseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://sergen-studio.lovable.app";
  const chartPreviewUrl = `${chartPreviewBaseUrl}/render/pronostico?t=${refreshKey}`;

  useEffect(() => {
    const html = generarHTMLCorreo({
      fecha: todayFormatted,
      riskColor: getRiskColor(riskLevel),
      riskLabel: RISK_OPTIONS.find(o => o.value === riskLevel)?.label || riskLevel,
      timeRange: isLowRisk ? "Uso libre de equipos" : timeRange,
      demandaEstimada: demandaEstimada || "—",
      mensaje,
      estatus,
      chartPreviewUrl,
    });
    setPreviewHtml(html);
  }, [riskLevel, timeRange, demandaEstimada, mensaje, estatus, todayFormatted, isLowRisk, chartPreviewUrl]);

  // Compute new recipients that haven't received the last send
  const newRecipientEmails = recipients
    .map(r => r.email)
    .filter(e => !lastSentRecipients.includes(e));
  const newBccEmails = bccRecipients
    .map(r => r.email)
    .filter(e => !lastSentRecipients.includes(e));
  const hasNewRecipients = newRecipientEmails.length > 0 || newBccEmails.length > 0;

  const handleSendEmail = async (mode: "initial" | "new" | "resendAll") => {
    if (mode === "initial" && alertSentToday) {
      toast.error("La alerta de hoy ya fue enviada.");
      return;
    }
    if (recipients.length === 0) {
      toast.error("Debe ingresar al menos un correo de destino");
      return;
    }

    setSendingEmail(true);
    try {
      let emails: string[];
      let bccList: string[];

      if (mode === "new") {
        // Only send to recipients not in last send
        emails = newRecipientEmails;
        bccList = newBccEmails;
        if (emails.length === 0 && bccList.length === 0) {
          toast.info("No hay nuevos destinatarios para enviar.");
          setSendingEmail(false);
          return;
        }
      } else {
        // Send to all
        emails = recipients.map(r => r.email);
        bccList = bccRecipients.map(r => r.email);
      }

      toast.info("Generando imagen y enviando correo...");

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
          // Tell backend this is a resend so it skips the "already sent" check
          skipSentCheck: mode === "new" || mode === "resendAll",
          // Send full recipient list so backend can record it
          allRecipients: [...recipients.map(r => r.email), ...bccRecipients.map(r => r.email)],
          // Auditoría: canal y usuario que envía
          channel: "web",
          sentByUserId: (await supabase.auth.getUser()).data.user?.id ?? null,
        },
      });

      if (error) throw error;

      if (data?.alreadySent && mode === "initial") {
        setAlertSentToday(true);
        setAlertSentAt(data.sentAt);
        toast.error(data.error || "La alerta de hoy ya fue enviada.");
        return;
      }

      if (data?.blocked) {
        toast.error(data.error || "No hay datos disponibles para generar el gráfico. El correo no fue enviado.");
        return;
      }

      if (!data?.success) throw new Error("Error al enviar el correo");

      // Registrar en modulation_days: is_modulated = true si hay restricción, false si es libre
      const peruToday = format(toZonedTime(new Date(), "America/Lima"), "yyyy-MM-dd");
      const isModulated = riskLevel !== "BAJO";
      await supabase
        .from("modulation_days")
        .upsert(
          { date: peruToday, is_modulated: isModulated },
          { onConflict: "date" }
        );

      setAlertSentToday(true);
      setAlertSentAt(new Date().toISOString());
      // Update local last sent recipients
      const allSent = [...new Set([...lastSentRecipients, ...emails, ...bccList])];
      setLastSentRecipients(allSent);
      setResendMode(null);

      const countMsg = mode === "new"
        ? `Correo enviado a ${emails.length} nuevo(s) destinatario(s)`
        : `Correo enviado a ${emails.length} destinatario(s)`;
      toast.success(countMsg);
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

  // Whether inputs should be editable
  const inputsLocked = alertSentToday && resendMode !== "modify";

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
    <AdminShell breadcrumbs={breadcrumbs} fullWidth>
      <div className="space-y-6">
        {alertSentToday && !resendMode && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  La alerta de hoy ya fue enviada.
                </p>
                {alertSentAt && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Enviada el {format(new Date(alertSentAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            </div>
            <Separator className="bg-green-200 dark:bg-green-800" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-green-300 text-green-800 hover:bg-green-100 dark:border-green-700 dark:text-green-200 dark:hover:bg-green-900"
                onClick={() => setResendMode("new")}
                disabled={!hasNewRecipients}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Enviar a nuevos destinatarios ({newRecipientEmails.length + newBccEmails.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
                onClick={() => setResendMode("modify")}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Modificar alerta y reenviar a todos
              </Button>
            </div>
            {!hasNewRecipients && (
              <p className="text-xs text-green-600 dark:text-green-400">
                No hay nuevos destinatarios. Agregue correos para habilitar el envío parcial.
              </p>
            )}
          </div>
        )}

        {resendMode === "new" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Modo: Enviar a nuevos destinatarios
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Se enviará el correo solo a los {newRecipientEmails.length + newBccEmails.length} destinatario(s) que no recibieron el envío anterior. Los datos de la alerta no se pueden modificar.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setResendMode(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {resendMode === "modify" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Modo: Modificar alerta y reenviar a todos
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Puede editar riesgo y rango horario. Al enviar, el correo llegará a todos los destinatarios.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setResendMode(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold">Actualización de Alerta</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Actualiza la información de alerta y envía notificaciones a los usuarios.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Panel de edición */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración de Alerta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Riesgo de coincidencia</Label>
                <Select value={riskLevel} onValueChange={setRiskLevel} disabled={inputsLocked}>
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
                  readOnly={isLowRisk || inputsLocked}
                  className={isLowRisk || inputsLocked ? "bg-muted cursor-not-allowed" : ""}
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
                <Input id="demanda" value={demandaEstimada} onChange={(e) => { setDemandaEstimada(e.target.value); setDemandaManuallyEdited(true); }} placeholder="8173.83" readOnly={inputsLocked} className={inputsLocked ? "bg-muted cursor-not-allowed" : ""} />
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
                    {recipients.map((r) => {
                      const isNew = alertSentToday && !lastSentRecipients.includes(r.email);
                      return (
                        <Badge key={r.id} variant="secondary" className={`gap-1 pl-3 pr-1 py-1.5 text-xs ${isNew ? "border-blue-400 bg-blue-50 dark:bg-blue-950" : ""}`}>
                          {r.email}
                          {isNew && <span className="text-blue-600 text-[10px] ml-1">NUEVO</span>}
                          <button type="button" onClick={() => handleRemoveRecipient(r.id)} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
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
                    {bccRecipients.map((r) => {
                      const isNew = alertSentToday && !lastSentRecipients.includes(r.email);
                      return (
                        <Badge key={r.id} variant="secondary" className={`gap-1 pl-3 pr-1 py-1.5 text-xs ${isNew ? "border-blue-400 bg-blue-50 dark:bg-blue-950" : ""}`}>
                          {r.email}
                          {isNew && <span className="text-blue-600 text-[10px] ml-1">NUEVO</span>}
                          <button type="button" onClick={() => handleRemoveBcc(r.id)} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
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

              {resendMode === "modify" && (
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              )}
              {!alertSentToday && (
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar cambios en Vista General"}
                </Button>
              )}
              {alertSentToday && !resendMode && (
                <Button disabled className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Alerta ya enviada hoy
                </Button>
              )}
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
              {forecastData && forecastData.length > 0 && (
                <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
                  <ForecastChart data={forecastData} onPeakValueChange={handlePeakValueChange} showPeakLabel={false} />
                </div>
              )}

              <iframe
                srcDoc={previewHtml}
                title="Vista previa del correo"
                className="w-full border rounded-lg bg-white"
                style={{ height: "1100px" }}
              />

              {/* Send buttons */}
              <div className="flex gap-3 mt-4">
                {!alertSentToday && (
                  <Button variant="outline" className="flex-1" onClick={() => handleSendEmail("initial")} disabled={sendingEmail}>
                    {sendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                    {sendingEmail ? "Generando imagen y enviando..." : "Enviar correo"}
                  </Button>
                )}
                {resendMode === "new" && (
                  <Button variant="outline" className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => handleSendEmail("new")} disabled={sendingEmail}>
                    {sendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    {sendingEmail ? "Enviando..." : `Enviar a ${newRecipientEmails.length + newBccEmails.length} nuevo(s)`}
                  </Button>
                )}
                {resendMode === "modify" && (
                  <Button variant="outline" className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => handleSendEmail("resendAll")} disabled={sendingEmail}>
                    {sendingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    {sendingEmail ? "Enviando..." : "Reenviar a todos"}
                  </Button>
                )}
                {alertSentToday && !resendMode && (
                  <Button variant="outline" className="flex-1" disabled>
                    <Mail className="h-4 w-4 mr-2" />
                    Alerta ya enviada
                  </Button>
                )}
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
