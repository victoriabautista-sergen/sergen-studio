import { Navigate } from "react-router-dom";
import { useAuthContext, type AppRole } from "@/core/auth/context/AuthContext";

interface PrivateRouteProps {
  children: React.ReactNode;
  /** If provided, only these roles can access this route */
  allowedRoles?: AppRole[];
}

const redirectByRole = (role: AppRole | null): string => {
  if (role === "super_admin" || role === "technical_user") return "/modules/admin";
  if (role === "admin") return "/admin-empresa";
  return "/dashboard";
};

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { session, role, profile, subscriptionActive, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  // Not authenticated → login
  if (!session) return <Navigate to="/auth" replace />;

  // Account deactivated
  if (profile && !profile.is_active) return <Navigate to="/auth?reason=inactive" replace />;

  // Company subscription expired (only for company roles)
  if (
    role &&
    (role === "admin" || role === "client_user") &&
    !subscriptionActive
  ) {
    return <Navigate to="/auth?reason=subscription" replace />;
  }

  // Role not allowed for this route → redirect to their home
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={redirectByRole(role)} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
