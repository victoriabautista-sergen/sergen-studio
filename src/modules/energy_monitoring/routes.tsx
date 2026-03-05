import { RouteObject } from "react-router-dom";
import EnergyMonitoringPage from "./pages/EnergyMonitoringPage";

export const energyMonitoringRoutes: RouteObject[] = [
  { path: "/modules/energy-monitoring", element: <EnergyMonitoringPage /> },
];
