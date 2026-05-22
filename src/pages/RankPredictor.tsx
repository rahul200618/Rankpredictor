import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useExamMode } from "@/contexts/ExamModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { predictRank } from "@/data/mockData";
import { SEO } from "@/components/SEO";
import {
  Download, AlertCircle, Zap, TrendingUp, Target,
  Atom, FlaskConical, Calculator, ToggleLeft, ToggleRight,
  Save, Check, Clock, Trash2, ChevronDown, ChevronUp, Loader2,
  Sparkles
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AdBanner } from "@/components/AdBanner";

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

  const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];
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

interface SavedEntry {
  id: number;
  examMode: string;
  entryMode: string;
  phyKcet: number;
  chemKcet: number;
  mathKcet: number;
  kcetTotal: number;
  phyBoard: number;
  chemBoard: number;
  mathBoard: number;
  boardAvg: number;
  keaScore: number;
  predictedRankLow: number;
  predictedRankHigh: number;
  createdAt: string;
}

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

function RankGauge({ score }: { score: number }) {
  const pct = Math.min(score / 100, 1);
  const r = 52; const cx = 64; const cy = 68;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arc = (a1: number, sw: number) => {
    const r2 = toRad(a1); const r3 = toRad(a1 + sw);
    return `M ${cx + r * Math.cos(r2)} ${cy + r * Math.sin(r2)} A ${r} ${r} 0 ${sw > 180 ? 1 : 0} 1 ${cx + r * Math.cos(r3)} ${cy + r * Math.sin(r3)}`;
  };
  const circ = (240 / 360) * 2 * Math.PI * r;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <svg viewBox="0 0 128 90" className="w-36 h-24 shrink-0">
      <path d={arc(-210, 240)} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
      <path d={arc(-210, 240)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${pct * circ} ${circ}`}
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 18, fill: "currentColor", fontWeight: 800 }}>{score.toFixed(1)}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}>KEA Score</text>
    </svg>
  );
}

function EntryRow({ e, onDelete }: { e: SavedEntry; onDelete: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const date = new Date(e.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card transition-all">
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setOpen(v => !v)}>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Target size={14} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-foreground">{e.examMode}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">{e.kcetTotal}/180</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded font-bold">{e.boardAvg.toFixed(1)}% avg</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Rank: <strong className="text-foreground">{e.predictedRankLow.toLocaleString("en-IN")}–{e.predictedRankHigh.toLocaleString("en-IN")}</strong>
            <span className="mx-1.5">·</span>KEA: <strong className="text-foreground">{e.keaScore.toFixed(2)}</strong>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground hidden sm:block">{date}</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs">
            {[
              ["Physics (KCET)", e.phyKcet + "/60", "#60a5fa"],
              ["Chemistry (KCET)", e.chemKcet + "/60", "#34d399"],
              ["Maths (KCET)", e.mathKcet + "/60", "#a78bfa"],
              ["Physics (Board)", e.phyBoard + "/100", "#f472b6"],
              ["Chemistry (Board)", e.chemBoard + "/100", "#fb923c"],
              ["Maths (Board)", e.mathBoard + "/100", "#facc15"],
            ].map(([label, val, color]) => (
              <div key={label as string} className="bg-muted/50 rounded-lg px-3 py-2">
                <div className="text-muted-foreground">{label}</div>
                <div className="font-black mt-0.5" style={{ color: color as string }}>{val}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={() => onDelete(e.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RankPredictor() {
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

  const [phyKcet, setPhyKcet] = useState<number | "">("");
  const [chemKcet, setChemKcet] = useState<number | "">("");
  const [mathKcet, setMathKcet] = useState<number | "">("");

  const [phyBoard, setPhyBoard] = useState<number | "">("");
  const [chemBoard, setChemBoard] = useState<number | "">("");
  const [mathBoard, setMathBoard] = useState<number | "">("");

  const [simpleKcet, setSimpleKcet] = useState<number | "">("");
  const [simplePuc, setSimplePuc] = useState<number | "">("");
  const [subjectMode, setSubjectMode] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [calculated, setCalculated] = useState(false);

  // ── Save rank result to Supabase (fire-and-forget) ────────────────────────
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
        exam_mode: examMode,
        kcet_total: subjectMode
          ? (Number(phyKcet) || 0) + (Number(chemKcet) || 0) + (Number(mathKcet) || 0)
          : Number(simpleKcet) || 0,
        board_avg: subjectMode
          ? ((Number(phyBoard) || 0) + (Number(chemBoard) || 0) + (Number(mathBoard) || 0)) / 3
          : Number(simplePuc) || 0,
        kea_score: keaScore,
        predicted_rank_low: rankLow,
        predicted_rank_high: rankHigh,
      }, {
        onConflict: "phone,exam_mode"
      })
      .then(({ error }: any) => {
        if (error) console.warn("[student_rank_results] save failed:", error.message);
      });
  };

  const handlePredictClick = () => {
    const hasKcet = subjectMode ? (phyKcet !== "" || chemKcet !== "" || mathKcet !== "") : simpleKcet !== "";
    const hasBoard = subjectMode ? (phyBoard !== "" || chemBoard !== "" || mathBoard !== "") : simplePuc !== "";

    if (!hasKcet && !hasBoard) {
      toast({
        title: "No Marks Entered",
        description: "Please enter your KCET or Board marks first to calculate!",
        variant: "destructive"
      });
      return;
    }

    setCalculated(true);
    triggerConfetti();

    // Auto-save rank result to Supabase (non-blocking)
    const pred = predictRank(
      subjectMode
        ? (Number(phyKcet) || 0) + (Number(chemKcet) || 0) + (Number(mathKcet) || 0)
        : Number(simpleKcet) || 0,
      subjectMode
        ? ((Number(phyBoard) || 0) + (Number(chemBoard) || 0) + (Number(mathBoard) || 0)) / 3
        : Number(simplePuc) || 0
    );
    saveRankResult(pred.low, pred.high, pred.composite);

    // Smooth scroll to the result card on mobile
    if (window.innerWidth < 1024 && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const kcetTotal = subjectMode ? (Number(phyKcet) || 0) + (Number(chemKcet) || 0) + (Number(mathKcet) || 0) : (Number(simpleKcet) || 0);
  const pucPct = subjectMode ? ((Number(phyBoard) || 0) + (Number(chemBoard) || 0) + (Number(mathBoard) || 0)) / 3 : (Number(simplePuc) || 0);
  const prediction = predictRank(kcetTotal, pucPct);

  const keaScore = prediction.composite;
  const rank = prediction.rank2026; // 2026 Predicted Rank
  const rankLow = prediction.low;
  const rankHigh = prediction.high;
  const confidence = prediction.confidence;

  const confidenceConfig =
    confidence === "High Confidence"
      ? { color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", width: "83%", dot: "#10b981" }
      : confidence === "Moderate Confidence"
        ? { color: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", width: "58%", dot: "#f59e0b" }
        : { color: "text-red-600 dark:text-red-400", bar: "bg-red-500", width: "35%", dot: "#ef4444" };

  useEffect(() => {
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 150);
    return () => clearTimeout(t);
  }, [phyKcet, chemKcet, mathKcet, phyBoard, chemBoard, mathBoard, simpleKcet, simplePuc]);

  const handleSave = async () => {
    if (!user) {
      alert("Please log in to save your marks to the cloud.");
      return;
    }
    setSaveState("saving");
    try {
      const newEntry = {
        user_id: user.id,
        exam_mode: examMode,
        entry_mode: subjectMode ? "subject" : "simple",
        phy_kcet: subjectMode ? phyKcet : Math.round(simpleKcet / 3),
        chem_kcet: subjectMode ? chemKcet : Math.round(simpleKcet / 3),
        math_kcet: subjectMode ? mathKcet : Math.round(simpleKcet / 3),
        kcet_total: kcetTotal,
        phy_board: subjectMode ? phyBoard : Math.round(simplePuc),
        chem_board: subjectMode ? chemBoard : Math.round(simplePuc),
        math_board: subjectMode ? mathBoard : Math.round(simplePuc),
        board_avg: pucPct,
        kea_score: keaScore,
        predicted_rank_low: rankLow,
        predicted_rank_high: rankHigh,
      };

      const { data, error } = await supabase.from('saved_marks').insert([newEntry]).select().single();
      if (error) throw error;

      const mappedEntry: SavedEntry = {
        id: data.id,
        examMode: data.exam_mode,
        entryMode: data.entry_mode,
        phyKcet: data.phy_kcet,
        chemKcet: data.chem_kcet,
        mathKcet: data.math_kcet,
        kcetTotal: data.kcet_total,
        phyBoard: data.phy_board,
        chemBoard: data.chem_board,
        mathBoard: data.math_board,
        boardAvg: data.board_avg,
        keaScore: data.kea_score,
        predictedRankLow: data.predicted_rank_low,
        predictedRankHigh: data.predicted_rank_high,
        createdAt: data.created_at,
      };

      setSavedEntries(prev => [mappedEntry, ...prev]);
      setSaveState("saved");
      setShowHistory(true);
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('saved_marks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mappedData: SavedEntry[] = data.map((d: any) => ({
          id: d.id,
          examMode: d.exam_mode,
          entryMode: d.entry_mode,
          phyKcet: d.phy_kcet,
          chemKcet: d.chem_kcet,
          mathKcet: d.math_kcet,
          kcetTotal: d.kcet_total,
          phyBoard: d.phy_board,
          chemBoard: d.chem_board,
          mathBoard: d.math_board,
          boardAvg: d.board_avg,
          keaScore: d.kea_score,
          predictedRankLow: d.predicted_rank_low,
          predictedRankHigh: d.predicted_rank_high,
          createdAt: d.created_at,
        }));
        setSavedEntries(mappedData);
      }
    } catch { /* ignore */ }
    finally { setLoadingHistory(false); }
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from('saved_marks').delete().eq('id', id);
      if (!error) {
        setSavedEntries(prev => prev.filter(e => e.id !== id));
      }
    } catch { /* ignore */ }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      if (cardRef.current) {
        const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
        const link = document.createElement("a");
        link.download = `rankprediction-rank-card-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } catch (e) { console.error(e); }
    finally { setDownloading(false); }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <SEO
        title={`${examMode} Rank Predictor & Marks vs Rank 2025/2026`}
        description={`Predict your ${examMode} 2025 & 2026 expected ranks instantly. Highly calibrated ${examMode} Marks vs Rank calculator based on the official KEA scoring model.`}
        keywords={`${examMode.toLowerCase()} rank predictor, ${examMode.toLowerCase()} marks vs rank, ${examMode.toLowerCase()} 2026 rank predictor, ${examMode.toLowerCase()} 2025 marks vs rank, comedk rank predictor, comedk marks vs rank, kea rank calculator`}
      />

      {/* Header Title */}
      <div className="animate-slide-up flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
          <Target size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Rank Predictor</h1>
          <p className="text-xs text-muted-foreground">{examMode} 2026 — Live KEA Score Calculator & Analytics</p>
        </div>
      </div>

      {/* Main Grid Container: Left (Inputs) vs Right (Sticky Results Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── LEFT SIDE (Input Marks) ── */}
        <div className="lg:col-span-7 space-y-5 animate-slide-up">

          {/* Subject-Wise Marks Cards */}
          <div className="space-y-4">
            {/* Board Marks */}
            <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-extrabold text-foreground">Board (PUC / 12th) Marks</div>
                  <div className="text-xs text-muted-foreground">Enter marks out of 100 per subject</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black gradient-text tabular-nums">{pucPct.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">PCM average</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <NumInput label="Physics" value={phyBoard} max={100} onChange={setPhyBoard} icon={Atom} color="#f472b6" sublabel="Phy" />
                <NumInput label="Chemistry" value={chemBoard} max={100} onChange={setChemBoard} icon={FlaskConical} color="#fb923c" sublabel="Chem" />
                <NumInput label="Maths" value={mathBoard} max={100} onChange={setMathBoard} icon={Calculator} color="#facc15" sublabel="Math" />
              </div>
            </div>

            {/* KCET Marks */}
            <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-extrabold text-foreground">{examMode} Marks</div>
                  <div className="text-xs text-muted-foreground">Max 60 per subject</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black gradient-text tabular-nums">{kcetTotal}</div>
                  <div className="text-xs text-muted-foreground">/ 180 total</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <NumInput label="Physics" value={phyKcet} max={60} onChange={setPhyKcet} icon={Atom} color="#60a5fa" sublabel="Phy" />
                <NumInput label="Chemistry" value={chemKcet} max={60} onChange={setChemKcet} icon={FlaskConical} color="#34d399" sublabel="Chem" />
                <NumInput label="Maths" value={mathKcet} max={60} onChange={setMathKcet} icon={Calculator} color="#a78bfa" sublabel="Math" />
              </div>
              <div className="mt-4 h-3 rounded-full overflow-hidden flex gap-0.5">
                <div className="h-full rounded-l-full transition-all duration-300" style={{ width: `${((Number(phyKcet) || 0) / 180) * 100}%`, background: "#60a5fa" }} />
                <div className="h-full transition-all duration-300" style={{ width: `${((Number(chemKcet) || 0) / 180) * 100}%`, background: "#34d399" }} />
                <div className="h-full transition-all duration-300" style={{ width: `${((Number(mathKcet) || 0) / 180) * 100}%`, background: "#a78bfa" }} />
                <div className="flex-1 h-full bg-muted rounded-r-full" />
              </div>
              <div className="flex gap-4 mt-1.5">
                {[["Physics", "#60a5fa", phyKcet], ["Chemistry", "#34d399", chemKcet], ["Maths", "#a78bfa", mathKcet]].map(([l, c, v]) => (
                  <div key={l as string} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: c as string }} />
                    <span className="text-[10px] text-muted-foreground">{l}: <strong style={{ color: c as string }}>{v}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Subject Mode only */}

          {/* Predict button at the bottom of the left column */}
          <button
            onClick={handlePredictClick}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-primary via-indigo-600 to-violet-600 hover:from-primary/95 hover:to-violet-600/95 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.01]"
          >
            <Zap size={16} className="animate-pulse" />
            {calculated ? "Recalculate My Rank 🚀" : "Predict My Rank 🚀"}
          </button>
        </div>

        {/* ── RIGHT SIDE (Predicted Rank - Sticky Sidebar) ── */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-5 animate-slide-up delay-100">

          {!calculated ? (
            /* Beautiful Premium Placeholder Card */
            <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-8 space-y-6 shadow-lg text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-inner shadow-primary/20">
                <Sparkles size={28} className="animate-bounce" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="text-lg font-black text-foreground">Awaiting Your Marks</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your subject-wise or overall KCET and Board scores on the left, then click <strong>Predict My Rank</strong> to reveal your detailed forecast!
                </p>
              </div>
              <button
                onClick={handlePredictClick}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-primary to-violet-600 text-white rounded-xl text-xs font-extrabold hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/30"
              >
                <Zap size={14} className="animate-pulse" /> Predict Rank Now 🚀
              </button>
            </div>
          ) : (
            /* Prediction Result Card */
            <>
              <div ref={cardRef} className="relative overflow-hidden bg-card border-2 border-primary/25 rounded-2xl p-6 space-y-5 shadow-lg shadow-primary/10">
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">RankPrediction</div>
                    <div className="text-xs text-muted-foreground">{examMode} Rank Prediction</div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: confidenceConfig.dot }} />
                      <span className={`text-xs font-bold ${confidenceConfig.color}`}>{confidence}</span>
                    </div>
                  </div>
                  <RankGauge score={keaScore} />
                </div>
                <div className={`text-center py-5 rounded-xl bg-gradient-to-b from-primary/8 to-violet-500/5 border border-primary/15 transition-all duration-500 ${revealed ? "opacity-100" : "opacity-0"}`}>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-center gap-1.5">
                    <TrendingUp size={11} /> Predicted Rank Range
                  </div>
                  <div className="text-4xl md:text-5xl font-black tabular-nums gradient-text">
                    {rankLow.toLocaleString("en-IN")} – {rankHigh.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Based on 2023–2025 {examMode} data</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 flex-col sm:flex-row lg:flex-col">
                <button onClick={() => setLocation(`/college-finder?rank=${rank}&category=GM&branch=CS`)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-primary to-violet-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/30">
                  <Target size={14} />
                  Predict Eligible Colleges 🎯
                </button>
              </div>
            </>
          )}



          {/* Warning Disclaimer */}
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-normal">
              Rank prediction is an estimate based on historical {examMode} trends. Always verify details with the official KEA counseling portal.
            </p>
          </div>

          {/* AdSense — rectangle ad below disclaimer */}
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
