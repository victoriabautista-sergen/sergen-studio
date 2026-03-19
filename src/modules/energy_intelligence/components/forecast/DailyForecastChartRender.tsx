import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

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

/**
 * Static, deterministic chart component for image capture.
 * No tooltips, legends, animations, or interactive elements.
 * Fixed dimensions, white background, controlled padding.
 */
export const DailyForecastChartRender = ({ data }: DailyForecastChartRenderProps) => {
  const formatTime = (dateStr: string) => dateStr.split('T')[1]?.substring(0, 5) ?? dateStr;

  const processedData = data.map(item => ({
    fecha: item.fecha,
    pronostico: item.pronostico,
    rango_inferior: item.rango_inferior,
    rango_superior: item.rango_superior,
    reprogramado: item.reprogramado,
    ejecutado: item.ejecutado,
  }));

  return (
    <div style={{ width: 800, height: 400, background: '#ffffff', padding: '16px 8px 8px 8px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="fecha" tickFormatter={formatTime} />
          <YAxis domain={['auto', 'auto']} />
          <Line type="monotone" dataKey="rango_inferior" stroke="#00C000" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="rango_superior" stroke="#00C000" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="pronostico" stroke="#F97316" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="reprogramado" stroke="#C00000" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="ejecutado" stroke="#0036A2" strokeWidth={2.5} dot={false} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
