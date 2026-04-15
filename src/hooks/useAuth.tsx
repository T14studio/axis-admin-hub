import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
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
  const initialized = useRef(false);

  const fetchAdminUser = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setAdminUser(data);
        setIsAdmin(data.active === true);
      } else {
        const fallbackName = email.split('@')[0];
        const { data: newUser, error: insertError } = await supabase
          .from("admin_users")
          .insert([{
            user_id: userId,
            email: email,
            name: fallbackName,
            role: "admin_operacional",
            active: true
          }])
          .select()
          .maybeSingle();

        if (newUser && !insertError) {
          setAdminUser(newUser);
          setIsAdmin(true);
        } else {
          console.error("Auth: No profile found and auto-create failed:", insertError);
          setAdminUser(null);
          setIsAdmin(false);
        }
      }
    } catch (e) {
      console.error("Auth: Fatal error in fetchAdminUser:", e);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchAdminUser(currentSession.user.id, currentSession.user.email || '');
        } else {
          setSession(null);
          setUser(null);
          setAdminUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth: Error syncing session:", err);
        if (mounted) setLoading(false);
      }
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      console.log("Auth: State change event:", event);

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchAdminUser(currentSession.user.id, currentSession.user.email || '');
      } else {
        setSession(null);
        setUser(null);
        setAdminUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || "Erro inesperado" };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setAdminUser(null);
      setIsAdmin(false);
    }
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

