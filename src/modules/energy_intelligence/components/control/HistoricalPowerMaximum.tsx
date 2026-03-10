import React, { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useHistoricalPowerData } from '../../hooks/useHistoricalPowerData';
import { HistoricalPowerChart } from './HistoricalPowerChart';

export const HistoricalPowerMaximum = forwardRef<HTMLDivElement>(
  (_props, ref) => {
    const { chartData, isLoading, error } = useHistoricalPowerData();

    const handleRetry = () => window.location.reload();

    return (
      <Card ref={ref} className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>Potencia Máxima (18:00 - 23:00)</span>
            <button
              onClick={handleRetry}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <p className="text-muted-foreground">Cargando datos...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 flex-col gap-3">
              <div className="flex items-center text-red-500">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p className="font-medium">{error}</p>
              </div>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={handleRetry}
              >
                Reintentar
              </button>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 flex-col gap-2">
              <p className="text-muted-foreground">
                No hay datos disponibles en el rango horario de 18:00 a 23:00
              </p>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={handleRetry}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <HistoricalPowerChart chartData={chartData} />
          )}
        </CardContent>
      </Card>
    );
  }
);

HistoricalPowerMaximum.displayName = 'HistoricalPowerMaximum';
