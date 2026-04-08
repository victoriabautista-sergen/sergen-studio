import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { useReportContext } from "../context/ReportContext";
import { MESES } from "../types";
import { supabase } from "@/integrations/supabase/client";
import SearchableCombobox from "../components/SearchableCombobox";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  company_name: string;
}

const CONCESIONARIAS_DEFAULT = ["Luz del Sur", "Enel", "Electrocentro"];

const Hoja1DatosGenerales = () => {
  const { data, updateSheet } = useReportContext();
  const { toast } = useToast();
  const dg = data.datos_generales;
  const [clients, setClients] = useState<Client[]>([]);
  const [concesionarias, setConcesionarias] = useState<string[]>(CONCESIONARIAS_DEFAULT);
  const [editingClient, setEditingClient] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingClient, setSavingClient] = useState(false);

  const handleEditClient = () => {
    const client = clients.find(c => c.id === dg.client_id);
    if (client) {
      setEditName(client.company_name);
      setEditingClient(true);
    }
  };

  const handleSaveClientName = async () => {
    if (!editName.trim() || !dg.client_id) return;
    setSavingClient(true);
    const { error } = await supabase
      .from("clients")
      .update({ company_name: editName.trim() })
      .eq("id", dg.client_id);
    setSavingClient(false);
    if (error) {
      toast({ title: "Error al actualizar nombre", variant: "destructive" });
      return;
    }
    setClients(prev => prev.map(c => c.id === dg.client_id ? { ...c, company_name: editName.trim() } : c));
    updateSheet("datos_generales", { ...dg, client_name: editName.trim() });
    setEditingClient(false);
    toast({ title: "Nombre de cliente actualizado" });
  };

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
      let ultimoCorrelativo: string | null = null;

      // Get last report for this client to pre-fill concesionaria + base values
      const { data: lastReports } = await supabase
        .from("reportes_control_demanda" as any)
        .select("datos_generales, hoja2_data")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastReports && lastReports.length > 0) {
        const last = lastReports[0] as any;
        const lastDg = last.datos_generales;
        if (lastDg?.concesionaria) {
          updated.concesionaria = lastDg.concesionaria;
        }
        if (lastDg?.numero_informe) {
          ultimoCorrelativo = String(lastDg.numero_informe).trim();
        }

        // Pre-fill base values from last report
        const lastH2 = last.hoja2_data;
        if (lastH2) {
          const baseFields = {
            precio_base_hp: lastH2.precio_base_hp ?? 0,
            precio_base_hfp: lastH2.precio_base_hfp ?? 0,
            precio_potencia: lastH2.precio_potencia ?? 0,
            moneda: lastH2.moneda ?? "PEN",
            png_moneda: lastH2.png_moneda ?? "USD",
            png_actual_moneda: lastH2.png_actual_moneda ?? lastH2.png_moneda ?? "USD",
            pngo: lastH2.pngo ?? 0,
            tco: lastH2.tco ?? 0,
            ippo: lastH2.ippo ?? 0,
            factor_perdida: lastH2.factor_perdida ?? 1.0,
            formula: lastH2.formula ?? "PB × (PNG/PNGo) × (TC/TCo) × (IPP/IPPo) × FP",
            formula_calculo: lastH2.formula_calculo ?? "Factor_A = (PNG / PNG_o) × (TC / TC_o) × (IPP / IPP_o)",
          };
          updateSheet("hoja2_data", { ...data.hoja2_data, ...baseFields });
        }
      }

      // Auto-correlative: set the current baseline only for new reports.
      // It must increase exclusively when clicking "Descargar PDF".
      if (!data.id) {
        updated.numero_informe = ultimoCorrelativo || "01";
      }

      updateSheet("datos_generales", updated);
      updateSheet("client_id" as any, clientId);
    },
    [clients, dg, data.id, updateSheet]
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
      <div className="space-y-4 min-w-0" style={{ maxWidth: "420px" }}>
        <div className="flex items-center gap-4 min-w-0">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">Cliente</span>
          <div className="flex-1 min-w-0 flex items-center gap-1">
            {editingClient ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveClientName()}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleSaveClientName} disabled={savingClient || !editName.trim()}>
                  {savingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditingClient(false)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <SearchableCombobox
                    options={clientOptions}
                    value={dg.client_id}
                    onSelect={handleClientChange}
                    onCreate={handleCreateClient}
                    placeholder="Seleccionar"
                    createLabel="Crear cliente"
                  />
                </div>
                {dg.client_id && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleEditClient} title="Editar nombre del cliente">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
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
              placeholder="Seleccionar"
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
