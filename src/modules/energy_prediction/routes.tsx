import { RouteObject } from "react-router-dom";
import EnergyPredictionPage from "./pages/EnergyPredictionPage";

export const energyPredictionRoutes: RouteObject[] = [
  { path: "/modules/energy-prediction", element: <EnergyPredictionPage /> },
];
