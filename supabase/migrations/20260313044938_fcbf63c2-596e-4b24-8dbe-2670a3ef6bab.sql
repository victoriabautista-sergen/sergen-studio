
-- Allow super_admin to INSERT into modulation_days
CREATE POLICY "super_admin_insert_modulation_days"
ON public.modulation_days
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to UPDATE modulation_days
CREATE POLICY "super_admin_update_modulation_days"
ON public.modulation_days
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to DELETE modulation_days
CREATE POLICY "super_admin_delete_modulation_days"
ON public.modulation_days
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
