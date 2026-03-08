import type { CoesData } from '../../types';
import { ForecastChart } from '../forecast/ForecastChart';

interface ForecastDisplayProps {
  data: CoesData[];
  isLoading: boolean;
}

export const ForecastDisplay = ({ data, isLoading }: ForecastDisplayProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">No hay datos disponibles para los últimos días</p>
      </div>
    );
  }

  return <ForecastChart data={data} />;
};
