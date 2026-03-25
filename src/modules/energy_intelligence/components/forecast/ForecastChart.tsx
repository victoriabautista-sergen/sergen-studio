import React, { forwardRef, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceArea, ReferenceDot, ReferenceLine, Label } from 'recharts';
import { CoesData } from '../../types/forecast';

interface ForecastChartProps {
  data: CoesData[];
  showPeakLabel?: boolean;
  onPeakValueChange?: (value: number | null) => void;
}

const PEAK_START = 18;
const PEAK_END = 23;

const SERIES_COLORS = {
  reprogramacion: '#C00000',
  pronostico: '#f39200',
  rangoInferior: '#90C418',
  rangoSuperior: '#90C418',
  demandaReal: '#156082',
};

interface PeakPoint {
  index: number;
  time: string;
  reprogramacion: number;
  pronostico: number | null;
  rangoInferior: number | null;
  rangoSuperior: number | null;
  fechaLabel: string;
}

// Custom tooltip – single, hover-only, positioned above cursor
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid #d1d5db',
        borderRadius: 6,
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        fontSize: 12,
        lineHeight: '18px',
        minWidth: 200,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#374151' }}>
        {entry?.fecha_label || label}
      </div>
      {payload.map((p: any) => (
        p.value != null && (
          <div key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW
          </div>
        )
      ))}
    </div>
  );
};

export const ForecastChart = forwardRef<HTMLDivElement, ForecastChartProps>(({ data, showPeakLabel = true, onPeakValueChange }, ref) => {
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
    return `${dia}/${mes}/${año} ${hora}:${minutos}`;
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
      fecha_completa: formatFullDate(item.fecha) + ' (UTC)',
      fecha_label: formatFullDate(item.fecha),
    };
  });

  // Find peak reprogramado within peak hours
  const peakPoint = useMemo<PeakPoint | null>(() => {
    let maxVal = -Infinity;
    let maxIdx = -1;
    chartData.forEach((d, i) => {
      if (d.hora >= PEAK_START && d.hora < PEAK_END && d.Reprogramación != null && d.Reprogramación > maxVal) {
        maxVal = d.Reprogramación;
        maxIdx = i;
      }
    });
    if (maxIdx === -1) return null;
    const d = chartData[maxIdx];
    return {
      index: maxIdx,
      time: d.time,
      reprogramacion: d.Reprogramación!,
      pronostico: d['Pronóstico Diario'],
      rangoInferior: d['Rango Inferior'],
      rangoSuperior: d['Rango Superior'],
      fechaLabel: d.fecha_label,
    };
  }, [chartData]);

  // Notify parent of peak value
  useEffect(() => {
    onPeakValueChange?.(peakPoint?.reprogramacion ?? null);
  }, [peakPoint, onPeakValueChange]);

  return (
    <div ref={ref}>
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 50, bottom: 35 }}>
          <XAxis dataKey="time" interval={2} angle={-45} textAnchor="end" height={60} />
          <YAxis domain={[5500, 8500]} tickFormatter={v => v.toLocaleString()} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
            isAnimationActive={false}
            offset={20}
            position={undefined}
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
          <Line type="monotone" dataKey="Reprogramación" stroke={SERIES_COLORS.reprogramacion} strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="Pronóstico Diario" stroke={SERIES_COLORS.pronostico} strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="Rango Inferior" stroke={SERIES_COLORS.rangoInferior} strokeWidth={1} strokeDasharray="5 5" dot={false} connectNulls />
          <Line type="monotone" dataKey="Rango Superior" stroke={SERIES_COLORS.rangoSuperior} strokeWidth={1} strokeDasharray="5 5" dot={false} connectNulls />
          <Line type="monotone" dataKey="Demanda Real" stroke={SERIES_COLORS.demandaReal} strokeWidth={2} dot={false} connectNulls />
          {/* Peak dot on Reprogramación */}
          {peakPoint && (
            <ReferenceDot
              x={peakPoint.time}
              y={peakPoint.reprogramacion}
              r={6}
              fill={SERIES_COLORS.reprogramacion}
              stroke="#fff"
              strokeWidth={2}
              isFront
            >
              <Label
                position="bottom"
                offset={8}
                content={({ viewBox }: any) => {
                  const x = viewBox?.x ?? 0;
                  const y = viewBox?.y ?? 0;
                  return (
                    <foreignObject x={x - 50} y={y + 65} width={100} height={40}>
                      <div
                        style={{
                          background: 'rgba(192,0,0,0.92)',
                          color: '#fff',
                          borderRadius: 5,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          textAlign: 'center',
                          lineHeight: '15px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div>{peakPoint.time}</div>
                        <div>{peakPoint.reprogramacion.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MW</div>
                      </div>
                    </foreignObject>
                  );
                }}
              />
            </ReferenceDot>
          )}
          {/* Peak vertical dashed line */}
          {peakPoint && (
            <ReferenceLine
              x={peakPoint.time}
              stroke="#C00000"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              strokeOpacity={0.7}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

ForecastChart.displayName = 'ForecastChart';
