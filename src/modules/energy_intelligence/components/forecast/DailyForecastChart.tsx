import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CoesData } from '../../types';

interface DailyForecastChartProps {
  data: CoesData[];
}

export const DailyForecastChart = ({ data }: DailyForecastChartProps) => {
  const formatTime = (dateStr: string) => dateStr.split('T')[1]?.substring(0, 5) ?? dateStr;
  const formatDateTime = (dateStr: string) => dateStr.replace('T', ' ').substring(0, 16);

  const processedData = data.map(item => ({
    date: item.date,
    daily_forecast: item.daily_forecast,
    weekly_forecast: item.weekly_forecast,
    executed_power: item.executed_power,
  }));

  return (
    <div className="h-[400px] w-full mb-6">
      <ResponsiveContainer>
        <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="date" tickFormatter={formatTime} />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={value => formatDateTime(value as string)}
            formatter={(value: any) => (value ? `${value} MW` : '-')}
          />
          <Legend />
          <Line type="monotone" dataKey="daily_forecast" name="Prog. Diaria" stroke="#F97316" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="weekly_forecast" name="Prog. Semanal" stroke="#90C418" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="executed_power" name="Demanda Real" stroke="#0036A2" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
