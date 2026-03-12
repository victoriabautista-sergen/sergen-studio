
-- Tables required for Energy Intelligence module

-- COES Forecast data (pronóstico de demanda)
CREATE TABLE IF NOT EXISTS public.coes_forecast (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha timestamptz NOT NULL,
  reprogramado numeric,
  pronostico numeric,
  rango_inferior numeric,
  rango_superior numeric,
  ejecutado numeric,
  created_at timestamptz DEFAULT now()
);

-- Forecast settings (configuración de riesgo y modulación)
CREATE TABLE IF NOT EXISTS public.forecast_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_level text DEFAULT 'MEDIO',
  modulation_time text DEFAULT '18:00 - 23:00',
  last_update timestamptz DEFAULT now()
);

-- Modulation days (calendario de días modulados)
CREATE TABLE IF NOT EXISTS public.modulation_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  is_modulated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coes_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulation_days ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read all energy data
CREATE POLICY "Authenticated users can read coes_forecast" ON public.coes_forecast FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read forecast_settings" ON public.forecast_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read modulation_days" ON public.modulation_days FOR SELECT TO authenticated USING (true);

-- Insert default forecast settings
INSERT INTO public.forecast_settings (risk_level, modulation_time) VALUES ('MEDIO', '18:00 - 23:00');
