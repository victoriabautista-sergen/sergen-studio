import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EnergyShell from '../components/EnergyShell';
import { UploadEnergyData } from '../components/energy/UploadEnergyData';
import { EnergyForecastChart } from '../components/energy/EnergyForecastChart';
import { EnergyDataTable } from '../components/energy/EnergyDataTable';
import type { EnergyData } from '../types';

const ConfiguracionPage = () => {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const fetchEnergyData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No hay sesión activa');
        return;
      }

      const { data, error } = await supabase
        .from('energy_data')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: true });

      if (error) {
        toast.error('Error al cargar datos de energía');
        return;
      }

      setEnergyData(data || []);
      if (data && data.length > 0) setSelectedDate(data[0].date);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    }
  };

  useEffect(() => {
    fetchEnergyData();
  }, []);

  return (
    <EnergyShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>
        <p className="text-gray-500 mt-1">Gestión de datos de energía del cliente</p>
      </div>

      <div className="space-y-6">
        <UploadEnergyData onUploadSuccess={fetchEnergyData} />
        {energyData.length > 0 && (
          <>
            <EnergyForecastChart
              energyData={energyData}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
            <EnergyDataTable energyData={energyData} />
          </>
        )}
      </div>
    </EnergyShell>
  );
};

export default ConfiguracionPage;
