import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { PowerDataPoint } from "./useHistoricalPowerData";

interface HistoricalPowerChartProps {
  data: PowerDataPoint[];
}

export const HistoricalPowerChart = ({ data }: HistoricalPowerChartProps) => {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.ejecutado)) : 0;

  const formatDate = (fecha: string) => {
    const d = new Date(fecha);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
  };

  const chartData = data.map((item) => ({
    date: formatDate(item.fecha),
    value: item.ejecutado,
    fullDate: item.fecha,
  }));

  const calculateInterval = () => {
    if (chartData.length <= 30) return 0;
    if (chartData.length <= 60) return 1;
    if (chartData.length <= 90) return 2;
    return Math.ceil(chartData.length / 30);
  };

  const formatTooltip = (value: number) => [`${value.toFixed(2)} MW`, "Potencia Máxima"];

  const formatTooltipLabel = (_label: string, payload: any[]) => {
    if (payload && payload.length > 0) {
      return `Fecha: ${payload[0].payload.date}`;
    }
    return _label;
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
        <YAxis type="number" domain={[5000, 8000]} allowDataOverflow={true} tickFormatter={(v: number) => `${v} MW`} />
        <Tooltip formatter={formatTooltip} labelFormatter={formatTooltipLabel} />
        <Bar dataKey="value" name="Potencia Máxima">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.value === maxValue ? "#8B0000" : "#1f77b4"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
