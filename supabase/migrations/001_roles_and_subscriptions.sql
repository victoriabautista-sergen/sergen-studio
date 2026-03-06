-- =============================================================================
-- MIGRATION 001: Roles, Subscriptions & RLS
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SUBSCRIPTIONS TABLE (new)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan        TEXT        NOT NULL CHECK (plan IN ('basic', 'advanced')),
  status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  start_date  DATE        NOT NULL,
  end_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. MODULES TABLE — seed with the 4 platform modules (idempotent, no conflict dependency)
-- ---------------------------------------------------------------------------
INSERT INTO public.modules (id, slug, name, description, is_active)
SELECT gen_random_uuid(), v.slug, v.name, v.description, true
FROM (VALUES
  ('energy-intelligence',  'Energy Intelligence',            'Predicción de precios y monitoreo de consumo'),
  ('billing-optimization', 'Billing Optimization',           'Análisis de facturación y simulación de costos'),
  ('induvex',              'Induvex – Engineering Assistant','Asistente de IA para ingeniería industrial'),
  ('admin-panel',          'SERGEN Admin Panel',             'Gestión de usuarios, clientes y configuración')
) AS v(slug, name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.modules WHERE slug = v.slug
);

-- ---------------------------------------------------------------------------
-- 3. HELPER FUNCTION: get_my_client_ids()
--    Returns all client IDs the current user belongs to.
--    SECURITY DEFINER so it bypasses RLS when called inside RLS policies.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_client_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY(SELECT client_id FROM public.client_users WHERE user_id = auth.uid()),
    '{}'::UUID[]
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. RLS — SUBSCRIPTIONS
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sergen_see_all_subscriptions"       ON public.subscriptions;
DROP POLICY IF EXISTS "company_user_see_own_subscription"  ON public.subscriptions;
DROP POLICY IF EXISTS "super_admin_insert_subscription"    ON public.subscriptions;
DROP POLICY IF EXISTS "super_admin_update_subscription"    ON public.subscriptions;
DROP POLICY IF EXISTS "super_admin_delete_subscription"    ON public.subscriptions;

CREATE POLICY "sergen_see_all_subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    has_role(_user_id => auth.uid(), _role => 'super_admin') OR
    has_role(_user_id => auth.uid(), _role => 'technical_user')
  );

CREATE POLICY "company_user_see_own_subscription"
  ON public.subscriptions FOR SELECT
  USING (
    client_id = ANY(get_my_client_ids())
  );

CREATE POLICY "super_admin_insert_subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (has_role(_user_id => auth.uid(), _role => 'super_admin'));

CREATE POLICY "super_admin_update_subscription"
  ON public.subscriptions FOR UPDATE
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));

CREATE POLICY "super_admin_delete_subscription"
  ON public.subscriptions FOR DELETE
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));

-- ---------------------------------------------------------------------------
-- 5. RLS — CLIENTS
-- ---------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sergen_see_all_clients"    ON public.clients;
DROP POLICY IF EXISTS "company_user_see_own_client" ON public.clients;
DROP POLICY IF EXISTS "super_admin_insert_client"   ON public.clients;
DROP POLICY IF EXISTS "super_admin_update_client"   ON public.clients;
DROP POLICY IF EXISTS "admin_update_own_client"     ON public.clients;
DROP POLICY IF EXISTS "super_admin_delete_client"   ON public.clients;

CREATE POLICY "sergen_see_all_clients"
  ON public.clients FOR SELECT
  USING (
    has_role(_user_id => auth.uid(), _role => 'super_admin') OR
    has_role(_user_id => auth.uid(), _role => 'technical_user')
  );

CREATE POLICY "company_user_see_own_client"
  ON public.clients FOR SELECT
  USING (id = ANY(get_my_client_ids()));

CREATE POLICY "super_admin_insert_client"
  ON public.clients FOR INSERT
  WITH CHECK (has_role(_user_id => auth.uid(), _role => 'super_admin'));

CREATE POLICY "super_admin_update_client"
  ON public.clients FOR UPDATE
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));

CREATE POLICY "admin_update_own_client"
  ON public.clients FOR UPDATE
  USING (
    has_role(_user_id => auth.uid(), _role => 'admin') AND
    id = ANY(get_my_client_ids())
  );

CREATE POLICY "super_admin_delete_client"
  ON public.clients FOR DELETE
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));

