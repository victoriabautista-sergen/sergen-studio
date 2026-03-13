import { Link } from "react-router-dom";
import { Building2, Inbox, Loader2, Package, Settings, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminShell from "../components/AdminShell";

type Module = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};

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

const AdminPanelHomePage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["admin-modules-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, name, slug, description, is_active")
        .neq("slug", "admin-panel")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Module[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("modules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules-all"] });
      queryClient.invalidateQueries({ queryKey: ["admin-modules-active"] });
    },
    onError: () =>
      toast({ title: "Error al actualizar módulo.", variant: "destructive" }),
  });

  return (
    <AdminShell>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold">Panel de Administración</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión completa de la plataforma SERGEN.
          </p>
        </div>

        {/* Navigation cards */}
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

        {/* Modules configuration card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Configuración de Módulos</CardTitle>
                <CardDescription className="mt-0.5">
                  Activa o desactiva módulos globalmente en la plataforma.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : modules.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Package className="h-8 w-8" />
                <p className="text-sm">No hay módulos registrados</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {modules.map((m) => (
                  <Card
                    key={m.id}
                    className={`transition-all ${m.is_active ? "border-primary/30" : "opacity-60"}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {m.name}
                        </CardTitle>
                        <Switch
                          checked={m.is_active}
                          onCheckedChange={(is_active) =>
                            toggleMutation.mutate({ id: m.id, is_active })
                          }
                          disabled={toggleMutation.isPending}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {m.description && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {m.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <code className="text-[10px] text-muted-foreground font-mono">
                          {m.slug}
                        </code>
                        <Badge
                          variant={m.is_active ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {m.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
};

export default AdminPanelHomePage;
