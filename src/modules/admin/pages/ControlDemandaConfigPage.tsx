import { Link } from "react-router-dom";
import { CalendarDays, Settings, Bell, Cpu, AlertTriangle, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminShell from "../components/AdminShell";

const SUB_MODULES = [
  {
    key: "modulacion",
    label: "Modulación",
    description: "Configurar qué días están modulados en el calendario.",
    icon: CalendarDays,
    href: "/admin-panel/modulos/energy-intelligence/modulacion",
    available: true,
  },
  {
    key: "alerta",
    label: "Actualización de Alerta",
    description: "Actualizar rango horario y riesgo de coincidencia. Enviar notificaciones.",
    icon: AlertTriangle,
    href: "/admin-panel/modulos/energy-intelligence/alerta",
    available: true,
  },
  {
    key: "parametros",
    label: "Parámetros de control",
    description: "Definir umbrales y parámetros de demanda.",
    icon: Settings,
    href: "#",
    available: false,
  },
  {
    key: "alertas",
    label: "Configuración de alertas",
    description: "Gestionar reglas de alertas automáticas.",
    icon: Bell,
    href: "#",
    available: false,
  },
  {
    key: "reglas",
    label: "Reglas automáticas",
    description: "Crear reglas de modulación automática.",
    icon: Cpu,
    href: "#",
    available: false,
  },
];

const ControlDemandaConfigPage = () => {
  const breadcrumbs = [
    { label: "Configuración", href: "/admin-panel/configuracion" },
    { label: "Control de Demanda" },
  ];

  return (
    <AdminShell breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Control de Demanda</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona un submódulo para configurar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUB_MODULES.map(({ key, label, description, icon: Icon, href, available }) => {
            const content = (
              <Card
                key={key}
                className={
                  available
                    ? "transition-shadow hover:shadow-md cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                  {!available && (
                    <span className="text-xs text-muted-foreground mt-2 block">Próximamente</span>
                  )}
                </CardContent>
              </Card>
            );

            if (available) {
              return (
                <Link key={key} to={href} className="block">
                  {content}
                </Link>
              );
            }

            return <div key={key}>{content}</div>;
          })}
        </div>
      </div>
    </AdminShell>
  );
};

export default ControlDemandaConfigPage;
