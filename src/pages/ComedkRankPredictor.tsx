import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useExamMode } from "@/contexts/ExamModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import {
  AlertCircle, Zap, TrendingUp, Target,
  Atom, FlaskConical, Calculator, ToggleLeft, ToggleRight,
  Sparkles, ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AdBanner } from "@/components/AdBanner";
import {
  COMEDK_REDDIT_SOURCE_URL,
  COMEDK_2025_COMMUNITY_POINTS,
  getComedkKeyEstimates,
  predictComedkRankFromMarks,
  getShiftAnalytics,
  ComedkShift,
  COMEDK_SHIFTS,
} from "@/lib/comedk-rank-predictor";

// ─── Shift Labels Mapping ───────────────────────────────────────────────────────
const SHIFT_LABELS: Record<ComedkShift, string> = {
  "10s1": "10th May - Shift 1",
  "10s2": "10th May - Shift 2",
  "10s3": "10th May - Shift 3",
  "25may": "25th May",
  "unknown": "I Don't Know / Blend All",
};

// ─── Custom Canvas Confetti Blaster (Zero Dependency) ─────────────────────────────
const triggerConfetti = () => {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#f59e0b", "#f97316", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6"];
  const particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
  }> = [];

  // Create 150 particles bursting from below
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 120,
      y: canvas.height + 20,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 16,
      speedY: -Math.random() * 22 - 12,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }

  let animationFrameId: number;
  const update = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.45; // gravity
      p.speedX *= 0.985; // air resistance
      p.rotation += p.rotationSpeed;

      if (p.y < canvas.height + 50) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (active) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      document.body.removeChild(canvas);
    }
  };

  update();
};





function NumInput({ label, value, max, onChange, icon: Icon, color, sublabel }: {
  label: string; value: number | ""; max: number;
  onChange: (v: number | "") => void; icon: React.ElementType;
  color: string; sublabel?: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: color + "20" }}>
          <Icon size={11} style={{ color }} />
        </div>
        <span className="text-xs font-bold text-foreground truncate">{label}</span>
        {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
      </div>
      <div className="relative">
        <input
          type="number" min={0} max={max} value={value}
          onChange={e => {
            if (e.target.value === "") { onChange(""); return; }
            const v = Math.max(0, Math.min(max, Number(e.target.value)));
            onChange(isNaN(v) ? "" : v);
          }}
          className="w-full px-3 py-2.5 pr-12 text-lg font-extrabold tabular-nums text-center rounded-xl border-2 focus:outline-none transition-all duration-200 bg-background"
          style={{ borderColor: color + "40", color }}
          onFocus={e => (e.target.style.borderColor = color + "90")}
          onBlur={e => (e.target.style.borderColor = color + "40")}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">/{max}</span>
      </div>
      <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((Number(value) || 0) / max) * 100}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
      </div>
    </div>
  );
}

