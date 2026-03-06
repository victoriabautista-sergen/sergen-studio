DROP POLICY IF EXISTS "plan_inquiries_public_insert" ON public.plan_inquiries;

CREATE POLICY "plan_inquiries_public_insert"
ON public.plan_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(full_name)) > 0
  AND length(trim(company_name)) > 0
  AND length(trim(email)) > 0
  AND plan_selected IN ('basic', 'advanced')
  AND status IN ('pending', 'contacted', 'rejected')
);