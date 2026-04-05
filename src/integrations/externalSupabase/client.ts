import { createClient } from "@supabase/supabase-js";

export const externalSupabase = createClient(
  "https://fhumorwedybuhkpbvxzm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodW1vcndlZHlidWhrcGJ2eHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDU3NzYsImV4cCI6MjA5MDkyMTc3Nn0.-_IRubVlr0XysRJt2yADymDIpCP74IsQOCiZNzizMtk"
);
