import React, { forwardRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ChartData } from '../../types';

interface HistoricalPowerChartProps {
  chartData: ChartData[];
}

export const HistoricalPowerChart = forwardRef<HTMLDivElement, HistoricalPowerChartProps>(
  ({ chartData }, ref) => {
    const formatTooltip = (value: number) => [`${value.toFixed(2)} MW`, 'Potencia Máxima'];

    const formatTooltipLabel = (_label: string, payload: any[]) => {
      if (payload && payload.length > 0) {
        const entry = payload[0].payload as ChartData;
        const dateStr = `Fecha: ${entry.date}`;
        if (entry.hora != null && entry.minuto != null) {
          const h = String(entry.hora).padStart(2, '0');
          const m = String(entry.minuto).padStart(2, '0');
          return `${dateStr} | Hora: ${h}:${m}`;
        }
        return dateStr;
      }
      return _label;
    };

    const calculateInterval = () => {
      if (chartData.length <= 30) return 0;
      if (chartData.length <= 60) return 1;
      if (chartData.length <= 90) return 2;
      return Math.ceil(chartData.length / 30);
    };

    return (
      <div ref={ref} className="flex-1 min-h-[390px] pt-2">
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
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

HistoricalPowerChart.displayName = 'HistoricalPowerChart';
