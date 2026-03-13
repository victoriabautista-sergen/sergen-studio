import { Link } from "react-router-dom";
import { Building2, Inbox, Package, Settings, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminShell from "../components/AdminShell";

const NAV_CARDS = [
  {
    href: "/admin-panel/empresas",
    title: "Empresas",
    description: "Centro de administración de empresas, módulos y usuarios",
    icon: Building2,
  },
  {
    href: "/admin-panel/usuarios-sergen",
    title: "Usuarios Sergen",
    description: "Usuarios internos del equipo Sergen",
    icon: Users,
  },
  {
    href: "/admin-panel/configuracion",
    title: "Configuración",
    description: "Módulos globales y ajustes de la plataforma",
    icon: Settings,
  },
  {
    href: "/admin-panel/solicitudes",
    title: "Solicitudes de Planes",
    description: "Solicitudes comerciales de nuevos clientes",
    icon: Inbox,
  },
  {
    href: "/admin-panel/modulos",
    title: "Configuración de Módulos",
    description: "Configura cada módulo de la plataforma individualmente",
    icon: Package,
  },
] as const;

const AdminPanelHomePage = () => (
  <AdminShell>
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Panel de Administración</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión completa de la plataforma SERGEN.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {NAV_CARDS.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} to={href} className="group">
            <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </AdminShell>
);

export default AdminPanelHomePage;
