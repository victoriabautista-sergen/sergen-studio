import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import sergenLogo from "@/assets/sergen-logo.png";
import { LogOut } from "lucide-react";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { moduleRegistry } from "@/modules/registry";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { session, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={sergenLogo} alt="SERGEN" className="h-8" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {session?.user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-10">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Bienvenido, {session?.user?.user_metadata?.full_name || "Usuario"}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Plataforma de gestión energética industrial. Selecciona un módulo para comenzar.
          </p>
        </div>

        {/* 4 Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {moduleRegistry.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(module.basePath)}
              >
                <CardHeader>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${module.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="font-heading text-xl">{module.name}</CardTitle>
                  <CardDescription className="text-sm">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="group-hover:border-primary group-hover:text-primary transition-colors"
                  >
                    Abrir módulo →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
