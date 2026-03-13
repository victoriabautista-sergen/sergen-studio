import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useHistoricalPowerData, getMonthLabel, type ViewMode } from '../historicalPower/useHistoricalPowerData';
import { HistoricalPowerChart } from './HistoricalPowerChart';
import { Button } from '@/components/ui/button';
import type { ChartData } from '../../types';

export const HistoricalPowerMaximum = () => {
  const [view, setView] = useState<ViewMode>("current");
  const { data, isLoading, error } = useHistoricalPowerData(view);

  const chartData: ChartData[] = (() => {
    if (data.length === 0) return [];
    const sorted = [...data].sort((a, b) => b.ejecutado - a.ejecutado);
    const maxVal = sorted[0]?.ejecutado;
    const secondVal = sorted[1]?.ejecutado;
    return data.map((item) => ({
      date: (() => { const parts = item.fecha.split("-"); return `${parts[2]}/${parts[1]}`; })(),
      value: item.ejecutado,
      fullDate: item.fecha,
      hora: item.hora,
      minuto: item.minuto,
      color:
        item.ejecutado === maxVal
          ? '#D9001B'
          : item.ejecutado === secondVal
          ? '#F97316'
          : '#156082',
    }));
  })();

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Potencia Máxima – {getMonthLabel(view)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "current" ? "previous" : "current")}
          >
            {view === "current" ? "Ver mes anterior" : "Volver al mes actual"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 flex-col gap-3">
            <div className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        ) : (
          <HistoricalPowerChart chartData={chartData} />
        )}
      </CardContent>
    </Card>
  );
};
