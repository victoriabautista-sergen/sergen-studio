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
}

/**
 * Registry of the 4 main user-facing modules.
 * Internally each may contain submodules for scalability.
 */
export const moduleRegistry: ModuleDefinition[] = [
  {
    id: "energy-intelligence",
    name: "Control de Demanda",
    description: "Predicción de precios de energía y monitoreo de consumo en tiempo real",
    icon: Zap,
    basePath: "/energy-intelligence/control",
    color: "bg-sergen-orange/10 text-primary",
    submodules: ["control", "forecast", "historico", "reportes", "configuracion"],
  },
  {
    id: "billing-optimization",
    name: "Billing Optimization",
    description: "Análisis de facturación, simulación de costos y reportes técnicos",
    icon: Receipt,
    basePath: "/modules/billing-optimization",
    color: "bg-sergen-info/10 text-sergen-info",
    submodules: ["report_studio", "billing_simulation"],
  },
  {
    id: "induvex",
    name: "Induvex – Engineering Assistant",
    description: "Asistente de IA para ingeniería industrial y soporte técnico de planta",
    icon: Bot,
    basePath: "/modules/induvex",
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "company-management",
    name: "Gestión de Empresa",
    description: "Administración de información, usuarios, permisos y solicitudes de tu empresa",
    icon: Building2,
    basePath: "/company-management",
    color: "bg-teal-100 text-teal-600",
    submodules: ["info", "users", "permissions", "requests"],
  },
  {
    id: "admin-panel",
    name: "SERGEN Admin Panel",
    description: "Gestión de usuarios, clientes, roles y configuración de la plataforma",
    icon: Shield,
    basePath: "/admin-panel",
    color: "bg-sergen-dark/10 text-sergen-dark",
    submodules: ["clients", "users", "settings"],
  },
];
