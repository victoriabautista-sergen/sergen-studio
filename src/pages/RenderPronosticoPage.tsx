import { useEffect, useState } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { externalSupabase } from '@/modules/energy_intelligence/lib/externalSupabase';
import { DailyForecastChart } from '@/modules/energy_intelligence/components/forecast/DailyForecastChart';
import type { CoesData } from '@/modules/energy_intelligence/types';

declare global {
  interface Window {
    chartReady: boolean;
  }
}

const RenderPronosticoPage = () => {
  const [data, setData] = useState<CoesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const twoDaysAgo = subDays(today, 2);
        const startDate = startOfDay(twoDaysAgo).toISOString();
        const endDate = endOfDay(today).toISOString();

        const { data: forecastData, error } = await externalSupabase
          .from('coes_forecast')
          .select('fecha, reprogramado, pronostico, rango_inferior, rango_superior, ejecutado')
          .gte('fecha', startDate)
          .lte('fecha', endDate)
          .order('fecha', { ascending: true });

        if (error) {
          console.error('[ERROR]', error);
          return;
        }

        const records = (forecastData ?? []) as CoesData[];
        console.log('[DATA]', records.length, 'registros');

        if (records.length > 0) {
          setData(records);
          setReady(true);
        }
      } catch (err) {
        console.error('[ERROR]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (ready && data.length > 0) {
      console.log('[RENDER] chart listo');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log('[RENDER] chart listo (post-DOM)');
          window.chartReady = false;
        });
      });
    }
  }, [ready, data]);

  if (loading) {
    return (
      <div style={{ width: '100%', maxWidth: 800, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ width: '100%', maxWidth: 800, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <p>Sin datos disponibles</p>
      </div>
    );
  }

  return (
    <div id="chart-container" style={{ width: '100%', maxWidth: 800, paddingTop: 16, paddingLeft: 8, paddingRight: 8, paddingBottom: 8, background: '#fff' }}>
      <DailyForecastChart data={data} />
    </div>
  );
};

export default RenderPronosticoPage;