function PercentileGauge({ score }: { score: number }) {
  const pct = Math.min(score / 100, 1);
  const r = 52; const cx = 64; const cy = 68;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arc = (a1: number, sw: number) => {
    const r2 = toRad(a1); const r3 = toRad(a1 + sw);
    return `M ${cx + r * Math.cos(r2)} ${cy + r * Math.sin(r2)} A ${r} ${r} 0 ${sw > 180 ? 1 : 0} 1 ${cx + r * Math.cos(r3)} ${cy + r * Math.sin(r3)}`;
  };
  const circ = (240 / 360) * 2 * Math.PI * r;
  const color = score >= 95 ? "#10b981" : score >= 85 ? "#3b82f6" : score >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <svg viewBox="0 0 128 90" className="w-36 h-24 shrink-0">
      <path d={arc(-210, 240)} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
      <path d={arc(-210, 240)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${pct * circ} ${circ}`}
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 18, fill: "currentColor", fontWeight: 800 }}>{score.toFixed(2)}%</text>
      <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}>Percentile</text>
    </svg>
  );
}

export default function ComedkRankPredictor() {
  const { examMode } = useExamMode();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user's interested subjects for enriching rank saves
  const [interestedSubjects, setInterestedSubjects] = useState<string[]>([]);
  useEffect(() => {
    if (!user) return;
    const phone = "phoneNumber" in user ? (user.phoneNumber ?? "") : "";
    if (!phone) return;
    supabase
      .from("user_profiles")
      .select("interested_subjects")
      .eq("phone", phone)
      .single()
      .then(({ data }) => {
        if (data?.interested_subjects) setInterestedSubjects(data.interested_subjects);
      });
  }, [user]);

  // Marks inputs
  const [phyComedk, setPhyComedk] = useState<number | "">("");
  const [chemComedk, setChemComedk] = useState<number | "">("");
  const [mathComedk, setMathComedk] = useState<number | "">("");
  const [simpleComedk, setSimpleComedk] = useState<number | "">("");

  // Mode: Subject-Wise vs Overall
  const [subjectMode, setSubjectMode] = useState(true);

  // Shift selection
  const [shift, setShift] = useState<ComedkShift>("unknown");

  const [revealed, setRevealed] = useState(false);
  const [calculated, setCalculated] = useState(false);

  // Calculate dynamic totals
  const comedkTotal = subjectMode 
    ? (Number(phyComedk) || 0) + (Number(chemComedk) || 0) + (Number(mathComedk) || 0) 
    : (Number(simpleComedk) || 0);

  // Run dynamic math from our highly calibrated Reddit curve engine
  const prediction = predictComedkRankFromMarks(comedkTotal, shift);
  const keyEstimates = getComedkKeyEstimates(shift);
  const analytics = getShiftAnalytics(comedkTotal);

  const keaScore = parseFloat(prediction.percentile); // store float percentile in kea_score column
  const rank = prediction.expectedRank;
  const rankLow = prediction.optimisticRank;
  const rankHigh = prediction.pessimisticRank;
  const confidence = prediction.confidence;

  const confidenceConfig =
    confidence === "High"
      ? { color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", width: "85%", dot: "#10b981" }
      : confidence === "Medium"
        ? { color: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", width: "60%", dot: "#f59e0b" }
        : { color: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", width: "35%", dot: "#ef4444" };

  useEffect(() => {
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 150);
    return () => clearTimeout(t);
  }, [phyComedk, chemComedk, mathComedk, simpleComedk, shift]);

  // ── Save rank result to Supabase student_rank_results (Leads table - unified) ──
  const saveRankResult = (rankLow: number, rankHigh: number, keaScore: number) => {
    if (!user) return;
    const phone = "phoneNumber" in user ? (user.phoneNumber ?? "") : "";
    const fullName = "displayName" in user ? (user.displayName ?? "") : "";
    (supabase as any)
      .from("student_rank_results")
      .upsert({
        phone,
        full_name: fullName,
        interested_subjects: interestedSubjects,
        exam_mode: "COMEDK",
        kcet_total: comedkTotal,
        board_avg: null,
        kea_score: keaScore,
        predicted_rank_low: rankLow,
        predicted_rank_high: rankHigh,
        shift: shift,
      }, {
        onConflict: "phone,exam_mode"
      })
      .then(({ error }: any) => {
        if (error) console.warn("[student_rank_results] save failed:", error.message);
      });
  };

  const handlePredictClick = () => {
    const hasMarks = subjectMode 
      ? (phyComedk !== "" || chemComedk !== "" || mathComedk !== "") 
      : simpleComedk !== "";

    if (!hasMarks) {
      toast({
        title: "No Marks Entered",
        description: "Please enter your COMEDK marks first to calculate!",
        variant: "destructive"
      });
      return;
    }

    setCalculated(true);
    triggerConfetti();

    // Auto-save rank result to Supabase student_rank_results table (non-blocking)
    saveRankResult(rankLow, rankHigh, keaScore);

    // Smooth scroll to the result card on mobile
    if (window.innerWidth < 1024) {
      document.getElementById('comedk-result-card')?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <SEO
        title="COMEDK 2026 Rank Predictor - Marks vs Rank & Shift Analytics"
        description="Predict your COMEDK expected ranks instantly. Highly calibrated shift-wise Marks vs Rank calculator based on community reports and monotonic smoothing."
        keywords="comedk rank predictor, comedk marks vs rank, comedk 2026, marks vs rank 2025, shift calculator, comedk shift"
      />

      {/* Header Title */}
      <div className="animate-slide-up flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
          <Target size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">COMEDK Rank Predictor</h1>
          <p className="text-xs text-muted-foreground">COMEDK 2026 — Community Calibrated Curve & Shift Insights</p>
        </div>
      </div>

      {/* Main Grid Container: Left (Inputs) vs Right (Sticky Results Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── LEFT SIDE (Input Marks) ── */}
        <div className="lg:col-span-7 space-y-5 animate-slide-up">

          {/* Toggle for Subject-Wise vs Overall */}
          <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs font-bold text-foreground">Calculation Mode</div>
              <div className="text-[10px] text-muted-foreground">Subject breakdown or quick single entry</div>
            </div>
            <button
              onClick={() => setSubjectMode(s => !s)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-muted/60 hover:bg-muted text-xs font-black text-foreground rounded-xl transition-all border border-border"
            >
              {subjectMode ? (
                <>
                  <ToggleRight size={16} className="text-amber-500 shrink-0" />
                  Subject-Wise (Physics, Chemistry, Maths)
                </>
              ) : (
                <>
                  <ToggleLeft size={16} className="text-muted-foreground shrink-0" />
                  Overall Score (0–180)
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {/* COMEDK Marks Input Card */}
            <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-extrabold text-foreground">COMEDK Exam Score</div>
                  <div className="text-xs text-muted-foreground">
                    {subjectMode ? "Max 60 per subject" : "Overall score out of 180"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-500 tabular-nums">{comedkTotal}</div>
                  <div className="text-xs text-muted-foreground">/ 180 total</div>
                </div>
              </div>

              {subjectMode ? (
                <div className="grid grid-cols-3 gap-3">
                  <NumInput label="Physics" value={phyComedk} max={60} onChange={setPhyComedk} icon={Atom} color="#60a5fa" sublabel="Phy" />
                  <NumInput label="Chemistry" value={chemComedk} max={60} onChange={setChemComedk} icon={FlaskConical} color="#34d399" sublabel="Chem" />
                  <NumInput label="Maths" value={mathComedk} max={60} onChange={setMathComedk} icon={Calculator} color="#a78bfa" sublabel="Math" />
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="range" min={0} max={180} value={simpleComedk || 0}
                    onChange={e => setSimpleComedk(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-muted rounded-lg appearance-none"
                  />
                  <div className="relative">
                    <input
                      type="number" min={0} max={180} value={simpleComedk}
                      onChange={e => {
                        if (e.target.value === "") { setSimpleComedk(""); return; }
                        const v = Math.max(0, Math.min(180, Number(e.target.value)));
                        setSimpleComedk(isNaN(v) ? "" : v);
                      }}
                      className="w-full px-3 py-2.5 text-lg font-extrabold tabular-nums text-center rounded-xl border-2 border-amber-500/30 text-amber-600 focus:outline-none focus:border-amber-500 transition-all bg-background"
                      placeholder="Overall score (e.g. 105)"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">/180</span>
                  </div>
                </div>
              )}

              {subjectMode && (
                <>
                  <div className="mt-4 h-3 rounded-full overflow-hidden flex gap-0.5">
                    <div className="h-full rounded-l-full transition-all duration-300" style={{ width: `${((Number(phyComedk) || 0) / 180) * 100}%`, background: "#60a5fa" }} />
                    <div className="h-full transition-all duration-300" style={{ width: `${((Number(chemComedk) || 0) / 180) * 100}%`, background: "#34d399" }} />
                    <div className="h-full transition-all duration-300" style={{ width: `${((Number(mathComedk) || 0) / 180) * 100}%`, background: "#a78bfa" }} />
                    <div className="flex-1 h-full bg-muted rounded-r-full" />
                  </div>
                  <div className="flex gap-4 mt-1.5">
                    {[["Physics", "#60a5fa", phyComedk], ["Chemistry", "#34d399", chemComedk], ["Maths", "#a78bfa", mathComedk]].map(([l, c, v]) => (
                      <div key={l as string} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: c as string }} />
                        <span className="text-[10px] text-muted-foreground">{l}: <strong style={{ color: c as string }}>{v || 0}</strong></span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Shift Selector Card */}
            <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm space-y-3">
              <div>
                <div className="text-sm font-extrabold text-foreground">COMEDK Exam Shift</div>
                <div className="text-xs text-muted-foreground">Community prediction adjusts based on shift difficulty curve</div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {COMEDK_SHIFTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setShift(s)}
                    className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all border ${
                      shift === s
                        ? "bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "bg-transparent text-muted-foreground border-border hover:bg-amber-500/5 hover:text-amber-500"
                    }`}
                  >
                    {SHIFT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Predict Rank Button */}
          <button
            onClick={handlePredictClick}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all hover:scale-[1.01]"
          >
            <Zap size={16} className="animate-pulse" />
            {calculated ? "Recalculate My Rank 🚀" : "Predict My Rank 🚀"}
          </button>
        </div>

        {/* ── RIGHT SIDE (Predicted Rank - Sticky Sidebar) ── */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-5 animate-slide-up delay-100">

          {!calculated ? (
            /* Premium Placeholder Card */
            <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-8 space-y-6 shadow-lg text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center shadow-inner shadow-amber-500/20">
                <Sparkles size={28} className="animate-bounce" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="text-lg font-black text-foreground">Awaiting Your Marks</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your subject-wise or overall COMEDK scores on the left, then click <strong>Predict My Rank</strong> to reveal your detailed forecast!
                </p>
              </div>
              <button
                onClick={handlePredictClick}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-extrabold hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/30"
              >
                <Zap size={14} className="animate-pulse" /> Predict Rank Now 🚀
              </button>
            </div>
          ) : (
            /* Prediction Result Card */
            <>
              <div id="comedk-result-card" className="relative overflow-hidden bg-card border-2 border-amber-500/25 rounded-2xl p-6 space-y-5 shadow-lg shadow-amber-500/10">
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-amber-500/8 blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">RankPrediction</div>
                    <div className="text-xs text-muted-foreground">COMEDK Expected Percentile</div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: confidenceConfig.dot }} />
                      <span className={`text-xs font-bold ${confidenceConfig.color}`}>Confidence: {confidence}</span>
                    </div>
                  </div>
                  <PercentileGauge score={keaScore} />
                </div>

                <div className={`text-center py-5 rounded-xl bg-gradient-to-b from-amber-500/8 to-orange-500/5 border border-amber-500/15 transition-all duration-500 ${revealed ? "opacity-100" : "opacity-0"}`}>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-center gap-1.5">
                    <TrendingUp size={11} /> Predicted Rank Range
                  </div>
                  <div className="text-4xl md:text-5xl font-black tabular-nums text-amber-500">
                    {rankLow.toLocaleString("en-IN")} – {rankHigh.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2">
                    Shift-adjusted midpoint: <strong>{rank.toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              </div>

              {/* Shift Difficulty Insights */}
              {shift !== "unknown" && (
                <div className="rounded-2xl border border-amber-300/40 bg-amber-50/50 p-4 dark:bg-amber-950/20 text-xs">
                  <div className="flex items-start gap-2.5">
                    <TrendingUp className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-amber-900 dark:text-amber-200">Shift Insight</div>
                      <div className="text-muted-foreground mt-1 leading-normal">
                        {shift === analytics.hardest 
                          ? "You took the hardest shift! Your rank gets a massive boost relative to the average. This means a slightly lower marks input yields a highly competitive rank." 
                          : shift === analytics.easiest 
                            ? "You took the easiest shift. The rank competition is slightly higher for the same marks. Standard bounds are slightly conservative." 
                            : "Your shift was moderately difficult, sitting near the general average curve."
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <button onClick={() => setLocation(`/college-finder?rank=${rank}&category=GM&branch=CS`)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/30">
                <Target size={14} />
                Predict Eligible Colleges 🎯
              </button>
            </>
          )}

          {/* Warning Disclaimer */}
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-normal">
              Rank prediction is an estimate based on historical COMEDK trends. Always verify details with the official counseling portal.
            </p>
          </div>

          {/* AdSense Banner */}
          <AdBanner
            slot="9020022771"
            format="rectangle"
            className="mt-2"
          />

        </div>

      </div>


    </div>
  );
}
