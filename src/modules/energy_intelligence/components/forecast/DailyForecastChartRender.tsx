import { LineChart, Line, XAxis, YAxis, ReferenceArea } from 'recharts';

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

  // Exact same sort as ForecastChart
  const sortedData = [...data].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  // Exact same lastRealDemandIndex logic
  let lastRealDemandIndex = -1;
  for (let i = 0; i < sortedData.length; i++) {
    if (!isNullOrZero(sortedData[i].ejecutado)) lastRealDemandIndex = i;
  }

  // Exact same chartData transformation
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

  console.log('[RENDER] registros:', chartData.length);
  if (chartData.length > 0) {
    console.log('[RENDER] primer dato:', chartData[0]);
    console.log('[RENDER] último dato:', chartData[chartData.length - 1]);
  }

  return (
    <div style={{ width: 800, height: 400, background: '#ffffff', padding: '16px 8px 8px 8px' }}>
      <LineChart width={784} height={376} data={chartData} margin={{ top: 5, right: 30, left: 50, bottom: 35 }}>
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
      </LineChart>
    </div>
  );
};
