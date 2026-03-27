import { RouteObject } from "react-router-dom";
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

export const adminRoutes: RouteObject[] = [
  { path: "/admin-panel", element: <AdminPanelHomePage /> },
  { path: "/admin-panel/empresas", element: <EmpresasPage /> },
  { path: "/admin-panel/empresas/:id", element: <EmpresaDetailPage /> },
  { path: "/admin-panel/usuarios", element: <UsuariosSergenPage /> },
  { path: "/admin-panel/configuracion", element: <ConfiguracionPage /> },
  { path: "/admin-panel/solicitudes", element: <SolicitudesPage /> },
  { path: "/admin-panel/modulos", element: <ModulosPage /> },
  { path: "/admin-panel/modulos/energy-intelligence", element: <ControlDemandaConfigPage /> },
  { path: "/admin-panel/modulos/energy-intelligence/modulacion", element: <ModulacionPage /> },
  { path: "/admin-panel/modulos/energy-intelligence/alerta", element: <ActualizacionAlertaPage /> },
  { path: "/admin-panel/modulos/energy-intelligence/report-studio", element: <ReportStudioCDPage /> },
  { path: "/admin-panel/modulos/:slug", element: <ModuloDetailPage /> },
  { path: "/admin-empresa", element: <CompanyAdminPage /> },
  { path: "/admin-panel/cotizacion", element: <CotizacionPage /> },
];
