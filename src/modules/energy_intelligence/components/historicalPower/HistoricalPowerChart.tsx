import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { PowerDataPoint } from "./useHistoricalPowerData";

interface HistoricalPowerChartProps {
  data: PowerDataPoint[];
  showTime?: boolean;
}

export const HistoricalPowerChart = ({ data, showTime = true }: HistoricalPowerChartProps) => {
  const formatDate = (fecha: string) => {
    const parts = fecha.split("-");
    return `${parts[2]}/${parts[1]}`;
  };

  // Find the index of the first occurrence of the absolute maximum
  let maxIdx = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].ejecutado > data[maxIdx].ejecutado) {
      maxIdx = i;
    }
  }

  const getColor = (index: number) => {
    return index === maxIdx ? "#8B0000" : "#156082";
  };

  const chartData = data.map((item, index) => ({
    date: formatDate(item.fecha),
    value: item.ejecutado,
    hora: item.hora,
    minuto: item.minuto,
    color: getColor(index),
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
      if (showTime && entry.hora != null && entry.minuto != null) {
        const h = String(entry.hora).padStart(2, "0");
        const m = String(entry.minuto).padStart(2, "0");
        return `${dateStr} | Hora: ${h}:${m}`;
      }
      return dateStr;
    }
    return _label;
  };

  return (
    <div className="w-full flex-1" style={{ minHeight: 420 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={55}
            interval={calculateInterval()}
            fontSize={11}
            tickMargin={10}
          />
          <YAxis type="number" domain={[7000, 8500]} width={55} allowDataOverflow={true} fontSize={11} tickLine={false} tickFormatter={(v: number) => `${v}`} />
          <Tooltip formatter={formatTooltip} labelFormatter={formatTooltipLabel} />
          <Bar dataKey="value" name="Potencia Máxima" maxBarSize={60}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
