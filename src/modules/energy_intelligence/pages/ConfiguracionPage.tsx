import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EnergyShell from '../components/EnergyShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DemandRow {
  id: string;
  date: string;
  executed_power: number | null;
  daily_forecast: number | null;
  weekly_forecast: number | null;
  created_at: string | null;
}

const ConfiguracionPage = () => {
  const [demandData, setDemandData] = useState<DemandRow[]>([]);

  const fetchDemandData = async () => {
    try {
      const { data, error } = await supabase
        .from('coes_demand_data')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);

      if (error) {
        toast.error('Error al cargar datos de demanda');
        return;
      }

      setDemandData((data as unknown as DemandRow[]) || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    }
  };

  useEffect(() => {
    fetchDemandData();
  }, []);

  return (
    <EnergyShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">Datos de demanda COES almacenados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de Demanda COES ({demandData.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          {demandData.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay datos aún. Ejecuta la función get-coes-data para poblar la tabla.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-right p-2">Ejecutado (MW)</th>
                    <th className="text-right p-2">Prog. Diaria (MW)</th>
                    <th className="text-right p-2">Prog. Semanal (MW)</th>
                  </tr>
                </thead>
                <tbody>
                  {demandData.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="p-2">{new Date(row.date).toLocaleString()}</td>
                      <td className="text-right p-2">{row.executed_power ?? '-'}</td>
                      <td className="text-right p-2">{row.daily_forecast ?? '-'}</td>
                      <td className="text-right p-2">{row.weekly_forecast ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </EnergyShell>
  );
};

export default ConfiguracionPage;
