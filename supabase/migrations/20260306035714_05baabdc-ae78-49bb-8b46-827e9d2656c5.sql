-- 1) plan_inquiries table (create if missing and enforce requested shape)
CREATE TABLE IF NOT EXISTS public.plan_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  company_name text NOT NULL,
  position text,
  email text NOT NULL,
  phone text,
  plan_selected text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_inquiries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.plan_inquiries
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS plan_selected text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.plan_inquiries
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN company_name SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN plan_selected SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN created_at SET DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'plan_inquiries_plan_selected_check'
      AND conrelid = 'public.plan_inquiries'::regclass
  ) THEN
    ALTER TABLE public.plan_inquiries
      ADD CONSTRAINT plan_inquiries_plan_selected_check
      CHECK (plan_selected IN ('basic', 'advanced'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'plan_inquiries_status_check'
      AND conrelid = 'public.plan_inquiries'::regclass
  ) THEN
    ALTER TABLE public.plan_inquiries
      ADD CONSTRAINT plan_inquiries_status_check
      CHECK (status IN ('pending', 'contacted', 'rejected'));
  END IF;
END $$;

-- Optional hard validation trigger (idempotent)
CREATE OR REPLACE FUNCTION public.validate_plan_inquiry_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'contacted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;

  IF NEW.plan_selected NOT IN ('basic', 'advanced') THEN
    RAISE EXCEPTION 'Invalid plan_selected: %', NEW.plan_selected;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_plan_inquiry_status ON public.plan_inquiries;
CREATE TRIGGER trg_validate_plan_inquiry_status
BEFORE INSERT OR UPDATE ON public.plan_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.validate_plan_inquiry_status();

-- 2) profiles table (create if missing) + requested columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'user',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'user',
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('superadmin', 'company_admin', 'user'));
  END IF;
END $$;

-- Align existing records so id can represent auth user id when user_id exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'user_id'
  ) THEN
    UPDATE public.profiles p
    SET id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND p.id <> p.user_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles p2
        WHERE p2.id = p.user_id
      )
      AND EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = p.user_id
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Keep signup trigger compatible with current profiles schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    'user',
    true
  )
  ON CONFLICT (id)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    role = COALESCE(public.profiles.role, 'user'),
    is_active = COALESCE(public.profiles.is_active, true);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client_user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3) RLS policies requested
DROP POLICY IF EXISTS "Anyone can submit plan inquiry" ON public.plan_inquiries;
DROP POLICY IF EXISTS "Super admins can view inquiries" ON public.plan_inquiries;
DROP POLICY IF EXISTS "Super admins can update inquiries" ON public.plan_inquiries;
DROP POLICY IF EXISTS "plan_inquiries_public_insert" ON public.plan_inquiries;
DROP POLICY IF EXISTS "plan_inquiries_superadmin_select" ON public.plan_inquiries;
DROP POLICY IF EXISTS "plan_inquiries_superadmin_update" ON public.plan_inquiries;

CREATE POLICY "plan_inquiries_public_insert"
ON public.plan_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "plan_inquiries_superadmin_select"
ON public.plan_inquiries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
  )
);

CREATE POLICY "plan_inquiries_superadmin_update"
ON public.plan_inquiries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
  )
);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_superadmin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_superadmin" ON public.profiles;

CREATE POLICY "profiles_select_own_or_superadmin"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
  )
);

CREATE POLICY "profiles_update_superadmin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
  )
);