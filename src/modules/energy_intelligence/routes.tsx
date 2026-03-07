import { RouteObject, Navigate } from "react-router-dom";
import ControlPage from "./pages/ControlPage";
import ForecastPage from "./pages/ForecastPage";
import HistoricoPage from "./pages/HistoricoPage";
import ReportesPage from "./pages/ReportesPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";

export const energyIntelligenceRoutes: RouteObject[] = [
  { path: "/energy-intelligence", element: <Navigate to="/energy-intelligence/control" replace /> },
  { path: "/energy-intelligence/control", element: <ControlPage /> },
  { path: "/energy-intelligence/forecast", element: <ForecastPage /> },
  { path: "/energy-intelligence/historico", element: <HistoricoPage /> },
  { path: "/energy-intelligence/reportes", element: <ReportesPage /> },
  { path: "/energy-intelligence/configuracion", element: <ConfiguracionPage /> },
];
