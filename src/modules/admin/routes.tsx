import { RouteObject } from "react-router-dom";
import AdminPanelPage from "./pages/AdminPanelPage";
import CompanyAdminPage from "./pages/CompanyAdminPage";

export const adminRoutes: RouteObject[] = [
  { path: "/modules/admin", element: <AdminPanelPage /> },
  { path: "/admin-empresa", element: <CompanyAdminPage /> },
];
