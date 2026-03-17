import { useEffect, useState } from 'react';
import { ForecastChart } from '@/modules/energy_intelligence/components/forecast/ForecastChart';
import type { CoesData } from '@/modules/energy_intelligence/types';

/**
 * Public page that renders ONLY the ForecastChart with current data.
 * Used by the screenshot service to capture the chart image for emails/Telegram.
 * Route: /render/pronostico
 */
const RenderPronosticoPage = () => {
  const [data, setData] = useState<CoesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/get-chart-data`,
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
            },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data || []);
      } catch (err: any) {
        console.error('Error fetching chart data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ width: 800, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div style={{ width: 800, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <p>{error || 'No hay datos disponibles'}</p>
      </div>
    );
  }

  return (
    <div id="chart-container" style={{ width: 800, paddingTop: 32, paddingLeft: 16, paddingRight: 16, paddingBottom: 16, background: '#fff' }}>
      <ForecastChart data={data} showPeakLabel={true} />
    </div>
  );
};

export default RenderPronosticoPage;
