import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  developerOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false, developerOnly = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isDeveloper } = useAuth();

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
  if (developerOnly && !isDeveloper) return <Redirect to="/" />;
  if (adminOnly && !isAdmin && !isDeveloper) return <Redirect to="/" />;

  return <>{children}</>;
}
