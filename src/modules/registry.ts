import { Zap, Receipt, Bot, Shield, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  basePath: string;
  color: string;
  gradient: string;
  category: string;
  submodules?: string[];
  illustration?: string;
}

/**
 * Registry of the 4 main user-facing modules.
 * Internally each may contain submodules for scalability.
 */
export const moduleRegistry: ModuleDefinition[] = [
  {
    id: "energy-intelligence",
    name: "Control de Demanda",
    description: "Predicción de potencia y monitoreo del consumo en hora punta.",
    icon: Zap,
    basePath: "/energy-intelligence/control",
    color: "bg-sergen-orange/10 text-primary",
    gradient: "from-orange-400 via-orange-500 to-red-400",
    category: "INTELIGENCIA ENERGÉTICA",
    submodules: ["control", "forecast", "historico", "reportes", "configuracion"],
  },
  {
    id: "billing-optimization",
    name: "Billing Optimization",
    description: "Optimización de costos eléctricos, simulación tarifaria y análisis de facturación.",
    icon: Receipt,
    basePath: "/modules/billing-optimization",
    color: "bg-sergen-info/10 text-sergen-info",
    gradient: "from-sky-400 via-blue-500 to-indigo-500",
    category: "INTELIGENCIA ENERGÉTICA",
    submodules: ["report_studio", "billing_simulation"],
  },
  {
    id: "induvex",
    name: "Induvex – Engineering Assistant",
    description: "Asistente de ingeniería para diagnóstico técnico y soporte de planta.",
    icon: Bot,
    basePath: "/modules/induvex",
    color: "bg-purple-100 text-purple-600",
    gradient: "from-fuchsia-500 via-purple-500 to-violet-600",
    category: "INGENIERÍA",
  },
  {
    id: "company-management",
    name: "Gestión de Empresa",
    description: "Administración de usuarios, configuración de empresa y permisos de módulos.",
    icon: Building2,
    basePath: "/company-management",
    color: "bg-teal-100 text-teal-600",
    gradient: "from-teal-400 via-cyan-500 to-blue-400",
    category: "INGENIERÍA",
    submodules: ["info", "users", "permissions", "requests"],
  },
  {
    id: "admin-panel",
    name: "SERGEN Admin Panel",
    description: "Gestión de usuarios, clientes, roles y configuración de la plataforma.",
    icon: Shield,
    basePath: "/admin-panel",
    color: "bg-sergen-dark/10 text-sergen-dark",
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
    category: "ADMINISTRACIÓN",
    submodules: ["clients", "users", "settings"],
  },
];
