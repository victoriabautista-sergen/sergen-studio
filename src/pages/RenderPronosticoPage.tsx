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
        // Always bust cache to get fresh data
        const url = `https://${projectId}.supabase.co/functions/v1/get-chart-data?t=${Date.now()}`;

        console.log('[RENDER] Consultando datos frescos desde:', url);

        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });

        console.log('[RENDER] Respuesta HTTP:', res.status, res.statusText);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const records = json.data || [];
        console.log(`[RENDER] Datos recibidos: ${records.length} registros`);
        console.log(`[DATA] Fecha de datos: ${json.date || 'no reportada'}`);

        if (records.length > 0) {
          console.log(`[DATA] Primer registro: ${records[0].fecha}`);
          console.log(`[DATA] Último registro: ${records[records.length - 1].fecha}`);
        }

        setData(records);
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
      console.log('[RENDER] ✅ Render del gráfico completado con', data.length, 'puntos de datos');
      // Signal to Microlink that content is ready
      document.title = 'Chart Ready';
    } else if (!loading && data.length === 0) {
      console.log('[RENDER] ⚠️ No hay datos disponibles para el gráfico — NO se marca Chart Ready');
      // DO NOT set title to 'Chart Ready' — this prevents Microlink from capturing an empty chart
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
