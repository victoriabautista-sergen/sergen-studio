export interface CoesData {
  fecha: string;
  reprogramado: number | null;
  pronostico: number | null;
  rango_inferior: number | null;
  rango_superior: number | null;
  ejecutado: number | null;
}

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

export interface ForecastSettings {
  risk_level: string;
  modulation_time: string;
}

export interface ModulationDay {
  date: string;
  is_modulated: boolean;
}

export interface PowerData {
  fecha: string;
  ejecutado: number;
}

export interface ChartData {
  date: string;
  value: number;
  fullDate: string;
  color: string;
  hora?: number;
  minuto?: number;
}

export interface Document {
  id: string;
  filename: string;
  file_path: string;
  created_at: string;
}

export type DocumentType = 'invoice' | 'contract' | 'report';
