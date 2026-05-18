import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Phone, BarChart3, Shield, LogOut, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Search, Download,
  Sparkles, Calendar, RefreshCw
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// ── Fetch all auth users via Supabase admin view ──
// NOTE: This requires a server-side function or service role for production.
// For now we track sessions logged in our own table.
function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Count rows from our custom user_profiles table (created below)
      const { count: totalUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      const today = new Date().toISOString().split("T")[0];
      const { count: todaySignups } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      const { data: recentUsers } = await supabase
        .from("user_profiles")
        .select("id, full_name, phone, created_at, last_seen_at")
        .order("created_at", { ascending: false })
        .limit(50);

      return { totalUsers: totalUsers ?? 0, todaySignups: todaySignups ?? 0, recentUsers: recentUsers ?? [] };
    },
    refetchInterval: 30000,
  });
}

function StatBadge({ value, label, icon: Icon, color, bg }: {
  value: number | string; label: string; icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0`} style={{ background: bg }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-foreground tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground font-medium mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, isAdmin, signOut } = useAuth();
  const { data, isLoading, refetch } = useDashboardStats();
  const [search, setSearch] = useState("");

  if (!isAdmin) {
    return (
      <div className="min-h-full flex items-center justify-center flex-col gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Shield size={28} className="text-destructive" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-xs">You don't have admin privileges. Contact the platform owner.</p>
      </div>
    );
  }

  const filtered = (data?.recentUsers ?? []).filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const downloadCSV = () => {
    const rows = [["Name", "Phone", "Joined", "Last Seen"], ...(data?.recentUsers ?? []).map(u => [
      u.full_name ?? "—", u.phone ?? "—", u.created_at ?? "—", u.last_seen_at ?? "—"
    ])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "predictrank_users.csv"; a.click();
  };

  return (
    <div className="min-h-full bg-background">

      {/* ── Header ── */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-foreground leading-none">Admin Dashboard</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">PredictRank Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-lg border border-border">
              <Phone size={11} />
              {user?.phone ?? "admin"}
            </span>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl border border-border hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8 space-y-8">

        {/* ── Overview Stats ── */}
        <div>
          <h2 className="text-sm font-black text-foreground/60 uppercase tracking-widest mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBadge value={isLoading ? "…" : data?.totalUsers ?? 0} label="Total Registered Users" icon={Users} color="#60a5fa" bg="#60a5fa20" />
            <StatBadge value={isLoading ? "…" : data?.todaySignups ?? 0} label="New Signups Today" icon={TrendingUp} color="#34d399" bg="#34d39920" />
            <StatBadge value="KCET + COMEDK" label="Supported Exams" icon={BarChart3} color="#a78bfa" bg="#a78bfa20" />
            <StatBadge value="Active" label="Platform Status" icon={CheckCircle2} color="#fb923c" bg="#fb923c20" />
          </div>
        </div>

        {/* ── Users Table ── */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-sm font-black text-foreground/60 uppercase tracking-widest">Registered Users</h2>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-xl px-3 py-2">
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search name or phone…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none w-36"
                />
              </div>
              {/* Export */}
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/20"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            {/* Table head */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 px-5 py-3 bg-muted/30 border-b border-border text-[11px] font-black text-muted-foreground uppercase tracking-wider">
              <span>Name</span>
              <span>Phone</span>
              <span className="hidden sm:block">Joined</span>
              <span className="hidden md:block">Last Seen</span>
            </div>

            {/* Rows */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <RefreshCw size={16} className="animate-spin" /> Loading users…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <AlertCircle size={28} className="opacity-40" />
                <p className="text-sm font-medium">{search ? "No users match your search" : "No registered users yet"}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((u, i) => (
                  <div
                    key={u.id}
                    className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors"
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                        style={{ background: `hsl(${(i * 47) % 360}, 65%, 50%)` }}
                      >
                        {(u.full_name ?? "?")[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-foreground truncate">{u.full_name ?? <span className="text-muted-foreground italic">—</span>}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-foreground font-mono">
                      <Phone size={11} className="text-muted-foreground shrink-0" />
                      {u.phone ?? "—"}
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={11} />
                      {u.created_at ? formatDate(u.created_at) : "—"}
                    </div>

                    <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={11} />
                      {u.last_seen_at ? formatDate(u.last_seen_at) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer row count */}
            {filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-medium">
                Showing {filtered.length} of {data?.totalUsers ?? 0} users
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
