import { RouteObject } from "react-router-dom";
import BillingOptimizationPage from "./pages/BillingOptimizationPage";
import ReportStudioPage from "./report_studio/pages/ReportStudioPage";
import BillingSimulationPage from "./billing_simulation/pages/BillingSimulationPage";

export const billingOptimizationRoutes: RouteObject[] = [
  { path: "/modules/billing-optimization", element: <BillingOptimizationPage /> },
  { path: "/modules/billing-optimization/report-studio", element: <ReportStudioPage /> },
  { path: "/modules/billing-optimization/billing-simulation", element: <BillingSimulationPage /> },
];
