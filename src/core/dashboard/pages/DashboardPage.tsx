import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, ChevronRight } from "lucide-react";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import PrivateRoute from "@/core/auth/components/PrivateRoute";
import { moduleRegistry } from "@/modules/registry";

import iconControlDemanda from "@/assets/icon-control-demanda.png";
import iconBilling from "@/assets/icon-billing.png";
import iconInduvex from "@/assets/icon-induvex.png";
import iconCompany from "@/assets/icon-company.png";
import iconAdmin from "@/assets/icon-admin.png";
import iconLadder from "@/assets/icon-ladder.png";

const illustrationMap: Record<string, string> = {
  "energy-intelligence": iconControlDemanda,
  "billing-optimization": iconBilling,
  induvex: iconInduvex,
  "company-management": iconCompany,
  "admin-panel": iconAdmin,
  "ladder_generator": iconLadder,
};

const DashboardContent = () => {
  const navigate = useNavigate();
  const { session, logout, role, enabledModuleSlugs } = useAuthContext();

  const visibleModules = useMemo(() => {
    if (role === "super_admin") {
      return moduleRegistry;
    }
    const appModules = moduleRegistry.filter((m) => m.id !== "admin-panel");
    if (role === "technical_user") {
      return appModules;
    }
    if (role === "admin") {
      return appModules.filter((m) => m.id === "company-management" || enabledModuleSlugs.includes(m.id));
    }
    return appModules.filter((m) => enabledModuleSlugs.includes(m.id));
  }, [role, enabledModuleSlugs]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="w-full flex items-center justify-between h-16 px-8">
          <div className="flex items-center gap-3">
            <span className="font-heading font-bold text-xl text-foreground">SERGEN</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base text-muted-foreground hidden sm:inline">
              {session?.user?.email}
            </span>
            <Button variant="ghost" size="default" onClick={logout} className="text-base">
              <LogOut className="h-5 w-5 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="px-8 py-10 max-w-[1600px]">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Bienvenido, {session?.user?.user_metadata?.full_name || "Usuario"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Plataforma de gestión energética industrial. Selecciona un módulo para comenzar.
          </p>
        </div>

        {visibleModules.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            <p className="text-lg">No tienes módulos habilitados.</p>
            <p className="text-sm mt-2">Contacta a tu administrador para obtener acceso.</p>
          </div>
        ) : (
          (() => {
            const grouped = visibleModules.reduce<Record<string, typeof visibleModules>>((acc, m) => {
              const cat = m.category;
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(m);
              return acc;
            }, {});

            return (
              <div className="space-y-10">
                {Object.entries(grouped).map(([category, modules]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold tracking-widest text-muted-foreground mb-4 uppercase">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {modules.map((module, index) => {
                        const Icon = module.icon;
                        const illustration = illustrationMap[module.id];
                        return (
                          <Card
                            key={module.id}
                            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in overflow-hidden border-0 shadow-sm rounded-xl"
                            style={{ animationDelay: `${index * 80}ms` }}
                            onClick={() => navigate(module.basePath)}
                          >
                            {/* Teal header bar */}
                            <div className="bg-[hsl(195,70%,30%)] px-4 py-2.5 flex items-center gap-2.5 rounded-t-xl">
                              <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <span className="font-heading font-bold text-white text-sm">{module.name}</span>
                            </div>

                            {/* Icon area */}
                            <div className="bg-card px-5 py-8 flex flex-col items-center text-center space-y-4">
                              <img
                                src={illustration}
                                alt={module.name}
                                loading="lazy"
                                width={1024}
                                height={1024}
                                className="w-48 h-48 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                              />
                              <button className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Ver Detalles <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </main>
    </div>
  );
};

const DashboardPage = () => (
  <PrivateRoute>
    <DashboardContent />
  </PrivateRoute>
);

export default DashboardPage;
