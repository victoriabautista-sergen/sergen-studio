INSERT INTO public.modules (name, slug, description, icon, is_active)
VALUES ('Generador de Ladder', 'ladder_generator', 'Convierte lógica Structured Text (ST) a formato Ladder para PLCs.', 'Cable', true)
ON CONFLICT DO NOTHING;