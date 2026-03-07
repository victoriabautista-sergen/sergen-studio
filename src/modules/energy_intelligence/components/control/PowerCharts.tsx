import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForecastData } from '../../hooks/useForecastData';
import { ForecastDisplay } from './ForecastDisplay';

export const PowerCharts = () => {
  const { data, loading } = useForecastData();
  const currentDate = format(new Date(), 'dd/MM/yyyy');

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Pronóstico de Demanda - {currentDate}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ForecastDisplay data={data} isLoading={loading} />
      </CardContent>
    </Card>
  );
};
