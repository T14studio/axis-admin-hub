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
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[useAuth] Auth event:', event, currentSession?.user?.email);
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
        try {
          const { data, error } = await supabase
            .from("admin_users")
            .select("*")
            .eq("user_id", currentSession.user.id)
            .maybeSingle();
          console.log('[useAuth] admin_users query:', data, error);
          if (!mounted) return;
          if (data) {
            setAdminUser(data);
            setIsAdmin(data.active === true);
          } else {
            setAdminUser(null);
            setIsAdmin(false);
          }
        } catch (err) {
          console.error('[useAuth] Error fetching admin_users:', err);
          if (mounted) {
            setAdminUser(null);
            setIsAdmin(false);
          }
        } finally {
          if (mounted) setLoading(false);
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
