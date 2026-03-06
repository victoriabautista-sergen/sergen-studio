import { RouteObject } from "react-router-dom";
import AdminPanelHomePage from "./pages/AdminPanelHomePage";
import ResumenPage from "./pages/ResumenPage";
import EmpresasPage from "./pages/EmpresasPage";
import EmpresaDetailPage from "./pages/EmpresaDetailPage";
import UsuariosSergenPage from "./pages/UsuariosSergenPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import SolicitudesPage from "./pages/SolicitudesPage";
import CompanyAdminPage from "./pages/CompanyAdminPage";

export const adminRoutes: RouteObject[] = [
  { path: "/admin-panel", element: <AdminPanelHomePage /> },
  { path: "/admin-panel/resumen", element: <ResumenPage /> },
  { path: "/admin-panel/empresas", element: <EmpresasPage /> },
  { path: "/admin-panel/empresas/:id", element: <EmpresaDetailPage /> },
  { path: "/admin-panel/usuarios-sergen", element: <UsuariosSergenPage /> },
  { path: "/admin-panel/configuracion", element: <ConfiguracionPage /> },
  { path: "/admin-panel/solicitudes", element: <SolicitudesPage /> },
  { path: "/admin-empresa", element: <CompanyAdminPage /> },
];
