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

  // coes_forecast se actualiza automáticamente cada 15 min via pg_cron

  return (
    <EnergyShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Control de Demanda</h1>
        {settingsLastUpdate && (
          <p className="text-sm text-muted-foreground mt-1">
            Última actualización: {format(settingsLastUpdate, 'dd/MM/yyyy HH:mm')}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-primary border-muted rounded-full animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <RiskManagement date={date} setDate={setDate} />
          </div>
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <PowerCharts />
            <HistoricalPowerMaximum />
          </div>
        </div>
      )}
    </EnergyShell>
  );
};

export default ControlPage;
