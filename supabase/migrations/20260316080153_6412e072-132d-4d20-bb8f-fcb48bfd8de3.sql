
ALTER TABLE public.telegram_bot_state
  ADD COLUMN IF NOT EXISTS actualizacion_en_proceso boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS usuario_actualizando text,
  ADD COLUMN IF NOT EXISTS timestamp_actualizacion timestamp with time zone;
