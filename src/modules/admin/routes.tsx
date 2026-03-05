import { RouteObject } from "react-router-dom";
import AdminPanelPage from "./pages/AdminPanelPage";

export const adminRoutes: RouteObject[] = [
  { path: "/modules/admin", element: <AdminPanelPage /> },
];
