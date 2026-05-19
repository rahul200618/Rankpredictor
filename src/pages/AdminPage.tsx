import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { 
  Users, Database, Clock, ChevronLeft, 
  BarChart, Target, ShieldAlert, Loader2,
  Mail, Phone
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "You need admin privileges.", variant: "destructive" });
      setLocation("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [enqRes, usersRes] = await Promise.all([
          supabase.from("counseling_enquiries").select("*").order("created_at", { ascending: false }),
          supabase.from("user_profiles").select("*").order("created_at", { ascending: false })
        ]);

        if (enqRes.error) throw enqRes.error;
        if (usersRes.error) throw usersRes.error;

        setEnquiries(enqRes.data || []);
        setUsers(usersRes.data || []);
      } catch (err: any) {
        console.error("Error fetching admin data", err);
        toast({ title: "Error", description: "Failed to load admin data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, authLoading, setLocation]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation("/")} className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
              <BarChart className="text-primary" size={28} /> Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">Analyze users and counseling enquiries</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <div className="text-2xl font-black">{users.length}</div>
              <div className="text-xs text-muted-foreground font-semibold">Registered Users</div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <Target size={24} />
            </div>
            <div>
              <div className="text-2xl font-black">{enquiries.length}</div>
              <div className="text-xs text-muted-foreground font-semibold">Counseling Leads</div>
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Counseling Enquiries */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col max-h-[600px]">
            <div className="p-5 border-b border-border bg-muted/20">
              <h2 className="text-lg font-bold flex items-center gap-2"><Phone size={18} className="text-primary"/> Counseling Enquiries</h2>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {enquiries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No enquiries found.</div>
              ) : (
                enquiries.map(enq => (
                  <div key={enq.id} className="p-4 rounded-xl border border-border/50 bg-muted/10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-foreground text-sm">{enq.name}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(enq.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-2"><Phone size={12}/> {enq.phone}</div>
                      {enq.email && <div className="flex items-center gap-2"><Mail size={12}/> {enq.email}</div>}
                      {enq.interested_streams?.length > 0 && (
                        <div className="mt-2 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded inline-block">
                          {enq.interested_streams.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Registered Users */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col max-h-[600px]">
            <div className="p-5 border-b border-border bg-muted/20">
              <h2 className="text-lg font-bold flex items-center gap-2"><Users size={18} className="text-primary"/> Registered Users</h2>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No users found.</div>
              ) : (
                users.map(u => (
                  <div key={u.id} className="p-4 rounded-xl border border-border/50 bg-muted/10 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-foreground text-sm">{u.full_name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{u.phone}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">
                      <div>Joined</div>
                      <div>{new Date(u.created_at || u.last_seen_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
