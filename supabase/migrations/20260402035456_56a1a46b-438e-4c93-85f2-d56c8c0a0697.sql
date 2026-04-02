UPDATE modulation_days SET is_modulated = false WHERE date IN ('2026-02-17', '2026-02-25');
UPDATE modulation_days SET is_modulated = true WHERE date = '2026-02-19';