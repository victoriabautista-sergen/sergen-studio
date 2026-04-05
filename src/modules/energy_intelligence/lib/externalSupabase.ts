import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = 'https://fhumorwedybuhkpbvxzm.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodW1vcndlZHlidWhrcGJ2eHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDU3NzYsImV4cCI6MjA5MDkyMTc3Nn0.-_IRubVlr0XysRJt2yADymDIpCP74IsQOCiZNzizMtk';

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);
