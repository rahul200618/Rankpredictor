import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useExamMode } from "@/contexts/ExamModeContext";
import { predictRank } from "@/data/mockData";
import {
  Download, AlertCircle, Zap, TrendingUp, Target,
  Atom, FlaskConical, Calculator, ToggleLeft, ToggleRight,
  Save, Check, Clock, Trash2, ChevronDown, ChevronUp, Loader2
} from "lucide-react";

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
  label: string; value: number; max: number;
  onChange: (v: number) => void; icon: React.ElementType;
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
          onChange={e => { const v = Math.max(0, Math.min(max, Number(e.target.value))); onChange(isNaN(v) ? 0 : v); }}
          className="w-full px-3 py-2.5 pr-12 text-lg font-extrabold tabular-nums text-center rounded-xl border-2 focus:outline-none transition-all duration-200 bg-background"
          style={{ borderColor: color + "40", color }}
          onFocus={e => (e.target.style.borderColor = color + "90")}
          onBlur={e => (e.target.style.borderColor = color + "40")}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">/{max}</span>
      </div>
      <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${(value / max) * 100}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
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
  const [, setLocation] = useLocation();

  const [phyKcet, setPhyKcet] = useState(40);
  const [chemKcet, setChemKcet] = useState(40);
  const [mathKcet, setMathKcet] = useState(40);

  const [phyBoard, setPhyBoard] = useState(85);
  const [chemBoard, setChemBoard] = useState(85);
  const [mathBoard, setMathBoard] = useState(85);

  const [simpleKcet, setSimpleKcet] = useState(120);
  const [simplePuc, setSimplePuc] = useState(85);
  const [subjectMode, setSubjectMode] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const kcetTotal = subjectMode ? phyKcet + chemKcet + mathKcet : simpleKcet;
  const pucPct = subjectMode ? (phyBoard + chemBoard + mathBoard) / 3 : simplePuc;
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
    setSaveState("saving");
    try {
      const body = {
        examMode,
        entryMode: subjectMode ? "subject" : "simple",
        phyKcet: subjectMode ? phyKcet : Math.round(simpleKcet / 3),
        chemKcet: subjectMode ? chemKcet : Math.round(simpleKcet / 3),
        mathKcet: subjectMode ? mathKcet : Math.round(simpleKcet / 3),
        kcetTotal,
        phyBoard: subjectMode ? phyBoard : Math.round(simplePuc),
        chemBoard: subjectMode ? chemBoard : Math.round(simplePuc),
        mathBoard: subjectMode ? mathBoard : Math.round(simplePuc),
        boardAvg: pucPct,
        keaScore,
        predictedRankLow: rankLow,
        predictedRankHigh: rankHigh,
      };
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved: SavedEntry = await res.json();
      setSavedEntries(prev => [saved, ...prev]);
      setSaveState("saved");
      setShowHistory(true);
      setTimeout(() => setSaveState("idle"), 3000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/marks");
      if (res.ok) setSavedEntries(await res.json());
    } catch { /* ignore */ }
    finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleDelete = async (id: number) => {
    setSavedEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      if (cardRef.current) {
        const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
        const link = document.createElement("a");
        link.download = `predictrank-rank-card-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } catch (e) { console.error(e); }
    finally { setDownloading(false); }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-5">
      <div className="animate-slide-up flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
          <Target size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Rank Predictor</h1>
          <p className="text-xs text-muted-foreground">{examMode} 2025 — Live KEA Score Calculator</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/15 rounded-2xl animate-scale-in">
        <div>
          <div className="text-sm font-bold text-foreground">{subjectMode ? "Subject-wise Entry" : "Simple Entry"}</div>
          <div className="text-xs text-muted-foreground">{subjectMode ? "Enter marks for each subject separately" : "Enter totals directly with sliders"}</div>
        </div>
        <button onClick={() => setSubjectMode(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 bg-background hover:bg-primary/5 transition-all text-sm font-bold text-primary">
          {subjectMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          {subjectMode ? "Switch to Simple" : "Enter by Subject"}
        </button>
      </div>

      {subjectMode && (
        <div className="space-y-4 animate-scale-in">
          <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-extrabold text-foreground">{examMode} Marks</div>
                <div className="text-xs text-muted-foreground">Max 60 per subject</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black gradient-text tabular-nums">{phyKcet + chemKcet + mathKcet}</div>
                <div className="text-xs text-muted-foreground">/ 180 total</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumInput label="Physics" value={phyKcet} max={60} onChange={setPhyKcet} icon={Atom} color="#60a5fa" sublabel="Phy" />
              <NumInput label="Chemistry" value={chemKcet} max={60} onChange={setChemKcet} icon={FlaskConical} color="#34d399" sublabel="Chem" />
              <NumInput label="Maths" value={mathKcet} max={60} onChange={setMathKcet} icon={Calculator} color="#a78bfa" sublabel="Math" />
            </div>
            <div className="mt-4 h-3 rounded-full overflow-hidden flex gap-0.5">
              <div className="h-full rounded-l-full transition-all duration-300" style={{ width: `${(phyKcet / 180) * 100}%`, background: "#60a5fa" }} />
              <div className="h-full transition-all duration-300" style={{ width: `${(chemKcet / 180) * 100}%`, background: "#34d399" }} />
              <div className="h-full transition-all duration-300" style={{ width: `${(mathKcet / 180) * 100}%`, background: "#a78bfa" }} />
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

          <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-extrabold text-foreground">Board (PUC / 12th) Marks</div>
                <div className="text-xs text-muted-foreground">Enter marks out of 100 per subject</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black gradient-text tabular-nums">{((phyBoard + chemBoard + mathBoard) / 3).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">PCM average</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumInput label="Physics" value={phyBoard} max={100} onChange={setPhyBoard} icon={Atom} color="#f472b6" sublabel="Phy" />
              <NumInput label="Chemistry" value={chemBoard} max={100} onChange={setChemBoard} icon={FlaskConical} color="#fb923c" sublabel="Chem" />
              <NumInput label="Maths" value={mathBoard} max={100} onChange={setMathBoard} icon={Calculator} color="#facc15" sublabel="Math" />
            </div>
          </div>
        </div>
      )}

      {!subjectMode && (
        <div className="bg-card border border-card-border rounded-2xl p-5 space-y-6 animate-scale-in shadow-sm">
          {[
            { label: `${examMode} Total Marks`, value: simpleKcet, min: 0, max: 180, onChange: setSimpleKcet, unit: "", grad: "from-blue-500 to-indigo-500" },
            { label: "Board PCM Percentage", value: simplePuc, min: 35, max: 100, onChange: setSimplePuc, unit: "%", grad: "from-violet-500 to-purple-500" },
          ].map(({ label, value, min, max, onChange, unit, grad }) => {
            const pct = ((value - min) / (max - min)) * 100;
            return (
              <div key={label}>
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-bold text-foreground">{label}</span>
                  <span className="text-lg font-extrabold gradient-text tabular-nums">{value}{unit}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-lg leading-none">−</button>
                  <div className="relative flex-1 h-3 bg-muted rounded-full">
                    <div className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${grad} transition-all`} style={{ width: `${pct}%` }} />
                    <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
                    <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-primary rounded-full shadow-lg shadow-primary/30 pointer-events-none" style={{ left: `calc(${pct}% - 10px)` }} />
                  </div>
                  <button onClick={() => onChange(Math.min(max, value + 1))} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-lg leading-none">+</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-3 p-3.5 bg-gradient-to-r from-primary/5 to-violet-500/5 rounded-xl border border-primary/15">
        <Zap size={13} className="text-primary shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-foreground mb-0.5">KEA Score Formula</div>
          <code className="text-xs text-muted-foreground font-mono">KEA = (Total ÷ 1.8) × 0.5 + (PCM avg%) × 0.5</code>
          {subjectMode && (
            <div className="text-xs text-muted-foreground mt-1">
              KCET <strong className="text-foreground">{kcetTotal}/180</strong> · Board avg <strong className="text-foreground">{pucPct.toFixed(1)}%</strong>
            </div>
          )}
        </div>
      </div>

      <div ref={cardRef} className="relative overflow-hidden bg-card border-2 border-primary/25 rounded-2xl p-6 space-y-5 shadow-lg shadow-primary/10">
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">PredictRank</div>
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
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Prediction confidence</span>
            <span className={`font-bold ${confidenceConfig.color}`}>{confidence}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${confidenceConfig.bar} transition-all duration-700`} style={{ width: confidenceConfig.width }} />
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-3">
          <span>{examMode}: <strong className="text-foreground">{kcetTotal}/180</strong></span>
          <span>Board: <strong className="text-foreground">{pucPct.toFixed(1)}%</strong></span>
          <span>KEA: <strong className="text-foreground">{keaScore.toFixed(2)}</strong></span>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap animate-slide-up">
        <button onClick={handleSave} disabled={saveState === "saving" || saveState === "saved"}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 shadow-lg disabled:scale-100 ${
            saveState === "saved"
              ? "bg-emerald-500 text-white shadow-emerald-500/30"
              : saveState === "error"
              ? "bg-red-500 text-white shadow-red-500/30"
              : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 hover:opacity-90"
          } disabled:opacity-70`}>
          {saveState === "saving" ? <Loader2 size={14} className="animate-spin" /> :
           saveState === "saved" ? <Check size={14} /> :
           <Save size={14} />}
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : saveState === "error" ? "Error — retry?" : "Save Marks"}
        </button>

        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:scale-100">
          <Download size={14} />
          {downloading ? "Generating…" : "Download Card"}
        </button>

        <button onClick={() => setLocation(`/college-finder?rank=${rank}&category=GM&branch=CS`)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-violet-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/30">
          <Target size={14} />
          Predict Eligible Colleges 🎯
        </button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <button onClick={() => setShowHistory(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/40 hover:bg-muted/60 transition-colors">
          <div className="flex items-center gap-2.5">
            <Clock size={14} className="text-primary" />
            <span className="text-sm font-bold text-foreground">Saved Entries</span>
            {savedEntries.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-black">{savedEntries.length}</span>
            )}
          </div>
          {showHistory ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </button>

        {showHistory && (
          <div className="p-4 space-y-2.5">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading history…
              </div>
            ) : savedEntries.length === 0 ? (
              <div className="text-center py-8">
                <Save size={28} className="text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No saved entries yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Enter your marks and hit <strong>Save Marks</strong> above.</p>
              </div>
            ) : (
              savedEntries.map(e => <EntryRow key={e.id} e={e} onDelete={handleDelete} />)
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">Rank prediction is an estimate based on historical {examMode} trends. Always verify with the official KEA portal.</p>
      </div>
    </div>
  );
}
