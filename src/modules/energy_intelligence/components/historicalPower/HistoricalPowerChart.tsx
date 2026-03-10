import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartData } from './useHistoricalPowerData';

interface HistoricalPowerChartProps {
  chartData: ChartData[];
}

export const HistoricalPowerChart = ({ chartData }: HistoricalPowerChartProps) => {
  const formatTooltip = (value: number) => [`${value.toFixed(2)} MW`, 'Potencia Máxima'];

  const formatTooltipLabel = (_label: string, payload: any[]) => {
    if (payload && payload.length > 0) {
      const data = payload[0].payload as ChartData;
      return `Fecha: ${data.fullDate}`;
    }
    return `Fecha: ${_label}`;
  };

  const calculateInterval = () => {
    if (chartData.length <= 30) return 0;
    if (chartData.length <= 60) return 1;
    if (chartData.length <= 90) return 2;
    return Math.ceil(chartData.length / 30);
  };

  return (
    <ResponsiveContainer width="100%" height={390}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={50}
          interval={calculateInterval()}
          fontSize={10}
          tickMargin={10}
        />
        <YAxis
          tickFormatter={(v: number) => `${v} MW`}
        />
        <Tooltip formatter={formatTooltip} labelFormatter={formatTooltipLabel} />
        <Bar dataKey="value" name="Potencia Máxima">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
