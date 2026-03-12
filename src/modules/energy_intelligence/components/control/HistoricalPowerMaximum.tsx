import React, { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useHistoricalPowerData } from '../historicalPower/useHistoricalPowerData';
import { HistoricalPowerChart } from './HistoricalPowerChart';
import type { ChartData } from '../../types';

export const HistoricalPowerMaximum = () => {
  const { data, isLoading, error, refetch } = useHistoricalPowerData();

  const chartData: ChartData[] = (() => {
    if (data.length === 0) return [];
    const sorted = [...data].sort((a, b) => b.ejecutado - a.ejecutado);
    const maxVal = sorted[0]?.ejecutado;
    const secondVal = sorted[1]?.ejecutado;
    return data.map((item) => ({
      date: format(new Date(item.fecha), 'dd/MM'),
      value: item.ejecutado,
      fullDate: item.fecha,
      color:
        item.ejecutado === maxVal
          ? '#D9001B'
          : item.ejecutado === secondVal
          ? '#F97316'
          : '#156082',
    }));
  })();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Potencia Máxima (18:00 - 23:00)</span>
          <button
            onClick={refetch}
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
              onClick={refetch}
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
              onClick={refetch}
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
};
