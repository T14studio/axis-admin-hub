import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

type AdminUser = Tables<"admin_users">;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  adminUser: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearSupabaseStorage() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-') || k.includes('supabase'))
      .forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}

async function fetchAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("[useAuth] fetchAdminUser error:", error);
      return null;
    }
    console.log('[useAuth] fetchAdminUser result:', data);
    return data;
  } catch (err) {
    console.error("[useAuth] fetchAdminUser exception:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn('[useAuth] Safety timeout - stopping loading');
        setLoading(false);
      }
    }, 8000);

    // Initialize with current session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;
      if (!currentSession || !currentSession.user) {
        clearTimeout(safetyTimer);
        setSession(null);
        setUser(null);
        setAdminUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setSession(currentSession);
      setUser(currentSession.user);
      const adminData = await fetchAdminUser(currentSession.user.id);
      if (!mounted) return;
      clearTimeout(safetyTimer);
      if (adminData && adminData.active === true) {
        setAdminUser(adminData);
        setIsAdmin(true);
      } else {
        console.warn('[useAuth] not admin or not active:', adminData);
        setAdminUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[useAuth] event:', event, 'user:', currentSession?.user?.email ?? 'none');
        if (!mounted) return;
        if (!currentSession || !currentSession.user) {
          setSession(null);
          setUser(null);
          setAdminUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        setSession(currentSession);
        setUser(currentSession.user);
        // Use setTimeout to avoid Supabase deadlock on auth state change
        setTimeout(async () => {
          if (!mounted) return;
          const adminData = await fetchAdminUser(currentSession.user.id);
          if (!mounted) return;
          if (adminData && adminData.active === true) {
            setAdminUser(adminData);
            setIsAdmin(true);
          } else {
            console.warn('[useAuth] not admin or not active:', adminData);
            setAdminUser(null);
            setIsAdmin(false);
          }
          setLoading(false);
        }, 100);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("🚨 [useAuth] signIn error (Supabase):", error);
        setLoading(false);
        return { error: error.message };
      }
      
      console.log("✅ [useAuth] signIn success:", data?.user?.email);
      return { error: null };
    } catch (err: any) {
      console.error("🔥 [useAuth] signIn unexpected exception:", err);
      setLoading(false);
      return { error: err?.message || "Erro inesperado de rede (Failed to fetch)" };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    clearSupabaseStorage();
    window.location.href = '/login';
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        adminUser,
        loading,
        isAdmin,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
