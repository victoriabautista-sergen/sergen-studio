import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Single source of truth: read from user_roles table */
  role: AppRole | null;
  /** All client IDs the user belongs to (via client_users) */
  clientIds: string[];
  /** Module slugs the user can access (only relevant for client_user role) */
  enabledModuleSlugs: string[];
  /** Whether the user's company has an active subscription */
  subscriptionActive: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  logout: () => Promise<void>;
  /** Call after mutations that affect role/profile/modules */
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function resolveUserData(user: User): Promise<Omit<AuthState, "session" | "user" | "loading">> {
  // 1. Profile
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, email, avatar_url, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  // 2. Role — user_roles is the single source of truth
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (roleRow?.role ?? "client_user") as AppRole;

  // 3. Company IDs (via client_users)
  const { data: clientUserRows } = await supabase
    .from("client_users")
    .select("client_id")
    .eq("user_id", user.id);

  const clientIds = (clientUserRows ?? []).map((r) => r.client_id);

  // 4. Subscription check (only for company roles)
  let subscriptionActive = true;
  if ((role === "admin" || role === "client_user") && clientIds.length > 0) {
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("id")
      .in("client_id", clientIds)
      .eq("status", "active")
      .maybeSingle();
    subscriptionActive = subRow !== null;
  }

  // 5. Enabled module slugs (only needed for client_user/admin)
  // A module is visible only if: global is_active AND company_modules.enabled AND user_modules.enabled
  let enabledModuleSlugs: string[] = [];
  if ((role === "client_user" || role === "admin") && clientIds.length > 0) {
    // Get company-enabled module IDs
    const { data: companyModuleRows } = await supabase
      .from("company_modules")
      .select("module_id")
      .in("company_id", clientIds)
      .eq("enabled", true);

    const companyModuleIds = (companyModuleRows ?? []).map((r) => r.module_id);

    if (companyModuleIds.length > 0) {
      // Get user-enabled module IDs (intersection with company modules)
      const { data: userModuleRows } = await supabase
        .from("user_modules")
        .select("module_id")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .in("module_id", companyModuleIds);

      const userModuleIds = (userModuleRows ?? []).map((r) => r.module_id);

      // For admin role, they see all company modules; for client_user, only their assigned ones
      const effectiveModuleIds = role === "admin" ? companyModuleIds : userModuleIds;

      if (effectiveModuleIds.length > 0) {
        const { data: moduleRows } = await supabase
          .from("modules")
          .select("slug")
          .in("id", effectiveModuleIds)
          .eq("is_active", true);
        enabledModuleSlugs = (moduleRows ?? []).map((r) => r.slug);
      }
    }
  }

  return {
    profile: profileRow ?? null,
    role,
    clientIds,
    subscriptionActive,
    enabledModuleSlugs,
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    role: null,
    clientIds: [],
    enabledModuleSlugs: [],
    subscriptionActive: true,
    loading: true,
  });

  const setFromSession = async (session: Session | null) => {
    if (!session?.user) {
      setState({
        session: null,
        user: null,
        profile: null,
        role: null,
        clientIds: [],
        enabledModuleSlugs: [],
        subscriptionActive: true,
        loading: false,
      });
      return;
    }
    const data = await resolveUserData(session.user);
    setState({ session, user: session.user, loading: false, ...data });
  };

  const refreshAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await setFromSession(session);
  };

  useEffect(() => {
    // Seed from initial session
    supabase.auth.getSession().then(({ data: { session } }) => setFromSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setFromSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setState({
      session: null,
      user: null,
      profile: null,
      role: null,
      clientIds: [],
      enabledModuleSlugs: [],
      subscriptionActive: true,
      loading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};
