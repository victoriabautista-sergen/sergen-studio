import React, { forwardRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { CoesData } from '../../types/forecast';

interface ForecastChartProps {
  data: CoesData[];
}

export const ForecastChart = forwardRef<HTMLDivElement, ForecastChartProps>(({ data }, ref) => {
  const formatTime = (isoString: string): string => {
    const fecha = new Date(isoString);
    const hora = fecha.getUTCHours().toString().padStart(2, '0');
    const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
    return `${hora}:${minutos}`;
  };

  const formatFullDate = (isoString: string): string => {
    const fecha = new Date(isoString);
    const dia = fecha.getUTCDate().toString().padStart(2, '0');
    const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getUTCFullYear();
    const hora = fecha.getUTCHours().toString().padStart(2, '0');
    const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${año} ${hora}:${minutos} (UTC)`;
  };

  const isNullOrZero = (value: any): boolean =>
    value === null || value === undefined || value === 0;

  const sortedData = [...data].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  let lastRealDemandIndex = -1;
  for (let i = 0; i < sortedData.length; i++) {
    if (!isNullOrZero(sortedData[i].ejecutado)) lastRealDemandIndex = i;
  }

  const chartData = sortedData.map((item, index) => {
    const hora = new Date(item.fecha).getUTCHours();
    const showForecast = index > lastRealDemandIndex;
    return {
      time: formatTime(item.fecha),
      Reprogramación: isNullOrZero(item.reprogramado) ? null : item.reprogramado,
      'Pronóstico Diario': showForecast && !isNullOrZero(item.pronostico) ? item.pronostico : null,
      'Rango Inferior': showForecast && !isNullOrZero(item.rango_inferior) ? item.rango_inferior : null,
      'Rango Superior': showForecast && !isNullOrZero(item.rango_superior) ? item.rango_superior : null,
      'Demanda Real': isNullOrZero(item.ejecutado) ? null : item.ejecutado,
      hora,
      fecha_completa: formatFullDate(item.fecha),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={450}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 50, bottom: 35 }}>
        <XAxis dataKey="time" interval={2} angle={-45} textAnchor="end" height={60} />
        <YAxis domain={[5500, 8500]} tickFormatter={v => v.toLocaleString()} />
        <Tooltip
          formatter={(value: any, name: string) =>
            value ? [`${value.toLocaleString()} MW`, name] : ['No disponible', name]
          }
          labelFormatter={(_label, payload) =>
            payload?.[0] ? payload[0].payload.fecha_completa : _label
          }
        />
        <Legend verticalAlign="bottom" height={36} />
        {chartData.map((entry, index) =>
          entry.hora >= 18 && entry.hora < 23 && index < chartData.length - 1 ? (
            <ReferenceArea
              key={`area-${index}`}
              x1={entry.time}
              x2={chartData[index + 1].time}
              fill="#E8E8E8"
              fillOpacity={0.8}
            />
          ) : null
        )}
        <Line type="monotone" dataKey="Reprogramación" stroke="#C00000" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="Pronóstico Diario" stroke="#f39200" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="Rango Inferior" stroke="#90C418" strokeWidth={1} strokeDasharray="5 5" dot={false} connectNulls />
        <Line type="monotone" dataKey="Rango Superior" stroke="#90C418" strokeWidth={1} strokeDasharray="5 5" dot={false} connectNulls />
        <Line type="monotone" dataKey="Demanda Real" stroke="#156082" strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
};
