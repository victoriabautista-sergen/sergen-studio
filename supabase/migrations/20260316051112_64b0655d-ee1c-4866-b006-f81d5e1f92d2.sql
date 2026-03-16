
-- Bot conversation state (singleton per chat)
CREATE TABLE public.telegram_bot_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL UNIQUE,
  alerta_enviada_hoy boolean NOT NULL DEFAULT false,
  estado_conversacion text NOT NULL DEFAULT 'inicio',
  riesgo_actual text,
  rango_actual text,
  update_offset bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_bot_state" ON public.telegram_bot_state
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authorized chat IDs
CREATE TABLE public.telegram_authorized_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL UNIQUE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_authorized_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_manage_authorized_chats" ON public.telegram_authorized_chats
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "service_role_read_authorized_chats" ON public.telegram_authorized_chats
  FOR SELECT TO service_role USING (true);
