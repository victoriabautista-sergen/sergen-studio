import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { PowerDataPoint } from "./useHistoricalPowerData";

interface HistoricalPowerChartProps {
  data: PowerDataPoint[];
  showTime?: boolean;
}

export const HistoricalPowerChart = ({ data, showTime = true }: HistoricalPowerChartProps) => {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.ejecutado)) : 0;

  const formatDate = (fecha: string) => {
    const parts = fecha.split("-");
    return `${parts[2]}/${parts[1]}`;
  };

  const chartData = data.map((item) => ({
    date: formatDate(item.fecha),
    value: item.ejecutado,
    hora: item.hora,
    minuto: item.minuto,
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
      const entry = payload[0].payload;
      const dateStr = `Fecha: ${entry.date}`;
      if (entry.hora != null && entry.minuto != null) {
        const h = String(entry.hora).padStart(2, "0");
        const m = String(entry.minuto).padStart(2, "0");
        return `${dateStr} | Hora: ${h}:${m}`;
      }
      return dateStr;
    }
    return _label;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 25, left: 60 }}>
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={50}
          interval={calculateInterval()}
          fontSize={10}
          tickMargin={10}
        />
        <YAxis type="number" domain={[5000, 8000]} width={70} allowDataOverflow={true} tickFormatter={(v: number) => `${v} MW`} />
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
