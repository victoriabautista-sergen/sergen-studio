export interface EnergyData {
  id: string;
  date: string;
  time: string;
  forecasted_power: number;
  executed_power: number;
  user_id: string;
  created_at?: string;
  demand?: number;
  consumption?: number;
  is_modulated?: boolean;
}
