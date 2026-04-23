import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, MessageCircle, Globe, Loader2 } from "lucide-react";
import AdminShell from "@/modules/admin/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";

interface AlertHistoryRow {
  id: string;
  sent_date: string;
  sent_at: string;
  risk_level: string;
  modulation_time: string | null;
  channel: "telegram" | "web" | "system";
  sent_by_chat_id: number | null;
  sent_by_user_id: string | null;
  recipients_count: number;
  recipients: string[];
  metadata: Record<string, unknown>;
}

const riskColor = (r: string) => {
  const u = r.toUpperCase();
  if (u === "BAJO") return "bg-green-100 text-green-800 hover:bg-green-100";
  if (u === "MEDIO") return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
  if (u === "ALTO") return "bg-red-100 text-red-800 hover:bg-red-100";
  return "bg-gray-100 text-gray-800 hover:bg-gray-100";
};

const channelIcon = (c: string) => {
  if (c === "telegram") return <MessageCircle className="h-3.5 w-3.5" />;
  if (c === "web") return <Globe className="h-3.5 w-3.5" />;
  return <Send className="h-3.5 w-3.5" />;
};

const HistorialAlertasPage = () => {
  const [rows, setRows] = useState<AlertHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("alert_send_history")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(200);
      if (!error && data) setRows(data as unknown as AlertHistoryRow[]);
      setLoading(false);
    };
    load();
  }, []);

  const breadcrumbs = [
    { label: "Configuración", href: "/admin-panel/configuracion" },
    { label: "Control de Demanda", href: "/admin-panel/modulos/energy-intelligence" },
    { label: "Historial de Alertas" },
  ];

  return (
    <AdminShell breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de alertas enviadas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Auditoría de cada alerta diaria enviada por correo, indicando canal (Telegram o Web), riesgo y rango horario.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Cargando historial...
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Aún no hay envíos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora envío</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Riesgo</TableHead>
                    <TableHead>Rango horario</TableHead>
                    <TableHead className="text-center">Destinatarios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const peruSent = toZonedTime(new Date(r.sent_at), "America/Lima");
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {format(new Date(r.sent_date + "T12:00:00"), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(peruSent, "HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1.5 capitalize">
                            {channelIcon(r.channel)}
                            {r.channel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={riskColor(r.risk_level)}>
                            {r.risk_level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{r.modulation_time ?? "—"}</TableCell>
                        <TableCell className="text-center">{r.recipients_count}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
};

export default HistorialAlertasPage;