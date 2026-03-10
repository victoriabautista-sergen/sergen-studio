import React, { forwardRef } from 'react';
import { CoesData } from "../../types/forecast";
import { ForecastChart } from "./ForecastChart";

interface ForecastDisplayProps {
  data: CoesData[];
  isLoading: boolean;
}

export const ForecastDisplay = forwardRef<HTMLDivElement, ForecastDisplayProps>(
  ({ data, isLoading }, ref) => {
    if (isLoading) {
      return (
        <div ref={ref} className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div ref={ref} className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">No hay datos disponibles para los últimos días</p>
        </div>
      );
    }

    return (
      <div ref={ref}>
        <ForecastChart data={data} />
      </div>
    );
  }
);

ForecastDisplay.displayName = 'ForecastDisplay';
