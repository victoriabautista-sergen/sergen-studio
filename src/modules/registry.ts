import { TrendingUp, FileText, Calculator, Activity, Bot } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  basePath: string;
  color: string;
}

export const moduleRegistry: ModuleDefinition[] = [
  {
    id: "energy-prediction",
    name: "Predicción de Precios",
    description: "Pronóstico de precios de energía e indicadores de riesgo",
    icon: TrendingUp,
    basePath: "/modules/energy-prediction",
    color: "bg-sergen-orange/10 text-primary",
  },
  {
    id: "report-studio",
    name: "Report Studio",
    description: "Análisis de facturas y generación de reportes técnicos",
    icon: FileText,
    basePath: "/modules/report-studio",
    color: "bg-sergen-info/10 text-sergen-info",
  },
  {
    id: "billing-simulation",
    name: "Simulación de Facturación",
    description: "Simula facturación eléctrica y asigna costos por línea",
    icon: Calculator,
    basePath: "/modules/billing-simulation",
    color: "bg-sergen-success/10 text-sergen-success",
  },
  {
    id: "energy-monitoring",
    name: "Monitoreo Energético",
    description: "Visualización de consumo energético en tiempo real",
    icon: Activity,
    basePath: "/modules/energy-monitoring",
    color: "bg-sergen-warning/10 text-sergen-warning",
  },
  {
    id: "induvex-ai",
    name: "Induvex AI Assistant",
    description: "Asistente de ingeniería con IA para plantas industriales",
    icon: Bot,
    basePath: "/modules/induvex-ai",
    color: "bg-purple-100 text-purple-600",
  },
];
