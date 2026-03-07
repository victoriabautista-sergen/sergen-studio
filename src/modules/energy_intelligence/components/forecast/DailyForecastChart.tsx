import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CoesData } from '../../types';

interface DailyForecastChartProps {
  data: CoesData[];
}

export const DailyForecastChart = ({ data }: DailyForecastChartProps) => {
  const formatTime = (dateStr: string) => dateStr.split('T')[1]?.substring(0, 5) ?? dateStr;
  const formatDateTime = (dateStr: string) => dateStr.replace('T', ' ').substring(0, 16);

  const processedData = data.map(item => ({
    fecha: item.fecha,
    pronostico: item.pronostico,
    rango_inferior: item.rango_inferior,
    rango_superior: item.rango_superior,
    reprogramado: item.reprogramado,
    ejecutado: item.ejecutado,
  }));

  return (
    <div className="h-[400px] w-full mb-6">
      <ResponsiveContainer>
        <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="fecha" tickFormatter={formatTime} />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={value => formatDateTime(value as string)}
            formatter={(value: any) => (value ? `${value} MW` : '-')}
          />
          <Legend />
          <Line type="monotone" dataKey="rango_inferior" name="Límite Inferior" stroke="#00C000" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="rango_superior" name="Límite Superior" stroke="#00C000" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="pronostico" name="Pronóstico" stroke="#F97316" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="reprogramado" name="Reprogramado" stroke="#C00000" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="ejecutado" name="Ejecutado" stroke="#0036A2" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
