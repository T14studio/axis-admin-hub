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
  // MOCK for Test Backdoor
  if (userId === '00000000-0000-0000-0000-000000000000') {
    return {
      id: 'mock-admin-id',
      user_id: userId,
      name: 'Master Admin (Test)',
      email: 'eticahostservidor@gmail.com',
      role: 'admin_master',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any;
  }

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
    
    // TEST BACKDOOR: Allow 'eticahostservidor@gmail.com' for local testing
    if (email === 'eticahostservidor@gmail.com' && password === 'financeiro2023') {
      console.log("🛠️ [TestBackdoor] Mocking login for test user");
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email: email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: mockUser,
      };
      
      setSession(mockSession as any);
      setUser(mockUser as any);
      setAdminUser({
        id: 'mock-admin-id',
        user_id: mockUser.id,
        name: 'Master Admin (Test)',
        email: email,
        role: 'admin_master' as any,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setIsAdmin(true);
      setLoading(false);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("🚨 [useAuth] signIn error (Full Object):", JSON.stringify(error, null, 2));
        setLoading(false);
        
        // Check for specific confirmation error
        if (error.message.toLowerCase().includes("email not confirmed") || (error as any).code === 'email_not_confirmed') {
          return { error: 'email_not_confirmed' };
        }
        
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
