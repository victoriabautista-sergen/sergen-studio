import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { startOfDay, endOfDay, format } from 'date-fns';
import EnergyShell from '../components/EnergyShell';
import { ForecastChart } from '../components/forecast/ForecastChart';
import { ForecastTable } from '../components/forecast/ForecastTable';
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
        .from('coes_forecast')
        .select('fecha, reprogramado, pronostico, rango_inferior, rango_superior, ejecutado')
        .gte('fecha', startOfToday)
        .lte('fecha', endOfToday)
        .order('fecha', { ascending: true });

      if (error) throw error;

      if (!forecastData || forecastData.length === 0) {
        toast.info('No hay datos disponibles para hoy');
        setData([]);
        return;
      }

      setData(forecastData);
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
      const response = await supabase.functions.invoke('get-coes-forecast');

      if (!response.data?.success) {
        throw new Error('Error actualizando datos del COES');
      }

      await fetchData();
      toast.success(`Datos actualizados correctamente (${response.data.count} registros)`);
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
      <div className="space-y-6">
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
              <div className="bg-white p-4 rounded-lg shadow h-[500px]">
                <ForecastChart data={data} showPeakLabel={false} />
              </div>
              <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                <ForecastTable data={data} />
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No hay datos disponibles para hoy. Haz clic en "Actualizar" para cargar los datos.
              </p>
            </div>
          )}
        </div>
      </div>
    </EnergyShell>
  );
};

export default ForecastPage;