-- ---------------------------------------------------------------------------
-- 6. RLS — PROFILES
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sergen_see_all_profiles"         ON public.profiles;
DROP POLICY IF EXISTS "user_see_own_profile"            ON public.profiles;
DROP POLICY IF EXISTS "admin_see_company_profiles"      ON public.profiles;
DROP POLICY IF EXISTS "super_admin_insert_profile"      ON public.profiles;
DROP POLICY IF EXISTS "admin_insert_company_profile"    ON public.profiles;
DROP POLICY IF EXISTS "user_update_own_profile"         ON public.profiles;
DROP POLICY IF EXISTS "super_admin_update_any_profile"  ON public.profiles;
DROP POLICY IF EXISTS "admin_update_company_profile"    ON public.profiles;
DROP POLICY IF EXISTS "super_admin_delete_profile"      ON public.profiles;

CREATE POLICY "sergen_see_all_profiles"
  ON public.profiles FOR SELECT
  USING (
    has_role(_user_id => auth.uid(), _role => 'super_admin') OR
    has_role(_user_id => auth.uid(), _role => 'technical_user')
  );

CREATE POLICY "user_see_own_profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admin_see_company_profiles"
  ON public.profiles FOR SELECT
  USING (
    has_role(_user_id => auth.uid(), _role => 'admin') AND
    user_id IN (
      SELECT cu.user_id FROM public.client_users cu
      WHERE cu.client_id = ANY(get_my_client_ids())
    )
  );

CREATE POLICY "super_admin_insert_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (has_role(_user_id => auth.uid(), _role => 'super_admin'));

CREATE POLICY "admin_insert_company_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    has_role(_user_id => auth.uid(), _role => 'admin') AND
    user_id IN (
      SELECT cu.user_id FROM public.client_users cu
      WHERE cu.client_id = ANY(get_my_client_ids())
    )
  );

-- Users can update their own profile but NOT the role field (enforced at app level)
CREATE POLICY "user_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "super_admin_update_any_profile"
  ON public.profiles FOR UPDATE
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));

CREATE POLICY "admin_update_company_profile"
  ON public.profiles FOR UPDATE
  USING (
    has_role(_user_id => auth.uid(), _role => 'admin') AND
    user_id IN (
      SELECT cu.user_id FROM public.client_users cu
      WHERE cu.client_id = ANY(get_my_client_ids())
    )
  );

CREATE POLICY "super_admin_delete_profile"
  ON public.profiles FOR DELETE
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));

-- ---------------------------------------------------------------------------
-- 7. RLS — CLIENT_USERS
-- ---------------------------------------------------------------------------
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sergen_see_all_client_users"    ON public.client_users;
DROP POLICY IF EXISTS "admin_see_company_client_users" ON public.client_users;
DROP POLICY IF EXISTS "user_see_own_client_users"      ON public.client_users;
DROP POLICY IF EXISTS "super_admin_insert_client_user" ON public.client_users;
DROP POLICY IF EXISTS "admin_insert_client_user"       ON public.client_users;
DROP POLICY IF EXISTS "super_admin_update_client_user" ON public.client_users;
DROP POLICY IF EXISTS "super_admin_delete_client_user" ON public.client_users;
DROP POLICY IF EXISTS "admin_delete_client_user"       ON public.client_users;

CREATE POLICY "sergen_see_all_client_users"
  ON public.client_users FOR SELECT
  USING (
    has_role(_user_id => auth.uid(), _role => 'super_admin') OR
    has_role(_user_id => auth.uid(), _role => 'technical_user')
  );

CREATE POLICY "admin_see_company_client_users"
  ON public.client_users FOR SELECT
  USING (
    has_role(_user_id => auth.uid(), _role => 'admin') AND
    client_id = ANY(get_my_client_ids())
  );

CREATE POLICY "user_see_own_client_users"
  ON public.client_users FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "super_admin_insert_client_user"
  ON public.client_users FOR INSERT
  WITH CHECK (has_role(_user_id => auth.uid(), _role => 'super_admin'));

CREATE POLICY "admin_insert_client_user"
  ON public.client_users FOR INSERT
  WITH CHECK (
    has_role(_user_id => auth.uid(), _role => 'admin') AND
    client_id = ANY(get_my_client_ids())
  );

CREATE POLICY "super_admin_update_client_user"
  ON public.client_users FOR UPDATE
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));

CREATE POLICY "super_admin_delete_client_user"
  ON public.client_users FOR DELETE
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));

CREATE POLICY "admin_delete_client_user"
  ON public.client_users FOR DELETE
  USING (
    has_role(_user_id => auth.uid(), _role => 'admin') AND
    client_id = ANY(get_my_client_ids())
  );

