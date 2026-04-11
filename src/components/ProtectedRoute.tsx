import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Acesso liberado para facilitar o cadastro dos imóveis
  // if (!user) return <Navigate to="/login" replace />;
  // if (!isAdmin) return <Navigate to="/access-denied" replace />;

  return <>{children}</>;
}
