import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceArea, ReferenceDot, Label } from 'recharts';

interface ChartDataPoint {
  fecha: string;
  pronostico: number | null;
  rango_inferior: number | null;
  rango_superior: number | null;
  reprogramado: number | null;
  ejecutado: number | null;
}

interface DailyForecastChartRenderProps {
  data: ChartDataPoint[];
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

const isNullOrZero = (value: any): boolean =>
  value === null || value === undefined || value === 0;

/**
 * Static, deterministic chart for image capture.
 * Uses EXACT same data transformation as ForecastChart (dashboard).
 * No tooltips, legends, animations, or interactive elements.
 */
export const DailyForecastChartRender = ({ data }: DailyForecastChartRenderProps) => {
  const formatTime = (isoString: string): string => {
    const fecha = new Date(isoString);
    const hora = fecha.getUTCHours().toString().padStart(2, '0');
    const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
    return `${hora}:${minutos}`;
  };

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
    };
  });

  // Find peak reprogramado within peak hours (same logic as ForecastChart)
  const peakPoint = useMemo(() => {
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
      time: d.time,
      reprogramacion: d.Reprogramación!,
      pronostico: d['Pronóstico Diario'],
      rangoInferior: d['Rango Inferior'],
      rangoSuperior: d['Rango Superior'],
    };
  }, [chartData]);

  const PeakLabel = (props: any) => {
    if (!peakPoint) return null;
    const { viewBox } = props;
    const x = viewBox?.x ?? 0;
    const y = viewBox?.y ?? 0;
    const offsetX = -120;
    const offsetY = 55;

    // Format date from the peak's original fecha
    const peakOriginal = sortedData.find(d => formatTime(d.fecha) === peakPoint.time);
    const fechaLabel = peakOriginal
      ? (() => {
          const f = new Date(peakOriginal.fecha);
          const dd = f.getUTCDate().toString().padStart(2, '0');
          const mm = (f.getUTCMonth() + 1).toString().padStart(2, '0');
          const yyyy = f.getUTCFullYear();
          const hh = f.getUTCHours().toString().padStart(2, '0');
          const min = f.getUTCMinutes().toString().padStart(2, '0');
          return `${dd}/${mm}/${yyyy} ${hh}:${min} (UTC)`;
        })()
      : peakPoint.time;

    return (
      <foreignObject x={x + offsetX} y={y + offsetY} width={240} height={120}>
        <div
          style={{
            background: 'rgba(255,255,255,0.96)',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            fontSize: 12,
            lineHeight: '18px',
            minWidth: 220,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4, color: '#374151' }}>
            {fechaLabel}
          </div>
          <div style={{ color: SERIES_COLORS.reprogramacion }}>
            Reprogramación : {peakPoint.reprogramacion.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW
          </div>
          {peakPoint.pronostico != null && (
            <div style={{ color: SERIES_COLORS.pronostico }}>
              Pronóstico Diario : {peakPoint.pronostico.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW
            </div>
          )}
          {peakPoint.rangoInferior != null && (
            <div style={{ color: SERIES_COLORS.rangoInferior }}>
              Rango Inferior : {peakPoint.rangoInferior.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW
            </div>
          )}
          {peakPoint.rangoSuperior != null && (
            <div style={{ color: SERIES_COLORS.rangoSuperior }}>
              Rango Superior : {peakPoint.rangoSuperior.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW
            </div>
          )}
        </div>
      </foreignObject>
    );
  };

  console.log('[RENDER] registros:', chartData.length);
  if (chartData.length > 0) {
    console.log('[RENDER] primer dato:', chartData[0]);
    console.log('[RENDER] último dato:', chartData[chartData.length - 1]);
  }

  return (
    <div style={{ width: 800, height: 400, background: '#ffffff', padding: '4px 4px 0 0' }}>
      <LineChart width={796} height={396} data={chartData} margin={{ top: 5, right: 20, left: 30, bottom: 35 }}>
        <XAxis dataKey="time" interval={2} angle={-45} textAnchor="end" height={60} />
        <YAxis domain={[5500, 8500]} tickFormatter={v => v.toLocaleString()} />
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
        <Line type="monotone" dataKey="Reprogramación" stroke={SERIES_COLORS.reprogramacion} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="Pronóstico Diario" stroke={SERIES_COLORS.pronostico} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="Rango Inferior" stroke={SERIES_COLORS.rangoInferior} strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="Rango Superior" stroke={SERIES_COLORS.rangoSuperior} strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="Demanda Real" stroke={SERIES_COLORS.demandaReal} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
        {peakPoint && (
          <ReferenceDot
            x={peakPoint.time}
            y={peakPoint.reprogramacion}
            r={5}
            fill={SERIES_COLORS.reprogramacion}
            stroke="#fff"
            strokeWidth={2}
            isFront
          >
            <Label content={<PeakLabel />} />
          </ReferenceDot>
        )}
      </LineChart>
    </div>
  );
};