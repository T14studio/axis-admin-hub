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
    const keys = Object.keys(localStorage).filter(
      (k) => k.startsWith('sb-') || k.includes('supabase')
    );
    keys.forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}

async function getSessionWithTimeout(timeoutMs: number) {
  return Promise.race([
    supabase.auth.getSession(),
    new Promise<{ data: { session: null }; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: { session: null }, error: new Error('timeout') }), timeoutMs)
    ),
  ]);
}

async function fetchAdminUser(userId: string) {
  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
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

    const initialize = async () => {
      try {
        const result = await getSessionWithTimeout(5000);
        const currentSession = result.data.session;
        const timedOut = result.error?.message === 'timeout';

        if (timedOut) {
          console.warn('[useAuth] getSession timed out, clearing storage');
          clearSupabaseStorage();
        }

        if (!mounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          try {
            const adminData = await fetchAdminUser(currentSession.user.id);
            if (!mounted) return;
            if (adminData) {
              setAdminUser(adminData);
              setIsAdmin(adminData.active === true);
            } else {
              setAdminUser(null);
              setIsAdmin(false);
            }
          } catch (e) {
            console.error('[useAuth] fetchAdminUser error:', e);
            if (mounted) {
              setAdminUser(null);
              setIsAdmin(false);
            }
          }
        } else {
          setSession(null);
          setUser(null);
          setAdminUser(null);
          setIsAdmin(false);
        }
      } catch (e) {
        console.error('[useAuth] initialize error:', e);
        if (mounted) {
          setSession(null);
          setUser(null);
          setAdminUser(null);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        if (event === 'SIGNED_OUT' || !currentSession) {
          setSession(null);
          setUser(null);
          setAdminUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession.user);
          try {
            const adminData = await fetchAdminUser(currentSession.user.id);
            if (!mounted) return;
            if (adminData) {
              setAdminUser(adminData);
              setIsAdmin(adminData.active === true);
            } else {
              setAdminUser(null);
              setIsAdmin(false);
            }
          } catch (e) {
            console.error('[useAuth] onAuthStateChange error:', e);
          } finally {
            if (mounted) setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      adminUser,
      loading,
      isAdmin,
      signIn,
      signOut,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
