import { useParams } from "wouter";
import { colleges, cutoffRecords, branches } from "@/data/mockData";
import { useExamMode } from "@/contexts/ExamModeContext";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft, Award, TrendingUp, Building, Star } from "lucide-react";

const BRANCH_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function CollegeDetail() {
  const { collegeCode } = useParams<{ collegeCode: string }>();
  const { examMode } = useExamMode();
  const college = colleges.find(c => c.code === collegeCode);

  if (!college) {
    return (
      <div className="p-6 text-center">
        <div className="text-muted-foreground mb-4">College not found: {collegeCode}</div>
        <Link href="/college-finder" className="text-primary hover:underline text-sm">Back to College Finder</Link>
      </div>
    );
  }

  const selectedBranches = ["CS", "EC", "IS", "ME"];
  const chartData = [2023, 2024, 2025].map(year => {
    const entry: Record<string, number | string> = { year };
    for (const bc of selectedBranches) {
      const rec = cutoffRecords.find(r =>
        r.collegeCode === collegeCode && r.branchCode === bc && r.category === "GM" && r.year === year && r.round === "Round 1"
      );
      if (rec) entry[bc] = rec.cutoffRank;
    }
    return entry;
  });

  const branchNames: Record<string, string> = {
    CS: "CSE", EC: "ECE", IS: "ISE", ME: "Mech"
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 font-sans">
      <div className="flex items-center gap-3">
        <Link href="/college-finder" className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" data-testid="back-button">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <span className="font-mono text-xs text-muted-foreground">{college.code}</span>
          <h1 className="text-lg font-bold text-foreground leading-tight" data-testid="college-detail-title">{college.name}</h1>
          <p className="text-xs text-muted-foreground">{college.district} · {college.type} · {examMode} Data</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-card-border rounded-xl p-4" data-testid="stat-autonomous">
          <div className="flex items-center gap-2 mb-2">
            <Award size={14} className="text-amber-500" />
            <span className="text-xs text-muted-foreground">Status</span>
          </div>
          <div className="text-sm font-bold text-foreground">
            {college.autonomous ? "VTU Autonomous" : "VTU Affiliated"}
          </div>
          {college.autonomous && (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded mt-1 inline-block">Autonomous</span>
          )}
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4" data-testid="stat-placement">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="text-xs text-muted-foreground">Placement Rate</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{college.placementRate}%</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4" data-testid="stat-ctc">
          <div className="flex items-center gap-2 mb-2">
            <Building size={14} className="text-blue-500" />
            <span className="text-xs text-muted-foreground">CTC Range</span>
          </div>
          <div className="text-sm font-bold text-foreground">₹{college.ctcMin}–{college.ctcMax} LPA</div>
          <div className="text-xs text-muted-foreground font-medium">Avg: ₹{college.averagePackage} LPA</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4" data-testid="stat-rating">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-amber-500" />
            <span className="text-xs text-muted-foreground">Rating</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{college.rating}</div>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} className={i < Math.floor(college.rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5">
        <h2 className="font-semibold text-sm text-foreground mb-4" data-testid="chart-heading">
          GM Category Cutoff Trends — {college.name}
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis
              reversed tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) => v.toLocaleString("en-IN")}
              label={{ value: "Rank (lower = better)", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))", offset: -5 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
              formatter={(v: number, name: string) => [v.toLocaleString("en-IN"), branchNames[name] || name]}
            />
            <Legend formatter={v => branchNames[v] || v} />
            {selectedBranches.map((bc, i) => (
              <Line key={bc} type="monotone" dataKey={bc} stroke={BRANCH_COLORS[i]} strokeWidth={2} dot={{ r: 4 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-2">Round 1, General Merit (GM) category. Lower rank = better.</p>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5">
        <h2 className="font-semibold text-sm text-foreground mb-4">Branch-wise Cutoffs (2025, Round 1, GM)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {selectedBranches.map(bc => {
            const branchInfo = branches.find(b => b.code === bc);
            const rec = cutoffRecords.find(r =>
              r.collegeCode === collegeCode && r.branchCode === bc && r.category === "GM" && r.year === 2025 && r.round === "Round 1"
            );
            return (
              <div key={bc} className="p-3 bg-muted/40 rounded-lg" data-testid={`branch-cutoff-${bc}`}>
                <div className="text-xs text-muted-foreground mb-1">{branchInfo?.name || bc}</div>
                <div className="text-lg font-bold text-foreground tabular-nums">
                  {rec ? rec.cutoffRank.toLocaleString("en-IN") : "N/A"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
