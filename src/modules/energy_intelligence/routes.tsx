import { RouteObject } from "react-router-dom";
import EnergyIntelligencePage from "./pages/EnergyIntelligencePage";
import PredictionPage from "./prediction/pages/PredictionPage";
import MonitoringPage from "./monitoring/pages/MonitoringPage";

export const energyIntelligenceRoutes: RouteObject[] = [
  { path: "/modules/energy-intelligence", element: <EnergyIntelligencePage /> },
  { path: "/modules/energy-intelligence/prediction", element: <PredictionPage /> },
  { path: "/modules/energy-intelligence/monitoring", element: <MonitoringPage /> },
];
