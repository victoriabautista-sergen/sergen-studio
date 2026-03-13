import { Link, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays } from "lucide-react";
import AdminShell from "../components/AdminShell";
import ModulacionTab from "../components/control-demanda/ModulacionTab";

const SUB_MODULES = [
  { key: "modulacion", label: "Modulación", icon: CalendarDays },
] as const;

const ControlDemandaConfigPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "modulacion";

  const breadcrumbs = [
    { label: "Configuración de Módulos", href: "/admin-panel/modulos" },
    { label: "Control de Demanda" },
  ];

  return (
    <AdminShell breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Control de Demanda</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configuración del módulo de Control de Demanda.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setSearchParams({ tab: v })}
        >
          <TabsList>
            {SUB_MODULES.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="modulacion" className="mt-6">
            <ModulacionTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
};

export default ControlDemandaConfigPage;
