import { RouteObject } from "react-router-dom";
import { energyIntelligenceRoutes } from "./energy_intelligence/routes";
import { billingOptimizationRoutes } from "./billing_optimization/routes";
import { induvexRoutes } from "./induvex/routes";
import { adminRoutes } from "./admin/routes";
import { companyManagementRoutes } from "./company_management/routes";
import { ladderGeneratorRoutes } from "./ladder_generator/routes";

export const moduleRoutes: RouteObject[] = [
  ...energyIntelligenceRoutes,
  ...billingOptimizationRoutes,
  ...induvexRoutes,
  ...adminRoutes,
  ...companyManagementRoutes,
  ...ladderGeneratorRoutes,
];
