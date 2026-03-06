/**
 * Thin wrapper over AuthContext for backward compatibility.
 * Prefer importing useAuthContext directly for new code.
 */
import { useAuthContext } from "@/core/auth/context/AuthContext";

export const useAuth = () => {
  const { session, loading, logout } = useAuthContext();
  return { session, loading, logout };
};
