CREATE TABLE IF NOT EXISTS public.alert_send_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  risk_level TEXT NOT NULL,
  modulation_time TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'web', 'system')),
  sent_by_chat_id BIGINT,
  sent_by_user_id UUID,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_send_history_sent_date ON public.alert_send_history (sent_date DESC);
CREATE INDEX IF NOT EXISTS idx_alert_send_history_sent_at ON public.alert_send_history (sent_at DESC);

ALTER TABLE public.alert_send_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sergen_view_alert_history"
  ON public.alert_send_history
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'technical_user'::app_role)
  );

CREATE POLICY "service_role_insert_alert_history"
  ON public.alert_send_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "super_admin_insert_alert_history"
  ON public.alert_send_history
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));