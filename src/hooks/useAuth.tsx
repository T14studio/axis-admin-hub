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
  // Small delay to ensure JWT is propagated before querying
  await new Promise(r => setTimeout(r, 300));
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[useAuth] fetchAdminUser error:", error);
    return null;
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const safetyTimer = setTimeout(() => {
      if (mounted && !resolved) {
        console.warn('[useAuth] Safety timeout hit - clearing storage and stopping loading');
        clearSupabaseStorage();
        resolved = true;
        setSession(null);
        setUser(null);
        setAdminUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    }, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[useAuth] event:', event, 'user:', currentSession?.user?.email ?? 'none');
        if (!mounted) return;

        if (!currentSession || !currentSession.user) {
          resolved = true;
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
        console.log('[useAuth] adminData:', adminData);
        if (!mounted) return;

        resolved = true;
        clearTimeout(safetyTimer);

        if (adminData && adminData.active === true) {
          setAdminUser(adminData);
          setIsAdmin(true);
        } else {
          console.warn('[useAuth] adminData not found or not active:', adminData);
          setAdminUser(adminData);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
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
