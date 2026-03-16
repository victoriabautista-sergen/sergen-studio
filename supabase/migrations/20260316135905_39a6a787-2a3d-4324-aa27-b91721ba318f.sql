-- Add recipient_type column to unify TO and BCC in one table
ALTER TABLE public.alert_recipients
ADD COLUMN recipient_type text NOT NULL DEFAULT 'to';

-- Add a validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_recipient_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.recipient_type NOT IN ('to', 'bcc') THEN
    RAISE EXCEPTION 'Invalid recipient_type: %', NEW.recipient_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_recipient_type
BEFORE INSERT OR UPDATE ON public.alert_recipients
FOR EACH ROW EXECUTE FUNCTION public.validate_recipient_type();