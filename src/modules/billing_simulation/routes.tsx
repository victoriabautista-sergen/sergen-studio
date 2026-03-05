import { RouteObject } from "react-router-dom";
import BillingSimulationPage from "./pages/BillingSimulationPage";

export const billingSimulationRoutes: RouteObject[] = [
  { path: "/modules/billing-simulation", element: <BillingSimulationPage /> },
];