-- ---------------------------------------------------------------------------
-- 8. RLS — USER_ROLES
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sergen_see_all_user_roles"   ON public.user_roles;
DROP POLICY IF EXISTS "admin_see_company_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_see_own_role"            ON public.user_roles;
DROP POLICY IF EXISTS "super_admin_insert_role"      ON public.user_roles;
DROP POLICY IF EXISTS "admin_insert_client_user_role" ON public.user_roles;
DROP POLICY IF EXISTS "super_admin_update_role"      ON public.user_roles;
DROP POLICY IF EXISTS "super_admin_delete_role"      ON public.user_roles;

CREATE POLICY "sergen_see_all_user_roles"
  ON public.user_roles FOR SELECT
  USING (
    has_role(_user_id => auth.uid(), _role => 'super_admin') OR
    has_role(_user_id => auth.uid(), _role => 'technical_user')
  );

CREATE POLICY "admin_see_company_user_roles"
  ON public.user_roles FOR SELECT
  USING (
    has_role(_user_id => auth.uid(), _role => 'admin') AND
    user_id IN (
      SELECT cu.user_id FROM public.client_users cu
      WHERE cu.client_id = ANY(get_my_client_ids())
    )
  );

CREATE POLICY "user_see_own_role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "super_admin_insert_role"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role(_user_id => auth.uid(), _role => 'super_admin'));

-- Admin can only assign client_user role within their company
CREATE POLICY "admin_insert_client_user_role"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    has_role(_user_id => auth.uid(), _role => 'admin') AND
    role = 'client_user' AND
    user_id IN (
      SELECT cu.user_id FROM public.client_users cu
      WHERE cu.client_id = ANY(get_my_client_ids())
    )
  );

-- super_admin can update any role except their own (safety guard)
CREATE POLICY "super_admin_update_role"
  ON public.user_roles FOR UPDATE
  USING (
    has_role(_user_id => auth.uid(), _role => 'super_admin') AND
    user_id <> auth.uid()
  );

CREATE POLICY "super_admin_delete_role"
  ON public.user_roles FOR DELETE
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));

-- ---------------------------------------------------------------------------
-- 9. RLS — USER_MODULES
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sergen_all_user_modules"        ON public.user_modules;
DROP POLICY IF EXISTS "admin_manage_company_modules"   ON public.user_modules;
DROP POLICY IF EXISTS "user_see_own_modules"           ON public.user_modules;

CREATE POLICY "sergen_all_user_modules"
  ON public.user_modules FOR ALL
  USING (
    has_role(_user_id => auth.uid(), _role => 'super_admin') OR
    has_role(_user_id => auth.uid(), _role => 'technical_user')
  );

CREATE POLICY "admin_manage_company_modules"
  ON public.user_modules FOR ALL
  USING (
    has_role(_user_id => auth.uid(), _role => 'admin') AND
    user_id IN (
      SELECT cu.user_id FROM public.client_users cu
      WHERE cu.client_id = ANY(get_my_client_ids())
    )
  );

CREATE POLICY "user_see_own_modules"
  ON public.user_modules FOR SELECT
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 10. RLS — MODULES (catalog, read-only for all authenticated users)
-- ---------------------------------------------------------------------------
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_see_modules" ON public.modules;
DROP POLICY IF EXISTS "super_admin_manage_modules" ON public.modules;

CREATE POLICY "authenticated_see_modules"
  ON public.modules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "super_admin_manage_modules"
  ON public.modules FOR ALL
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));

-- ---------------------------------------------------------------------------
-- 11. RLS — PLAN_INQUIRIES
-- ---------------------------------------------------------------------------
ALTER TABLE public.plan_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sergen_see_plan_inquiries"    ON public.plan_inquiries;
DROP POLICY IF EXISTS "public_insert_plan_inquiry"   ON public.plan_inquiries;
DROP POLICY IF EXISTS "super_admin_update_inquiry"   ON public.plan_inquiries;

CREATE POLICY "sergen_see_plan_inquiries"
  ON public.plan_inquiries FOR SELECT
  USING (
    has_role(_user_id => auth.uid(), _role => 'super_admin') OR
    has_role(_user_id => auth.uid(), _role => 'technical_user')
  );

CREATE POLICY "public_insert_plan_inquiry"
  ON public.plan_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "super_admin_update_inquiry"
  ON public.plan_inquiries FOR UPDATE
  USING (has_role(_user_id => auth.uid(), _role => 'super_admin'));
