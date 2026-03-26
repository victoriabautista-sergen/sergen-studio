import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReportContext } from "../context/ReportContext";
import { MESES } from "../types";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  company_name: string;
}

const Hoja1DatosGenerales = () => {
  const { data, updateSheet } = useReportContext();
  const dg = data.datos_generales;
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    supabase.from("clients").select("id, company_name").then(({ data }) => {
      if (data) setClients(data);
    });
  }, []);

  const update = (field: string, value: string) => {
    const updated = { ...dg, [field]: value };
    updateSheet("datos_generales", updated);

    if (field === "client_id") {
      const client = clients.find(c => c.id === value);
      if (client) {
        updated.client_name = client.company_name;
        updateSheet("datos_generales", updated);
        updateSheet("client_id" as any, value);
      }
    }
    if (field === "mes") {
      const mesIndex = MESES.indexOf(value) + 1;
      updateSheet("mes", mesIndex);
    }
    if (field === "anio") {
      updateSheet("anio", parseInt(value) || new Date().getFullYear());
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Datos Generales</h3>

      <div className="space-y-3">
        <div>
          <Label>Cliente</Label>
          <Select value={dg.client_id} onValueChange={v => update("client_id", v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
            <SelectContent>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Concesionaria</Label>
          <Input value={dg.concesionaria} onChange={e => update("concesionaria", e.target.value)} placeholder="Ej: Luz del Sur" />
        </div>

        <div>
          <Label>Número de Informe</Label>
          <Input value={dg.numero_informe} onChange={e => update("numero_informe", e.target.value)} placeholder="Ej: INF-001-2026" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Mes</Label>
            <Select value={dg.mes} onValueChange={v => update("mes", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MESES.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Año</Label>
            <Input value={dg.anio} onChange={e => update("anio", e.target.value)} placeholder="2026" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hoja1DatosGenerales;
