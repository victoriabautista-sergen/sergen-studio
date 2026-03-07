import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import EnergyShell from '../components/EnergyShell';
import { RiskManagement } from '../components/control/RiskManagement';
import { PowerCharts } from '../components/control/PowerCharts';
import { HistoricalPowerMaximum } from '../components/control/HistoricalPowerMaximum';

const ControlPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [settingsLastUpdate, setSettingsLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const checkStorageBuckets = async () => {
      try {
        await supabase.functions.invoke('check-storage-buckets');
      } catch (err) {
        console.error('Error verificando buckets:', err);
      }
    };
    checkStorageBuckets();
  }, []);

  useEffect(() => {
    const fetchLastSettingsUpdate = async () => {
      try {
        const { data, error } = await supabase
          .from('forecast_settings')
          .select('last_update')
          .order('last_update', { ascending: false })
          .limit(1)
          .single();

        if (!error && data?.last_update) {
          setSettingsLastUpdate(new Date(data.last_update));
        }
      } catch (err) {
        console.error('Error al obtener última actualización:', err);
      }
    };

    fetchLastSettingsUpdate();
  }, []);

  useEffect(() => {
    const updateForecastData = async () => {
      try {
        setLoading(true);
        await supabase.functions.invoke('get-coes-forecast');
        toast.success('Datos de pronóstico actualizados');
      } catch (e) {
        console.error('Error updating forecast data:', e);
        toast.error('Error al actualizar datos de pronóstico');
      } finally {
        setLoading(false);
      }
    };

    updateForecastData();
    const interval = setInterval(updateForecastData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <EnergyShell>
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Control de Demanda</h1>
        {settingsLastUpdate && (
          <p className="text-sm text-gray-600">
            Última actualización: {format(settingsLastUpdate, 'dd/MM/yyyy HH:mm')}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-primary border-gray-200 rounded-full animate-spin mb-4" />
            <p className="text-lg text-gray-600">Cargando datos...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <RiskManagement date={date} setDate={setDate} />
          </div>
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <PowerCharts />
            <HistoricalPowerMaximum />
          </div>
        </div>
      )}
    </EnergyShell>
  );
};

export default ControlPage;
