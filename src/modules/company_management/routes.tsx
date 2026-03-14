import { RouteObject } from "react-router-dom";
import CompanyManagementPage from "./pages/CompanyManagementPage";

export const companyManagementRoutes: RouteObject[] = [
  { path: "/company-management", element: <CompanyManagementPage /> },
];
