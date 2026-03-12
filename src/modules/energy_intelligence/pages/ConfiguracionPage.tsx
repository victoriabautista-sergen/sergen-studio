import { useState } from 'react';
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
    toast.info('Función de carga de datos pendiente de configuración');
  };

  return (
    <EnergyShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">Gestión de datos de energía del cliente</p>
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
