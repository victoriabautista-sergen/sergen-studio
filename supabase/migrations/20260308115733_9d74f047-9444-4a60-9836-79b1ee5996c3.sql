CREATE TABLE public.coes_demand_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date timestamp with time zone NOT NULL,
  executed_power numeric,
  daily_forecast numeric,
  weekly_forecast numeric,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.coes_demand_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read coes_demand_data"
  ON public.coes_demand_data FOR SELECT TO authenticated
  USING (true);

CREATE UNIQUE INDEX coes_demand_data_date_idx ON public.coes_demand_data (date);