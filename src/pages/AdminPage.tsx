import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { 
  Users, Database, Clock, ChevronLeft, 
  BarChart, Target, ShieldAlert, Loader2,
  Mail, Phone, Download, Search, TrendingUp, BookOpen
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Subject label map
const SUBJECT_LABELS: Record<string, string> = {
  engineering: "⚙️ Engineering",
  pharmacy: "💊 Pharmacy",
  allied_science: "🌿 Allied Science / Agri / Vet",
};

const COMEDK_SHIFT_LABELS: Record<string, string> = {
  "10s1": "10 May S1",
  "10s2": "10 May S2",
  "10s3": "10 May S3",
  "25may": "25 May",
  "unknown": "Blend All",
};

const subjectBadge = (id: string) =>
  SUBJECT_LABELS[id] ?? id;

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [rankResults, setRankResults] = useState<any[]>([]);

  // Filtering & Sorting State
  const [enquirySearch, setEnquirySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [rankSearch, setRankSearch] = useState("");
  const [enquirySort, setEnquirySort] = useState("date-desc");
  const [userSort, setUserSort] = useState("name-asc");
  const [rankSort, setRankSort] = useState("date-desc");
  // Date range filters (YYYY-MM-DD strings)
  const [enquiryDateFrom, setEnquiryDateFrom] = useState("");
  const [enquiryDateTo, setEnquiryDateTo] = useState("");
  const [userDateFrom, setUserDateFrom] = useState("");
  const [userDateTo, setUserDateTo] = useState("");
  const [rankDateFrom, setRankDateFrom] = useState("");
  const [rankDateTo, setRankDateTo] = useState("");

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
        const fetchTableData = async (tableName: string, fallbackEmpty: boolean = false) => {
          let allData: any[] = [];
          let page = 0;
          const pageSize = 1000;
          while (true) {
            const start = page * pageSize;
            const end = start + pageSize - 1;
            const { data, error } = await supabase
              .from(tableName)
              .select("*")
              .order("created_at", { ascending: false })
              .range(start, end);
            
            if (error) {
              if (fallbackEmpty) {
                console.warn(`Failed to fetch ${tableName}, falling back to empty list:`, error.message);
                return [];
              }
              throw error;
            }
            if (!data || data.length === 0) break;
            
            allData = allData.concat(data);
            if (data.length < pageSize) break;
            page++;
          }
          return allData;
        };

        const [enqData, usersData, rankData] = await Promise.all([
          fetchTableData("counseling_enquiries"),
          fetchTableData("user_profiles"),
          fetchTableData("student_rank_results", true),
        ]);

        setEnquiries(enqData || []);
        setUsers(usersData || []);
        setRankResults(rankData || []);
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
      ["Name", "Phone", "Email", "Interested Streams", "Interested Exams", "Date"],
      enq => [
        enq.name,
        enq.phone,
        enq.email,
        (enq.interested_streams || []).join("; "),
        (enq.interested_exams || []).join("; "),
        enq.created_at ? new Date(enq.created_at).toLocaleString() : ""
      ]
    );
  };

  const handleDownloadUsers = () => {
    downloadCSV(
      filteredUsers,
      `registered_users_${Date.now()}.csv`,
      ["Full Name", "Phone", "Interested Subjects", "Interested Exams", "Created Date"],
      u => [
        u.full_name,
        u.phone,
        (u.interested_subjects || []).map((s: string) => SUBJECT_LABELS[s] ?? s).join("; "),
        (u.interested_exams || []).join("; "),
        u.created_at ? new Date(u.created_at).toLocaleString() : "Recently"
      ]
    );
  };

  const handleDownloadRankResults = () => {
    downloadCSV(
      filteredRankResults,
      `rank_predictions_${Date.now()}.csv`,
      ["Name", "Phone", "Interested Subjects", "Exam", "KCET/COMEDK Total", "Board Avg% / Shift", "KEA Score / Percentile", "Rank Low", "Rank High", "Date"],
      r => [
        r.full_name,
        r.phone,
        (r.interested_subjects || []).map((s: string) => SUBJECT_LABELS[s] ?? s).join("; "),
        r.exam_mode,
        r.kcet_total,
        r.exam_mode === "COMEDK" ? (r.shift ? COMEDK_SHIFT_LABELS[r.shift] || r.shift : "Blend All") : (r.board_avg != null ? Number(r.board_avg).toFixed(1) : ""),
        r.kea_score != null ? Number(r.kea_score).toFixed(2) : "",
        r.predicted_rank_low,
        r.predicted_rank_high,
        r.created_at ? new Date(r.created_at).toLocaleString() : ""
      ]
    );
  };

  // Filtered & Sorted Enquiries
  const filteredEnquiries = enquiries
    .filter(enq => {
      // Date range filter
      if (enquiryDateFrom || enquiryDateTo) {
        const created = enq.created_at ? new Date(enq.created_at) : null;
        if (!created) return false;
        if (enquiryDateFrom) {
          const from = new Date(enquiryDateFrom + "T00:00:00");
          if (created < from) return false;
        }
        if (enquiryDateTo) {
          const to = new Date(enquiryDateTo + "T23:59:59");
          if (created > to) return false;
        }
      }
      const q = enquirySearch.toLowerCase();
      return (
        (enq.name || "").toLowerCase().includes(q) ||
        (enq.phone || "").toLowerCase().includes(q) ||
        (enq.email || "").toLowerCase().includes(q) ||
        (enq.interested_streams || []).some((s: string) => s.toLowerCase().includes(q)) ||
        (enq.interested_exams || []).some((e: string) => e.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (enquirySort === "date-desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (enquirySort === "date-asc")  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (enquirySort === "name-asc")  return (a.name || "").localeCompare(b.name || "");
      if (enquirySort === "name-desc") return (b.name || "").localeCompare(a.name || "");
      return 0;
    });

  // Filtered & Sorted Users
  const filteredUsers = users
    .filter(u => {
      // Date range filter
      if (userDateFrom || userDateTo) {
        const created = u.created_at ? new Date(u.created_at) : null;
        if (!created) return false;
        if (userDateFrom) {
          const from = new Date(userDateFrom + "T00:00:00");
          if (created < from) return false;
        }
        if (userDateTo) {
          const to = new Date(userDateTo + "T23:59:59");
          if (created > to) return false;
        }
      }
      const q = userSearch.toLowerCase();
      return (
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.interested_subjects || []).some((s: string) => s.toLowerCase().includes(q)) ||
        (u.interested_exams || []).some((e: string) => e.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (userSort === "name-asc")  return (a.full_name || "").localeCompare(b.full_name || "");
      if (userSort === "name-desc") return (b.full_name || "").localeCompare(a.full_name || "");
      if (userSort === "phone-asc") return (a.phone || "").localeCompare(b.phone || "");
      if (userSort === "phone-desc") return (b.phone || "").localeCompare(a.phone || "");
      if (userSort === "date-desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (userSort === "date-asc")  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  // Filtered & Sorted Rank Results
  const filteredRankResults = rankResults
    .filter(r => {
      // Date range filter
      if (rankDateFrom || rankDateTo) {
        const created = r.created_at ? new Date(r.created_at) : null;
        if (!created) return false;
        if (rankDateFrom) {
          const from = new Date(rankDateFrom + "T00:00:00");
          if (created < from) return false;
        }
        if (rankDateTo) {
          const to = new Date(rankDateTo + "T23:59:59");
          if (created > to) return false;
        }
      }
      const q = rankSearch.toLowerCase();
      return (
        (r.full_name || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q) ||
        (r.exam_mode || "").toLowerCase().includes(q) ||
        (r.interested_subjects || []).some((s: string) => s.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (rankSort === "date-desc")   return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (rankSort === "date-asc")    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (rankSort === "rank-asc")    return (a.predicted_rank_low || 0) - (b.predicted_rank_low || 0);
      if (rankSort === "rank-desc")   return (b.predicted_rank_low || 0) - (a.predicted_rank_low || 0);
      if (rankSort === "name-asc")    return (a.full_name || "").localeCompare(b.full_name || "");
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
      <div className="max-w-7xl mx-auto space-y-8 animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation("/")} className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
              <BarChart className="text-primary" size={28} /> Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">Analyze users, rank predictions and counseling enquiries</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="w-12 h-12 bg-violet-500/10 text-violet-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-2xl font-black">{rankResults.length}</div>
              <div className="text-xs text-muted-foreground font-semibold">Rank Predictions Made</div>
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

        {/* ── Student Rank Predictions (Full Width) ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp size={18} className="text-violet-500"/> Student Rank Predictions
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filteredRankResults.length}</span>
              </h2>
              <button
                onClick={handleDownloadRankResults}
                disabled={filteredRankResults.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-lg transition-all disabled:opacity-50 shrink-0"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[160px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name, phone, stream..."
                  value={rankSearch}
                  onChange={e => setRankSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={rankDateFrom}
                  onChange={e => setRankDateFrom(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-border bg-background text-xs text-foreground"
                  aria-label="Rank date from"
                />
                <input
                  type="date"
                  value={rankDateTo}
                  onChange={e => setRankDateTo(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-border bg-background text-xs text-foreground"
                  aria-label="Rank date to"
                />
              </div>
              <select
                value={rankSort}
                onChange={e => setRankSort(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:border-primary cursor-pointer shrink-0 text-foreground"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="rank-asc">Best Rank First</option>
                <option value="rank-desc">Worst Rank First</option>
                <option value="name-asc">Name (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredRankResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {rankResults.length === 0
                  ? "No rank predictions yet. Run the SQL migration and predict a rank to see data here."
                  : "No results match your search."}
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Interested Streams</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Exam</th>
                    <th className="text-right px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">KCET/COMEDK</th>
                    <th className="text-right px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Board% / Shift</th>
                    <th className="text-right px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">KEA / Pct</th>
                    <th className="text-right px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Predicted Rank</th>
                    <th className="text-right px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredRankResults.map((r, i) => (
                    <tr key={r.id ?? i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{r.full_name || "—"}</div>
                        <div className="text-muted-foreground font-mono text-[10px]">{r.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(r.interested_subjects || []).length > 0
                            ? (r.interested_subjects as string[]).map(s => (
                                <span key={s} className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  {subjectBadge(s)}
                                </span>
                              ))
                            : <span className="text-muted-foreground italic">—</span>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded">{r.exam_mode}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">
                        {r.kcet_total ?? "—"}<span className="text-muted-foreground font-normal">/180</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600 dark:text-amber-400">
                        {r.exam_mode === "COMEDK" ? (r.shift ? COMEDK_SHIFT_LABELS[r.shift] || r.shift : "Blend All") : (r.board_avg != null ? `${Number(r.board_avg).toFixed(1)}%` : "—")}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {r.exam_mode === "COMEDK" ? (r.kea_score != null ? `${Number(r.kea_score).toFixed(2)}%` : "—") : (r.kea_score != null ? Number(r.kea_score).toFixed(2) : "—")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-black text-violet-600 dark:text-violet-400 text-sm">
                          {r.predicted_rank_low?.toLocaleString("en-IN")}
                        </span>
                        <span className="text-muted-foreground"> – </span>
                        <span className="font-black text-violet-600 dark:text-violet-400 text-sm">
                          {r.predicted_rank_high?.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Bottom Two Columns ── */}
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
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={enquiryDateFrom}
                      onChange={e => setEnquiryDateFrom(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-border bg-background text-xs text-foreground"
                      aria-label="Enquiry date from"
                    />
                    <input
                      type="date"
                      value={enquiryDateTo}
                      onChange={e => setEnquiryDateTo(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-border bg-background text-xs text-foreground"
                      aria-label="Enquiry date to"
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
                        <div className="mt-2 mr-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded inline-block">
                          Streams: {enq.interested_streams.join(", ")}
                        </div>
                      )}
                      {enq.interested_exams?.length > 0 && (
                        <div className="mt-2 text-[10px] font-semibold text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20 px-2 py-1 rounded inline-block">
                          Exams: {enq.interested_exams.join(", ")}
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
                    placeholder="Search by name, phone, stream..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={userDateFrom}
                    onChange={e => setUserDateFrom(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-border bg-background text-xs text-foreground"
                    aria-label="User date from"
                  />
                  <input
                    type="date"
                    value={userDateTo}
                    onChange={e => setUserDateTo(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-border bg-background text-xs text-foreground"
                    aria-label="User date to"
                  />
                </div>
                <select
                  value={userSort}
                  onChange={e => setUserSort(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:border-primary cursor-pointer shrink-0 text-foreground"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
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
                  <div key={u.id} className="p-4 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-foreground text-sm">{u.full_name || "Unknown"}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Recently"}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                      <Phone size={11}/> {u.phone}
                    </div>
                    {(u.interested_subjects || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(u.interested_subjects as string[]).map((s: string) => (
                          <span key={s} className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {subjectBadge(s)}
                          </span>
                        ))}
                      </div>
                    )}
                    {(u.interested_exams || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(u.interested_exams as string[]).map((e: string) => (
                          <span key={e} className="text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full">
                            {e}
                          </span>
                        ))}
                      </div>
                    )}
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
