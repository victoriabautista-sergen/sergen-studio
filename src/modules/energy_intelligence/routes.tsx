import { RouteObject, Navigate } from "react-router-dom";
import ControlPage from "./pages/ControlPage";
import ReportesPage from "./pages/ReportesPage";
import AnaliticaPage from "./pages/AnaliticaPage";

export const energyIntelligenceRoutes: RouteObject[] = [
  { path: "/energy-intelligence", element: <Navigate to="/energy-intelligence/control" replace /> },
  { path: "/energy-intelligence/control", element: <ControlPage /> },
  { path: "/energy-intelligence/reportes", element: <ReportesPage /> },
  { path: "/energy-intelligence/analitica", element: <AnaliticaPage /> },
];
