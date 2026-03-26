import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReportContext } from "../context/ReportContext";
import { MESES } from "../types";
import { supabase } from "@/integrations/supabase/client";
import SearchableCombobox from "../components/SearchableCombobox";

interface Client {
  id: string;
  company_name: string;
}

const CONCESIONARIAS_DEFAULT = ["Luz del Sur", "Enel", "Electrocentro"];

const Hoja1DatosGenerales = () => {
  const { data, updateSheet } = useReportContext();
  const dg = data.datos_generales;
  const [clients, setClients] = useState<Client[]>([]);
  const [concesionarias, setConcesionarias] = useState<string[]>(CONCESIONARIAS_DEFAULT);

  // Load clients
  useEffect(() => {
    supabase.from("clients").select("id, company_name").then(({ data }) => {
      if (data) setClients(data);
    });
  }, []);

  // Load unique concesionarias from past reports
  useEffect(() => {
    supabase
      .from("reportes_control_demanda" as any)
      .select("datos_generales")
      .then(({ data: rows }) => {
        if (rows) {
          const saved = new Set<string>(CONCESIONARIAS_DEFAULT);
          (rows as any[]).forEach((r) => {
            const c = r.datos_generales?.concesionaria;
            if (c && typeof c === "string" && c.trim()) saved.add(c.trim());
          });
          setConcesionarias(Array.from(saved).sort());
        }
      });
  }, []);

  // When client changes: load last report defaults (concesionaria + auto correlative)
  const handleClientChange = useCallback(
    async (clientId: string) => {
      const client = clients.find((c) => c.id === clientId);
      if (!client) return;

      const updated = {
        ...dg,
        client_id: clientId,
        client_name: client.company_name,
      };

      // Get last report for this client to pre-fill concesionaria
      const { data: lastReports } = await supabase
        .from("reportes_control_demanda" as any)
        .select("datos_generales")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastReports && lastReports.length > 0) {
        const lastDg = (lastReports[0] as any).datos_generales;
        if (lastDg?.concesionaria) {
          updated.concesionaria = lastDg.concesionaria;
        }
      }

      // Auto-correlative: count existing reports for this client
      const { count } = await supabase
        .from("reportes_control_demanda" as any)
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId);

      const nextNumber = ((count || 0) + 1).toString().padStart(2, "0");
      updated.numero_informe = nextNumber;

      updateSheet("datos_generales", updated);
      updateSheet("client_id" as any, clientId);
    },
    [clients, dg, updateSheet]
  );

  const update = (field: string, value: string) => {
    const updated = { ...dg, [field]: value };
    updateSheet("datos_generales", updated);

    if (field === "mes") {
      const mesIndex = MESES.indexOf(value) + 1;
      updateSheet("mes", mesIndex);
    }
    if (field === "anio") {
      updateSheet("anio", parseInt(value) || new Date().getFullYear());
    }
  };

  const handleCreateClient = (name: string) => {
    // For now just add to local list — creating in DB would need additional logic
    const fakeId = `new-${Date.now()}`;
    setClients((prev) => [...prev, { id: fakeId, company_name: name }]);
  };

  const handleCreateConcesionaria = (name: string) => {
    setConcesionarias((prev) =>
      Array.from(new Set([...prev, name])).sort()
    );
    update("concesionaria", name);
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.company_name,
  }));

  const concesionariaOptions = concesionarias.map((c) => ({
    value: c,
    label: c,
  }));

  return (
    <div className="space-y-4 min-w-0 overflow-hidden">
      <div className="space-y-4 min-w-0">
        <div className="flex items-center gap-4 min-w-0">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">Cliente</span>
          <div className="flex-1 min-w-0">
            <SearchableCombobox
              options={clientOptions}
              value={dg.client_id}
              onSelect={handleClientChange}
              onCreate={handleCreateClient}
              placeholder="Seleccionar cliente..."
              createLabel="Crear cliente"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 min-w-0">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">Concesionaria</span>
          <div className="flex-1 min-w-0">
            <SearchableCombobox
              options={concesionariaOptions}
              value={dg.concesionaria}
              onSelect={(v) => update("concesionaria", v)}
              onCreate={handleCreateConcesionaria}
              placeholder="Seleccionar concesionaria..."
              createLabel="Crear concesionaria"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">N° de Informe</span>
          <Input value={dg.numero_informe} onChange={(e) => update("numero_informe", e.target.value)} placeholder="01" className="flex-1" />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">Mes</span>
          <Select value={dg.mes} onValueChange={(v) => update("mes", v)}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">Año</span>
          <Input value={dg.anio} onChange={(e) => update("anio", e.target.value)} placeholder="2026" className="flex-1" />
        </div>
      </div>
    </div>
  );
};

export default Hoja1DatosGenerales;
