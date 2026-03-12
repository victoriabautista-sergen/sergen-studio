import { createClient } from "@supabase/supabase-js";

export const externalSupabase = createClient(
  "https://lilpphvhjwwizjqalxil.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbHBwaHZoand3aXpqcWFseGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTA3NzAsImV4cCI6MjA4ODU2Njc3MH0.chQtloYldM0Cb-mbBM6eDIvr2Tj0u0awKFzWIxJuo0U"
);
