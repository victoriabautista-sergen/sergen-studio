
CREATE TABLE public.reportes_control_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  mes integer NOT NULL,
  anio integer NOT NULL,
  datos_generales jsonb DEFAULT '{}'::jsonb,
  hoja2_data jsonb DEFAULT '{}'::jsonb,
  hoja3_data jsonb DEFAULT '{}'::jsonb,
  hoja4_data jsonb DEFAULT '{}'::jsonb,
  hoja5_data jsonb DEFAULT '{}'::jsonb,
  hoja6_data jsonb DEFAULT '{}'::jsonb,
  hoja7_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.reportes_control_demanda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_reportes_cd"
  ON public.reportes_control_demanda
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_reportes_cd_updated_at
  BEFORE UPDATE ON public.reportes_control_demanda
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
