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
    console.log('[useAuth] Iniciando checkAuth. Sessao:', currentSession?.user?.email || 'Nenhuma');
    if (!currentSession) {
      console.log('[useAuth] Sem sessao, finalizando loading.');
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
      console.log('[useAuth] Buscando perfil admin_users para:', currentSession.user.id);
      const { data, error: fetchError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", currentSession.user.id)
        .maybeSingle();
      console.log('[useAuth] Resultado admin_users:', data, 'Erro:', fetchError);
      if (data) {
        if (mounted) {
          setAdminUser(data);
          setIsAdmin(data.active === true);
          console.log('[useAuth] adminUser definido:', data.email, 'Ativo:', data.active);
        }
      } else if (fetchError) {
        console.error('[useAuth] Erro ao buscar admin_users:', fetchError);
        if (mounted) {
          setAdminUser(null);
          setIsAdmin(false);
        }
      } else {
        // Nao encontrou registro - tenta upsert
        console.log('[useAuth] Perfil nao encontrado, tentando upsert...');
        const fallbackName = currentSession.user.email?.split('@')[0] || 'Usuario';
        const { data: upsertedUser, error: upsertError } = await supabase
          .from("admin_users")
          .upsert([{
            user_id: currentSession.user.id,
            email: currentSession.user.email!,
            name: fallbackName,
            role: "admin_operacional",
            active: true
          }], { onConflict: 'user_id', ignoreDuplicates: false })
          .select()
          .maybeSingle();
        console.log('[useAuth] Resultado upsert:', upsertedUser, 'Erro:', upsertError);
        if (mounted) {
          if (upsertedUser && !upsertError) {
            setAdminUser(upsertedUser);
            setIsAdmin(upsertedUser.active === true);
          } else {
            // Se upsert falhou, tenta SELECT novamente (pode ter sido criado por race condition)
            console.log('[useAuth] Upsert falhou, tentando SELECT de recuperacao...');
            const { data: retryData } = await supabase
              .from("admin_users")
              .select("*")
              .eq("user_id", currentSession.user.id)
              .maybeSingle();
            console.log('[useAuth] Resultado SELECT recuperacao:', retryData);
            if (retryData && mounted) {
              setAdminUser(retryData);
              setIsAdmin(retryData.active === true);
            } else if (mounted) {
              setAdminUser(null);
              setIsAdmin(false);
            }
          }
        }
      }
    } catch (err) {
      console.error("[useAuth] Erro critico na verificacao:", err);
    } finally {
      console.log('[useAuth] Finalizando checkAuth (setLoading false)');
      if (mounted) setLoading(false);
    }
  };
  useEffect(() => {
    let mounted = true;
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth: Safety timeout triggered. Forcing loading to false.");
        setLoading(false);
      }
    }, 8000);
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
