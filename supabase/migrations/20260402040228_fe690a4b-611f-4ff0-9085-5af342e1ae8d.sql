CREATE TABLE public.concesionaria_potencia_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concesionaria text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(concesionaria)
);

ALTER TABLE public.concesionaria_potencia_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_potencia_keywords" ON public.concesionaria_potencia_keywords
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "super_admin_manage_potencia_keywords" ON public.concesionaria_potencia_keywords
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_potencia_keywords_updated_at
  BEFORE UPDATE ON public.concesionaria_potencia_keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();