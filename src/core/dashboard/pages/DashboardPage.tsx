import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import PrivateRoute from "@/core/auth/components/PrivateRoute";
import { moduleRegistry } from "@/modules/registry";

// Import illustrations
import controlDemandaImg from "@/assets/module-control-demanda.png";
import billingImg from "@/assets/module-billing.png";
import induvexImg from "@/assets/module-induvex.png";
import companyImg from "@/assets/module-company.png";
import adminImg from "@/assets/module-admin.png";

const illustrationMap: Record<string, string> = {
  "energy-intelligence": controlDemandaImg,
  "billing-optimization": billingImg,
  induvex: induvexImg,
  "company-management": companyImg,
  "admin-panel": adminImg,
};

const DashboardContent = () => {
  const navigate = useNavigate();
  const { session, logout, role, enabledModuleSlugs } = useAuthContext();

  const visibleModules = useMemo(() => {
    if (role === "super_admin" || role === "technical_user") {
      return moduleRegistry;
    }
    const appModules = moduleRegistry.filter((m) => m.id !== "admin-panel");
    if (role === "admin") {
      return appModules;
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

      <main className="px-8 py-10">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Bienvenido, {session?.user?.user_metadata?.full_name || "Usuario"}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
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
              <div className="max-w-7xl mx-auto space-y-10">
                {Object.entries(grouped).map(([category, modules]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold tracking-widest text-muted-foreground mb-4 uppercase">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {modules.map((module, index) => {
                        const Icon = module.icon;
                        const illustration = illustrationMap[module.id];
                        return (
                          <Card
                            key={module.id}
                            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in overflow-hidden border-0 shadow-sm"
                            style={{ animationDelay: `${index * 80}ms` }}
                            onClick={() => navigate(module.basePath)}
                          >
                            {/* Gradient banner */}
                            <div className={`relative bg-gradient-to-r ${module.gradient} px-6 py-4`}>
                              <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />
                              <div className="relative flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                  <Icon className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-heading font-bold text-lg text-white">{module.name}</span>
                              </div>
                            </div>
                            {/* Content with illustration */}
                            <div className="bg-card px-6 py-5 flex flex-col items-center text-center space-y-3">
                              {illustration && (
                                <img
                                  src={illustration}
                                  alt={module.name}
                                  className="w-28 h-28 object-contain group-hover:scale-105 transition-transform duration-300"
                                />
                              )}
                              <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="group-hover:border-primary group-hover:text-primary transition-colors"
                              >
                                Abrir módulo →
                              </Button>
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
