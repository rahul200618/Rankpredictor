import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { 
  Users, Database, Clock, ChevronLeft, 
  BarChart, Target, ShieldAlert, Loader2,
  Mail, Phone, Download, Search
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Filtering & Sorting State
  const [enquirySearch, setEnquirySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [enquirySort, setEnquirySort] = useState("date-desc");
  const [userSort, setUserSort] = useState("name-asc");

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
          supabase.from("user_profiles").select("*")
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

  // CSV Generator Helper
  const downloadCSV = (data: any[], filename: string, headers: string[], rowMapper: (row: any) => string[]) => {
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        rowMapper(row)
          .map(val => `"${String(val || '').replace(/"/g, '""')}"`)
          .join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadEnquiries = () => {
    downloadCSV(
      filteredEnquiries,
      `counseling_enquiries_${Date.now()}.csv`,
      ["Name", "Phone", "Email", "Interested Streams", "Date"],
      enq => [
        enq.name,
        enq.phone,
        enq.email,
        (enq.interested_streams || []).join("; "),
        enq.created_at ? new Date(enq.created_at).toLocaleString() : ""
      ]
    );
  };

  const handleDownloadUsers = () => {
    downloadCSV(
      filteredUsers,
      `registered_users_${Date.now()}.csv`,
      ["Full Name", "Phone", "Created Date"],
      u => [
        u.full_name,
        u.phone,
        u.created_at || u.last_seen_at ? new Date(u.created_at || u.last_seen_at).toLocaleString() : "Recently"
      ]
    );
  };

  // Filtered & Sorted Enquiries
  const filteredEnquiries = enquiries
    .filter(enq => {
      const q = enquirySearch.toLowerCase();
      return (
        (enq.name || "").toLowerCase().includes(q) ||
        (enq.phone || "").toLowerCase().includes(q) ||
        (enq.email || "").toLowerCase().includes(q) ||
        (enq.interested_streams || []).some((s: string) => s.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (enquirySort === "date-desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (enquirySort === "date-asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (enquirySort === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (enquirySort === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      return 0;
    });

  // Filtered & Sorted Users
  const filteredUsers = users
    .filter(u => {
      const q = userSearch.toLowerCase();
      return (
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (userSort === "name-asc") {
        return (a.full_name || "").localeCompare(b.full_name || "");
      }
      if (userSort === "name-desc") {
        return (b.full_name || "").localeCompare(a.full_name || "");
      }
      if (userSort === "phone-asc") {
        return (a.phone || "").localeCompare(b.phone || "");
      }
      if (userSort === "phone-desc") {
        return (b.phone || "").localeCompare(a.phone || "");
      }
      return 0;
    });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
        
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
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center animate-pulse">
              <Users size={24} />
            </div>
            <div>
              <div className="text-2xl font-black">{users.length}</div>
              <div className="text-xs text-muted-foreground font-semibold">Registered Users</div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center animate-pulse">
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
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col max-h-[700px]">
            <div className="p-5 border-b border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Phone size={18} className="text-primary"/> Counseling Enquiries
                </h2>
                <button
                  onClick={handleDownloadEnquiries}
                  disabled={filteredEnquiries.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all disabled:opacity-50 shrink-0"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, stream..."
                    value={enquirySearch}
                    onChange={e => setEnquirySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
                  />
                </div>
                <select
                  value={enquirySort}
                  onChange={e => setEnquirySort(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:border-primary cursor-pointer shrink-0 text-foreground"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {filteredEnquiries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No enquiries found.</div>
              ) : (
                filteredEnquiries.map(enq => (
                  <div key={enq.id} className="p-4 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-all">
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
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col max-h-[700px]">
            <div className="p-5 border-b border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users size={18} className="text-primary"/> Registered Users
                </h2>
                <button
                  onClick={handleDownloadUsers}
                  disabled={filteredUsers.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all disabled:opacity-50 shrink-0"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, phone..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
                  />
                </div>
                <select
                  value={userSort}
                  onChange={e => setUserSort(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:border-primary cursor-pointer shrink-0 text-foreground"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="phone-asc">Phone (Asc)</option>
                  <option value="phone-desc">Phone (Desc)</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No users found.</div>
              ) : (
                filteredUsers.map(u => (
                  <div key={u.id} className="p-4 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-all flex justify-between items-center">
                    <div>
                      <div className="font-bold text-foreground text-sm">{u.full_name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{u.phone}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">
                      <div>Joined</div>
                      <div>
                        {u.created_at || u.last_seen_at 
                          ? new Date(u.created_at || u.last_seen_at).toLocaleDateString()
                          : "Recently"}
                      </div>
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
