import React, { forwardRef } from 'react';
import type { CoesData } from '../../types';
import { ForecastChart } from '../forecast/ForecastChart';

interface ForecastDisplayProps {
  data: CoesData[];
  isLoading: boolean;
}

export const ForecastDisplay = forwardRef<HTMLDivElement, ForecastDisplayProps>(
  ({ data, isLoading }, ref) => {
    if (isLoading) {
      return (
        <div ref={ref} className="flex justify-center items-center h-64">
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div ref={ref} className="flex justify-center items-center h-64">
          <p className="text-gray-500">No hay datos disponibles para los últimos días</p>
        </div>
      );
    }

    return (
      <div ref={ref}>
        <ForecastChart data={data} showPeakLabel={false} />
      </div>
    );
  }
);

ForecastDisplay.displayName = 'ForecastDisplay';
