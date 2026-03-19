import { useEffect, useState } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { externalSupabase } from '@/modules/energy_intelligence/lib/externalSupabase';
import { DailyForecastChartRender } from '@/modules/energy_intelligence/components/forecast/DailyForecastChartRender';

declare global {
  interface Window {
    chartReady: boolean;
  }
}

interface ForecastRecord {
  fecha: string;
  reprogramado: number | null;
  pronostico: number | null;
  rango_inferior: number | null;
  rango_superior: number | null;
  ejecutado: number | null;
}

const RenderPronosticoPage = () => {
  const [data, setData] = useState<ForecastRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.chartReady = false;
    console.log('[RENDER] cargando data');

    const fetchData = async () => {
      try {
        const today = new Date();
        const twoDaysAgo = subDays(today, 2);
        const startDate = startOfDay(twoDaysAgo).toISOString();
        const endDate = endOfDay(today).toISOString();

        const { data: forecastData, error: fetchError } = await externalSupabase
          .from('coes_forecast')
          .select('fecha, reprogramado, pronostico, rango_inferior, rango_superior, ejecutado')
          .gte('fecha', startDate)
          .lte('fecha', endDate)
          .order('fecha', { ascending: true });

        if (fetchError) {
          console.error('[RENDER][ERROR]', fetchError);
          setError(fetchError.message);
          return;
        }

        const records = (forecastData ?? []) as ForecastRecord[];
        console.log('[RENDER] data lista', records.length, 'registros');

        if (records.length > 0) {
          setData(records);
        } else {
          setError('Sin datos disponibles');
        }
      } catch (err) {
        console.error('[RENDER][ERROR]', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Signal chart ready after data renders + 500ms stabilization
  // Adds a DOM marker (#chart-ready) that Microlink can detect via waitForSelector
  useEffect(() => {
    if (!loading && data.length > 0) {
      const timer = setTimeout(() => {
        window.chartReady = true;
        console.log('[RENDER] chart listo');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, data]);

  if (loading) {
    return (
      <div style={{ width: 800, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div style={{ width: 800, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <p>{error || 'Sin datos disponibles'}</p>
      </div>
    );
  }

  return (
    <div id="chart-container" style={{ background: '#fff' }}>
      <DailyForecastChartRender data={data} />
      {/* DOM marker for Microlink waitForSelector - only rendered when chart is truly ready */}
      <div id="chart-ready" style={{ display: 'none' }} />
    </div>
  );
};

export default RenderPronosticoPage;
