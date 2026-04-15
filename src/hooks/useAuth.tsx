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

  const fetchAdminUser = async (userId: string, email: string) => {
    // Fetch user without enforcing 'active' strictly in the query
    // so we know if they exist but are inactive.
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setAdminUser(data);
      // Access allowed only if user is active
      setIsAdmin(data.active === true);
    } else {
      // User not found in admin_users: attempt to auto-create them
      // This assumes RLS is configured to allow users to insert their own records.
      const fallbackName = email.split('@')[0];
      const { data: newUser, error: insertError } = await supabase
        .from("admin_users")
        .insert([{
          user_id: userId,
          email: email,
          name: fallbackName,
          role: "admin_operacional", // Default role
          active: true // Auto-activate
        }])
        .select()
        .maybeSingle();

      if (newUser && !insertError) {
        setAdminUser(newUser);
        setIsAdmin(true); // Allow access
      } else {
        console.error("Failed to fetch or auto-create admin user:", insertError);
        setAdminUser(null);
        // Fallback: If we couldn't create the user because of RLS but they are authenticated
        // we deny access until an administrator inserts them, or we could blindly allow?
        // Since we want strict auth: deny access.
        setIsAdmin(false); 
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        if (mounted) {
          setSession(session);
          setUser(session.user);
          await fetchAdminUser(session.user.id, session.user.email || '');
        }
      } else {
        if (mounted) {
          setSession(null);
          setUser(null);
          setAdminUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        // Only fetch if not already loaded or if the user changed
        await fetchAdminUser(session.user.id, session.user.email || '');
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAdminUser(null);
    setIsAdmin(false);
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

