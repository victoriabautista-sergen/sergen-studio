import { BarChart2, History, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminShell from "../components/AdminShell";

const MODULE_CONFIG_CARDS = [
  {
    key: "control-demanda",
    label: "Control de Demanda",
    description: "Modulación y actualización de alertas.",
    icon: Zap,
    href: "/admin-panel/modulos/energy-intelligence",
    available: true,
  },
  {
    key: "pronostico",
    label: "Pronóstico",
    description: "Configuración del módulo de pronóstico.",
    icon: BarChart2,
    href: "#",
    available: false,
  },
  {
    key: "historico",
    label: "Histórico",
    description: "Configuración del módulo de histórico.",
    icon: History,
    href: "#",
    available: false,
  },
] as const;

const BREADCRUMBS = [{ label: "Configuración" }];

const ConfiguracionPage = () => {
  return (
    <AdminShell breadcrumbs={BREADCRUMBS}>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold">Configuración</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ajustes globales de la plataforma SERGEN.
          </p>
        </div>

        {/* ── Configuración de módulos ── */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de módulos</CardTitle>
            <CardDescription>
              Ajustes específicos por módulo de la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULE_CONFIG_CARDS.map(({ key, label, description, icon: Icon, href, available }) => {
                const card = (
                  <Card
                    key={key}
                    className={
                      available
                        ? "h-full transition-all hover:border-primary/50 hover:shadow-sm cursor-pointer"
                        : "h-full opacity-50 cursor-not-allowed"
                    }
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{label}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{description}</CardDescription>
                      {!available && (
                        <span className="text-xs text-muted-foreground mt-2 block">Próximamente</span>
                      )}
                    </CardContent>
                  </Card>
                );

                return available ? (
                  <Link key={key} to={href} className="block">
                    {card}
                  </Link>
                ) : (
                  <div key={key}>{card}</div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Ajustes generales (placeholder) ── */}
        <Card>
          <CardHeader>
            <CardTitle>Ajustes generales</CardTitle>
            <CardDescription>
              Configuración adicional de la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Próximamente: ajustes de notificaciones, branding y más.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
};

export default ConfiguracionPage;
