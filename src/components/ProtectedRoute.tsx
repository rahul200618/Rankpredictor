import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Redirect to="/auth" />;
  if (adminOnly && !isAdmin) return <Redirect to="/" />;

  return <>{children}</>;
}
