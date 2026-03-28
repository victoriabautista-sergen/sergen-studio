import { RouteObject } from "react-router-dom";
import PrivateRoute from "@/core/auth/components/PrivateRoute";
import AdminPanelHomePage from "./pages/AdminPanelHomePage";
import EmpresasPage from "./pages/EmpresasPage";
import EmpresaDetailPage from "./pages/EmpresaDetailPage";
import UsuariosSergenPage from "./pages/UsuariosSergenPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import SolicitudesPage from "./pages/SolicitudesPage";
import CompanyAdminPage from "./pages/CompanyAdminPage";
import ModulosPage from "./pages/ModulosPage";
import ModuloDetailPage from "./pages/ModuloDetailPage";
import ControlDemandaConfigPage from "./pages/ControlDemandaConfigPage";
import ModulacionPage from "./pages/control-demanda/ModulacionPage";
import ActualizacionAlertaPage from "./pages/control-demanda/ActualizacionAlertaPage";
import ReportStudioCDPage from "./pages/report-studio/ReportStudioCDPage";
import CotizacionPage from "./pages/cotizacion/CotizacionPage";

const SA = (el: React.ReactNode) => (
  <PrivateRoute allowedRoles={["super_admin"]}>{el}</PrivateRoute>
);

export const adminRoutes: RouteObject[] = [
  { path: "/admin-panel", element: SA(<AdminPanelHomePage />) },
  { path: "/admin-panel/empresas", element: SA(<EmpresasPage />) },
  { path: "/admin-panel/empresas/:id", element: SA(<EmpresaDetailPage />) },
  { path: "/admin-panel/usuarios", element: SA(<UsuariosSergenPage />) },
  { path: "/admin-panel/configuracion", element: SA(<ConfiguracionPage />) },
  { path: "/admin-panel/solicitudes", element: SA(<SolicitudesPage />) },
  { path: "/admin-panel/modulos", element: SA(<ModulosPage />) },
  { path: "/admin-panel/modulos/energy-intelligence", element: SA(<ControlDemandaConfigPage />) },
  { path: "/admin-panel/modulos/energy-intelligence/modulacion", element: SA(<ModulacionPage />) },
  { path: "/admin-panel/modulos/energy-intelligence/alerta", element: SA(<ActualizacionAlertaPage />) },
  { path: "/admin-panel/modulos/energy-intelligence/report-studio", element: SA(<ReportStudioCDPage />) },
  { path: "/admin-panel/modulos/:slug", element: SA(<ModuloDetailPage />) },
  { path: "/admin-panel/cotizacion", element: SA(<CotizacionPage />) },
  // Company admin (admin role = company administrator)
  { path: "/admin-empresa", element: <CompanyAdminPage /> },
];
