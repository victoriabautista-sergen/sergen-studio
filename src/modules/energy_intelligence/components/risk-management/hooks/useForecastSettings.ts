import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ForecastSettings } from "../types";

export const useForecastSettings = () => {
  const [settings, setSettings] = useState<ForecastSettings>({
    risk_level: "MEDIO",
    modulation_time: "18:00 - 23:00"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('forecast_settings')
          .select('risk_level, modulation_time')
          .order('last_update', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching settings:', error);
          return;
        }

        if (data) {
          setSettings({
            risk_level: (data as any).risk_level || "MEDIO",
            modulation_time: (data as any).modulation_time || "18:00 - 23:00"
          });
        }
      } catch (error) {
        console.error('Error in fetchSettings:', error);
      }
    };

    fetchSettings();
  }, []);

  return settings;
};
