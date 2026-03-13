
-- Allow super_admin to insert into forecast_settings
CREATE POLICY "super_admin_insert_forecast_settings"
ON public.forecast_settings
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to update forecast_settings
CREATE POLICY "super_admin_update_forecast_settings"
ON public.forecast_settings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
