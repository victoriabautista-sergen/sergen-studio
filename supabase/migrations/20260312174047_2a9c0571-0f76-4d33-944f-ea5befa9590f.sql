
-- 1. Fix infinite recursion on profiles: drop the recursive SELECT policies
DROP POLICY IF EXISTS "profiles_select_own_or_superadmin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_superadmin" ON public.profiles;

-- 2. Fix infinite recursion on plan_inquiries: drop recursive policies
DROP POLICY IF EXISTS "plan_inquiries_superadmin_select" ON public.plan_inquiries;
DROP POLICY IF EXISTS "plan_inquiries_superadmin_update" ON public.plan_inquiries;

-- 3. Add ruc column to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS ruc text;

-- 4. Create company_modules table
CREATE TABLE IF NOT EXISTS public.company_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  assigned_by uuid,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (company_id, module_id)
);

ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;

-- RLS for company_modules
CREATE POLICY "super_admin_manage_company_modules"
  ON public.company_modules FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "technical_user_view_company_modules"
  ON public.company_modules FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'technical_user'::app_role));

CREATE POLICY "admin_view_own_company_modules"
  ON public.company_modules FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND company_id = ANY(get_my_client_ids()));

CREATE POLICY "user_view_own_company_modules"
  ON public.company_modules FOR SELECT
  TO authenticated
  USING (company_id = ANY(get_my_client_ids()));
