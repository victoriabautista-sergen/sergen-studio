import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForecastData } from '../../hooks/useForecastData';
import { ForecastDisplay } from './ForecastDisplay';

interface PowerChartsProps {
  className?: string;
}

export const PowerCharts = forwardRef<HTMLDivElement, PowerChartsProps>(({ className }, ref) => {
  const { data, loading } = useForecastData();
  const currentDate = format(new Date(), 'dd/MM/yyyy');

  return (
    <Card ref={ref} className={className}>
      <CardHeader className="card-header-3d pb-2">
        <CardTitle>Pronóstico de Demanda - {currentDate}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ForecastDisplay data={data} isLoading={loading} />
      </CardContent>
    </Card>
  );
});

PowerCharts.displayName = 'PowerCharts';
