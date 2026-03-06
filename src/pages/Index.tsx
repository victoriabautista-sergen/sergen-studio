import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/core/auth/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { session, role, loading } = useAuthContext();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/auth", { replace: true });
      return;
    }
    if (role === "super_admin" || role === "technical_user") {
      navigate("/modules/admin", { replace: true });
    } else if (role === "admin") {
      navigate("/admin-empresa", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [session, role, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Cargando...</div>
    </div>
  );
};

export default Index;
