import { useEffect, useState } from 'react';
import { ForecastChart } from '@/modules/energy_intelligence/components/forecast/ForecastChart';
import type { CoesData } from '@/modules/energy_intelligence/types';

const RenderPronosticoPage = () => {
  const [data, setData] = useState<CoesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[RENDER] Inicio del render de la página /render/pronostico');

    const fetchData = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const url = `https://${projectId}.supabase.co/functions/v1/get-chart-data`;

        console.log('[RENDER] Inicio de consulta a Supabase:', url);

        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
          },
        });

        console.log('[RENDER] Respuesta HTTP:', res.status, res.statusText);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        console.log('[RENDER] Datos recibidos desde Supabase:', json.data?.length ?? 0, 'registros');

        setData(json.data || []);
      } catch (err: any) {
        console.error('[RENDER] Error al obtener datos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && data.length > 0) {
      console.log('[RENDER] Render del gráfico completado con', data.length, 'puntos de datos');
    }
  }, [loading, data]);

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
