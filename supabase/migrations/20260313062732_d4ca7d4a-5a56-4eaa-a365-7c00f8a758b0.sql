
CREATE TABLE public.alert_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID NOT NULL,
  UNIQUE (email)
);

ALTER TABLE public.alert_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_select_alert_recipients"
  ON public.alert_recipients FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'technical_user'::app_role)
  );

CREATE POLICY "super_admin_insert_alert_recipients"
  ON public.alert_recipients FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "super_admin_delete_alert_recipients"
  ON public.alert_recipients FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
  );
