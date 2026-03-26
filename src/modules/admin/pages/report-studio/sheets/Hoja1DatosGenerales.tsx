import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">Cliente</span>
          <Select value={dg.client_id} onValueChange={v => update("client_id", v)}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar o buscar cl..." /></SelectTrigger>
            <SelectContent>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">Concesionaria</span>
          <Select value={dg.concesionaria} onValueChange={v => update("concesionaria", v)}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar concesiona..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Luz del Sur">Luz del Sur</SelectItem>
              <SelectItem value="Enel">Enel</SelectItem>
              <SelectItem value="Electrocentro">Electrocentro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">N° de Informe</span>
          <Input value={dg.numero_informe} onChange={e => update("numero_informe", e.target.value)} placeholder="01" className="flex-1" />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">Mes</span>
          <Select value={dg.mes} onValueChange={v => update("mes", v)}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground w-28 shrink-0">Año</span>
          <Input value={dg.anio} onChange={e => update("anio", e.target.value)} placeholder="2026" className="flex-1" />
        </div>
      </div>
    </div>
  );
};

export default Hoja1DatosGenerales;
