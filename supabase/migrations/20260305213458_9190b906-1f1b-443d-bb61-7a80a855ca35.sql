
-- ===========================================
-- SERGEN ERP - Core Database Schema
-- ===========================================

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'client_user', 'technical_user');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client_user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- 4. Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  industry TEXT,
  energy_supply_info JSONB DEFAULT '{}',
  contract_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage clients" ON public.clients FOR ALL USING (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
);

-- 5. Client-user assignments
CREATE TABLE public.client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id)
);

ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments" ON public.client_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage assignments" ON public.client_users FOR ALL USING (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
);

-- 6. Modules registry
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view modules" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage modules" ON public.modules FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- 7. User-module access
CREATE TABLE public.user_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own modules" ON public.user_modules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage user modules" ON public.user_modules FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- 8. Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view reports for their clients" ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.client_users cu WHERE cu.client_id = reports.client_id AND cu.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
);

-- 9. Predictions table
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  prediction_date DATE NOT NULL,
  price_data JSONB DEFAULT '{}',
  risk_level TEXT,
  ai_explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view predictions" ON public.predictions FOR SELECT TO authenticated USING (true);

-- 10. Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number TEXT,
  period_start DATE,
  period_end DATE,
  total_amount NUMERIC(12,2),
  energy_kwh NUMERIC(12,2),
  demand_kw NUMERIC(12,2),
  invoice_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invoices for their clients" ON public.invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.client_users cu WHERE cu.client_id = invoices.client_id AND cu.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
);

-- 11. Meter data table
CREATE TABLE public.meter_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  meter_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  energy_kwh NUMERIC(12,4),
  demand_kw NUMERIC(12,4),
  power_factor NUMERIC(5,4),
  voltage NUMERIC(8,2),
  current_a NUMERIC(8,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meter_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view meter data for their clients" ON public.meter_data FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.client_users cu WHERE cu.client_id = meter_data.client_id AND cu.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
);

-- 12. AI sessions table
CREATE TABLE public.ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_slug TEXT,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI sessions" ON public.ai_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own AI sessions" ON public.ai_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI sessions" ON public.ai_sessions FOR UPDATE USING (auth.uid() = user_id);

-- 13. Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client_user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 14. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_sessions_updated_at BEFORE UPDATE ON public.ai_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Seed initial modules
INSERT INTO public.modules (slug, name, description, icon) VALUES
  ('energy-prediction', 'Predicción de Precios', 'Pronóstico de precios de energía e indicadores de riesgo', 'TrendingUp'),
  ('report-studio', 'Report Studio', 'Análisis de facturas y generación de reportes técnicos', 'FileText'),
  ('billing-simulation', 'Simulación de Facturación', 'Simula facturación eléctrica y asigna costos', 'Calculator'),
  ('energy-monitoring', 'Monitoreo Energético', 'Visualización de consumo energético en tiempo real', 'Activity'),
  ('induvex-ai', 'Induvex AI Assistant', 'Asistente de ingeniería con IA para plantas industriales', 'Bot');

-- 16. Indexes for performance
CREATE INDEX idx_meter_data_client_timestamp ON public.meter_data (client_id, timestamp DESC);
CREATE INDEX idx_reports_client ON public.reports (client_id);
CREATE INDEX idx_invoices_client ON public.invoices (client_id);
CREATE INDEX idx_ai_sessions_user ON public.ai_sessions (user_id);
CREATE INDEX idx_client_users_user ON public.client_users (user_id);
