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

  const checkAuth = async (currentSession: Session | null, mounted: boolean) => {
    if (!currentSession) {
      if (mounted) {
        setSession(null);
        setUser(null);
        setAdminUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
      return;
    }

    try {
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession.user);
      }

      // 1. Tenta buscar o usuário na tabela admin_users
      const { data, error: fetchError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", currentSession.user.id)
        .maybeSingle();

      if (data) {
        if (mounted) {
          setAdminUser(data);
          setIsAdmin(data.active === true);
        }
      } else {
        // 2. Se não existir, tenta criar automaticamente
        const fallbackName = currentSession.user.email?.split('@')[0] || 'Usuário';
        const { data: newUser, error: insertError } = await supabase
          .from("admin_users")
          .insert([{
            user_id: currentSession.user.id,
            email: currentSession.user.email!,
            name: fallbackName,
            role: "admin_operacional",
            active: true
          }])
          .select()
          .maybeSingle();

        if (mounted) {
          if (newUser && !insertError) {
            setAdminUser(newUser);
            setIsAdmin(true);
          } else {
            setAdminUser(null);
            setIsAdmin(false);
          }
        }
      }
    } catch (err) {
      console.error("Auth: Erro crítico na verificação:", err);
    } finally {
      if (mounted) setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Timeout de segurança: 5 segundos
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth: Safety timeout triggered. Forcing loading to false.");
        setLoading(false);
      }
    }, 5000);

    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        await checkAuth(initialSession, mounted);
      } catch (err) {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth: State change event:", event);
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setSession(null);
          setUser(null);
          setAdminUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await checkAuth(currentSession, mounted);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
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

