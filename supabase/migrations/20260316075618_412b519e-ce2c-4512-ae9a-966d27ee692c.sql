
ALTER TABLE public.telegram_bot_state
  ADD COLUMN IF NOT EXISTS correo_enviado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS modo_conversacion text;
