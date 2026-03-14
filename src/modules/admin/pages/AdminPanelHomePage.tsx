import { Link } from "react-router-dom";
import { Building2, Inbox, Settings, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminShell from "../components/AdminShell";

const PARENT_GRADIENT = "from-slate-600 via-gray-700 to-slate-800";

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
      <div className="grid gap-6 sm:grid-cols-2">
        {NAV_CARDS.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} to={href} className="group">
            <Card className="h-full transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 overflow-hidden border-0 shadow-sm">
              <div className={`relative bg-gradient-to-r ${PARENT_GRADIENT} px-6 py-5`}>
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-heading font-bold text-lg text-white">{title}</span>
                </div>
              </div>
              <div className="bg-card px-6 py-4 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="group-hover:border-primary group-hover:text-primary transition-colors"
                >
                  Abrir módulo →
                </Button>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </AdminShell>
);

export default AdminPanelHomePage;
