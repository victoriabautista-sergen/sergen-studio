import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { CoesData } from '../../types/forecast';

interface ForecastChartProps {
  data: CoesData[];
}

export const ForecastChart = ({ data }: ForecastChartProps) => {
  const formatTime = (isoString: string): string => {
    const d = new Date(isoString);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  };

  const formatFullDate = (isoString: string): string => {
    const d = new Date(isoString);
    const dia = d.getUTCDate().toString().padStart(2, '0');
    const mes = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}/${d.getUTCFullYear()} ${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  };

  const isNullOrZero = (v: any): boolean => v === null || v === undefined || v === 0;

  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartData = sortedData.map((item) => ({
    time: formatTime(item.date),
    'Prog. Diaria': isNullOrZero(item.daily_forecast) ? null : item.daily_forecast,
    'Prog. Semanal': isNullOrZero(item.weekly_forecast) ? null : item.weekly_forecast,
    'Demanda Real': isNullOrZero(item.executed_power) ? null : item.executed_power,
    hora: new Date(item.date).getUTCHours(),
    fecha_completa: formatFullDate(item.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={450}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 50, bottom: 35 }}>
        <XAxis dataKey="time" interval={2} angle={-45} textAnchor="end" height={60} />
        <YAxis domain={['auto', 'auto']} tickFormatter={v => `${v}`} />
        <Tooltip
          formatter={(value: any, name: string) =>
            value ? [`${value} MW`, name] : ['No disponible', name]
          }
          labelFormatter={(_label, payload) =>
            payload?.[0] ? payload[0].payload.fecha_completa : _label
          }
        />
        <Legend verticalAlign="bottom" height={36} />
        {chartData.map((entry, index) =>
          entry.hora >= 18 && entry.hora < 23 && index < chartData.length - 1 ? (
            <ReferenceArea key={`area-${index}`} x1={entry.time} x2={chartData[index + 1].time} fill="#E8E8E8" fillOpacity={0.8} />
          ) : null
        )}
        <Line type="monotone" dataKey="Prog. Diaria" stroke="#f39200" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="Prog. Semanal" stroke="#90C418" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="Demanda Real" stroke="#156082" strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
};
