// Legacy redirect — this file is kept only to avoid broken imports during migration.
// The admin panel has moved to /admin-panel (AdminPanelHomePage.tsx).
import { Navigate } from "react-router-dom";

const AdminPanelPage = () => <Navigate to="/admin-panel" replace />;

export default AdminPanelPage;
