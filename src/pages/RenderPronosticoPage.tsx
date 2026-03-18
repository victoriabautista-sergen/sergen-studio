import { useEffect, useState } from 'react';
import { ForecastChart } from '@/modules/energy_intelligence/components/forecast/ForecastChart';
import type { CoesData } from '@/modules/energy_intelligence/types';

const RenderPronosticoPage = () => {
  const [data, setData] = useState<CoesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Add no-cache meta tags for Microlink / browsers
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta);

    const pragma = document.createElement('meta');
    pragma.httpEquiv = 'Pragma';
    pragma.content = 'no-cache';
    document.head.appendChild(pragma);

    console.log('[RENDER] Inicio: /render/pronostico — timestamp:', Date.now());

    const fetchData = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const url = `https://${projectId}.supabase.co/functions/v1/get-chart-data?t=${Date.now()}`;

        console.log('[RENDER] Fetching:', url);

        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });

        console.log('[RENDER] HTTP:', res.status);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const records = json.data || [];
        console.log(`[DATA] Fecha: ${json.date || 'N/A'}, registros: ${records.length}`);

        if (records.length > 0) {
          console.log(`[DATA] Primer registro: ${records[0].fecha}`);
          console.log(`[DATA] Último registro: ${records[records.length - 1].fecha}`);
        }

        if (json.settings) {
          console.log(`[DATA] Settings: risk=${json.settings.risk_level}, time=${json.settings.modulation_time}`);
        }

        setData(records);
      } catch (err: any) {
        console.error('[RENDER] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      document.head.removeChild(meta);
      document.head.removeChild(pragma);
    };
  }, []);

  useEffect(() => {
    if (!loading && data.length > 0) {
      console.log(`[RENDER] ✅ Chart Ready — ${data.length} puntos`);
      document.title = 'Chart Ready';
    } else if (!loading && data.length === 0) {
      console.log('[RENDER] ⚠️ Sin datos — NO se marca Chart Ready');
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
