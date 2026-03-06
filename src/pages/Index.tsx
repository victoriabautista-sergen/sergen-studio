import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/core/auth/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuthContext();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/auth", { replace: true });
      return;
    }
    navigate("/dashboard", { replace: true });
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Cargando...</div>
    </div>
  );
};

export default Index;
