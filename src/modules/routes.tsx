import { RouteObject } from "react-router-dom";
import { energyPredictionRoutes } from "./energy_prediction/routes";
import { reportStudioRoutes } from "./report_studio/routes";
import { billingSimulationRoutes } from "./billing_simulation/routes";
import { energyMonitoringRoutes } from "./energy_monitoring/routes";
import { induvexRoutes } from "./induvex/routes";

export const moduleRoutes: RouteObject[] = [
  ...energyPredictionRoutes,
  ...reportStudioRoutes,
  ...billingSimulationRoutes,
  ...energyMonitoringRoutes,
  ...induvexRoutes,
];
