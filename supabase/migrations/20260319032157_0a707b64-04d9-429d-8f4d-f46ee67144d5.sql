CREATE POLICY "anon_read_coes_forecast"
ON public.coes_forecast
FOR SELECT
TO anon
USING (true);