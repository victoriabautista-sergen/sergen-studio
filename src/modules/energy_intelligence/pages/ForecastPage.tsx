import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { startOfDay, endOfDay, format } from 'date-fns';
import EnergyShell from '../components/EnergyShell';
import { ForecastChart } from '../components/forecast/ForecastChart';
import { ForecastTable } from '../components/forecast/ForecastTable';
import { HistoricalTab } from '../components/forecast/HistoricalTab';
import { ExportDataDialog } from '../components/shared/ExportDataDialog';
import type { CoesData } from '../types';

const ForecastPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CoesData[]>([]);
  const currentDate = format(new Date(), 'dd/MM/yyyy');

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      const { data: forecastData, error } = await supabase
        .from('coes_demand_data')
        .select('date, executed_power, daily_forecast, weekly_forecast')
        .gte('date', startOfToday)
        .lte('date', endOfToday)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!forecastData || forecastData.length === 0) {
        toast.info('No hay datos disponibles para hoy');
        setData([]);
        return;
      }

      setData(forecastData as unknown as CoesData[]);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      toast.error('Error al cargar los datos del pronóstico');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await supabase.functions.invoke('get-coes-data');

      if (response.error) {
        throw new Error('Error actualizando datos del COES');
      }

      await fetchData();
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Error al actualizar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <EnergyShell>
      <Tabs defaultValue="forecast" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forecast">Diario</TabsTrigger>
          <TabsTrigger value="historical">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-2xl font-bold">Pronóstico de Demanda - {currentDate}</h2>
            <div className="flex gap-4">
              <Button variant="outline" onClick={refreshData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <ExportDataDialog data={data} filename="pronostico-demanda" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {data.length > 0 ? (
              <>
                <div className="bg-card p-4 rounded-lg shadow h-[500px]">
                  <ForecastChart data={data} />
                </div>
                <div className="bg-card p-4 rounded-lg shadow overflow-x-auto">
                  <ForecastTable data={data} />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No hay datos disponibles para hoy. Haz clic en "Actualizar" para cargar los datos.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historical">
          <HistoricalTab />
        </TabsContent>
      </Tabs>
    </EnergyShell>
  );
};

export default ForecastPage;
