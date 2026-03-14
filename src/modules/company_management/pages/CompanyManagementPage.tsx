import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/core/auth/context/AuthContext";
import PrivateRoute from "@/core/auth/components/PrivateRoute";
import ModuleLayout from "@/shared/components/ModuleLayout";
import CompanyInfoSection from "../components/CompanyInfoSection";
import CompanyUsersSection from "../components/CompanyUsersSection";
import CompanyModulesSection from "../components/CompanyModulesSection";
import CompanyRequestsSection from "../components/CompanyRequestsSection";

const CompanyManagementContent = () => {
  const { role, clientIds } = useAuthContext();
  const isSergen = role === "super_admin" || role === "technical_user";

  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    !isSergen && clientIds.length > 0 ? clientIds[0] : null
  );

  // All companies for SERGEN users
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["company-mgmt-companies"],
    enabled: isSergen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, ruc, industry")
        .order("company_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Auto-select for company users
  const effectiveCompanyId = isSergen ? selectedCompanyId : clientIds[0] ?? null;

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["company-mgmt-detail", effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, ruc, industry, contract_info, energy_supply_info")
        .eq("id", effectiveCompanyId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        (c.ruc ?? "").toLowerCase().includes(q)
    );
  }, [companies, search]);

  return (
    <ModuleLayout title="Gestión de Empresa">
      <div className="space-y-6">
        {/* Company selector for SERGEN users */}
        {isSergen && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Seleccionar empresa</CardTitle>
              <CardDescription>Busca y selecciona una empresa para gestionar su configuración.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o RUC…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {loadingCompanies ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No se encontraron empresas.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCompanyId(c.id)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        selectedCompanyId === c.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate">{c.company_name}</span>
                      </div>
                      {c.ruc && <p className="text-xs text-muted-foreground mt-1 ml-6">RUC: {c.ruc}</p>}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Company detail */}
        {!effectiveCompanyId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="h-10 w-10 mb-3" />
              <p className="text-lg font-medium">Selecciona una empresa</p>
              <p className="text-sm mt-1">Elige una empresa del buscador para ver su configuración.</p>
            </CardContent>
          </Card>
        ) : loadingCompany ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : company ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">{company.company_name}</h2>
              <p className="text-sm text-muted-foreground">
                {company.ruc ? `RUC: ${company.ruc}` : ""}
                {company.industry ? ` · ${company.industry}` : ""}
              </p>
            </div>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
                <TabsTrigger value="modulos">Permisos</TabsTrigger>
                <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-6">
                <CompanyInfoSection company={company} />
              </TabsContent>
              <TabsContent value="usuarios" className="mt-6">
                <CompanyUsersSection companyId={company.id} />
              </TabsContent>
              <TabsContent value="modulos" className="mt-6">
                <CompanyModulesSection companyId={company.id} />
              </TabsContent>
              <TabsContent value="solicitudes" className="mt-6">
                <CompanyRequestsSection />
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    </ModuleLayout>
  );
};

const CompanyManagementPage = () => (
  <PrivateRoute>
    <CompanyManagementContent />
  </PrivateRoute>
);

export default CompanyManagementPage;
