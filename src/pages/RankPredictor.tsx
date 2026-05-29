import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useExamMode } from "@/contexts/ExamModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { predictRank } from "@/data/mockData";
import { SEO } from "@/components/SEO";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AlertCircle, Zap, TrendingUp, Target,
  Atom, FlaskConical, Calculator,
  Trash2, ChevronDown, ChevronUp,
  Sparkles, Phone, Mail, ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AdBanner } from "@/components/AdBanner";

const COUNSELING_PHONE = "9620012369";
const COUNSELING_WHATSAPP = `https://wa.me/91${COUNSELING_PHONE}?text=${encodeURIComponent("Hello! I want free counselling for admissions into top colleges.")}`;

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

// ─── Birthday Blast Popup ─────────────────────────────────────────────────────
const BLAST_COLORS = ["#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#ef4444", "#06b6d4", "#f97316"];

function MiniConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      size: Math.random() * 7 + 3,
      color: BLAST_COLORS[Math.floor(Math.random() * BLAST_COLORS.length)],
      speedX: (Math.random() - 0.5) * 3,
      speedY: Math.random() * 3 + 1.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 6,
      shape: Math.random() > 0.5 ? "rect" : "circle",
      opacity: 1,
    }));

    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height + 20) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height * 0.4);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

function FloatingEmoji({ emoji, style }: { emoji: string; style: React.CSSProperties }) {
  return (
    <span style={{
      position: "absolute",
      fontSize: 22,
      pointerEvents: "none",
      userSelect: "none",
      animation: "bbFloat 3s ease-in-out infinite",
      ...style,
    }}>{emoji}</span>
  );
}

interface BirthdayBlastProps {
  examMode: string;
  rankLow: number;
  rankHigh: number;
  keaScore: number;
  confidence: string;
  confidenceConfig: { color: string; bar: string; width: string; dot: string };
  revealed: boolean;
  rank: number;
  onClose: () => void;
  onColleges: () => void;
}

function BirthdayBlastPopup({ examMode, rankLow, rankHigh, keaScore, confidence, confidenceConfig, revealed, rank, onClose, onColleges }: BirthdayBlastProps) {
  useEffect(() => {
    // Inject keyframe animations
    const styleId = "bb-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes bbFloat { 0%,100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
        @keyframes bbPop { 0% { transform: scale(0.3) rotate(-10deg); opacity:0; } 60% { transform: scale(1.12) rotate(2deg); } 100% { transform: scale(1) rotate(0deg); opacity:1; } }
        @keyframes bbShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes bbGlow { 0%,100% { box-shadow: 0 0 20px #8b5cf6aa, 0 0 40px #ec4899aa; } 50% { box-shadow: 0 0 40px #3b82f6aa, 0 0 80px #8b5cf6bb; } }
        @keyframes bbBadgeSpin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.15); } 100% { transform: rotate(360deg) scale(1); } }
        @keyframes bbRankReveal { 0% { transform: scale(0.5); opacity:0; filter: blur(8px); } 100% { transform: scale(1); opacity:1; filter: blur(0); } }
        @keyframes bbPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes bbSlideUp { 0% { transform: translateY(30px); opacity:0; } 100% { transform: translateY(0); opacity:1; } }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={{
      position: "relative",
      borderRadius: 28,
      overflow: "hidden",
      background: "linear-gradient(135deg, #0f0c29 0%, #1a0533 40%, #0d1b3e 100%)",
      boxShadow: "0 30px 100px rgba(139,92,246,0.5), 0 8px 32px rgba(0,0,0,0.6)",
      animation: "bbPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
      maxHeight: "90vh",
      overflowY: "auto",
    }}>
      {/* Animated confetti canvas */}
      <MiniConfettiCanvas />

      {/* Floating emoji decorations */}
      <FloatingEmoji emoji="🎉" style={{ top: 12, left: 18, animationDelay: "0s" }} />
      <FloatingEmoji emoji="⭐" style={{ top: 8, right: 60, animationDelay: "0.5s" }} />
      <FloatingEmoji emoji="🎊" style={{ top: 55, right: 14, animationDelay: "1s" }} />
      <FloatingEmoji emoji="✨" style={{ top: 55, left: 50, animationDelay: "1.5s" }} />



      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — FREE COUNSELLING (above result)
          ══════════════════════════════════════════════════════════ */}
      <div style={{
        position: "relative", zIndex: 1,
        margin: "14px 18px 8px",
        borderRadius: 16,
        background: "#ffffff",
        border: "1.5px solid #e5e7eb",
        padding: "14px 16px",
        animation: "bbSlideUp 0.4s 0.15s both",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      }}>
        {/* Label row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, flexShrink: 0,
            boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
          }}>🎓</div>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 900, color: "#047857",
              textTransform: "uppercase", letterSpacing: "0.12em",
              background: "#e8fdf4", border: "1px solid #a7f3d0",
              padding: "3px 8px", borderRadius: 6,
              display: "inline-block",
            }}>
              For Admissions into Top Colleges
            </div>
            <div style={{ fontSize: 20, fontWeight: 950, color: "#111827", marginTop: 6, lineHeight: 1.2 }}>
              Get <span style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#ffffff",
                padding: "2px 8px",
                borderRadius: 6,
                boxShadow: "0 3px 8px rgba(16,185,129,0.25)",
                display: "inline-block",
                margin: "0 4px",
              }}>FREE</span> Counselling!
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 12, lineHeight: 1.5 }}>
          Talk to our expert team before choosing your colleges.
        </div>
        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <a href={`tel:${COUNSELING_PHONE}`} style={{
            flex: 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff", borderRadius: 11, padding: "11px 10px",
            fontWeight: 900, fontSize: 14, textDecoration: "none",
            boxShadow: "0 4px 14px rgba(16,185,129,0.45)",
            whiteSpace: "nowrap",
          }}>
            📞 +91 96200 12369
          </a>
          <a href={COUNSELING_WHATSAPP} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: "#f0fdf4",
            color: "#166534", borderRadius: 11, padding: "11px 14px",
            fontWeight: 900, fontSize: 14, textDecoration: "none",
            border: "1.5px solid #bbf7d0",
            whiteSpace: "nowrap",
          }}>
            <svg style={{ width: 15, height: 15, fill: "currentColor" }} viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.025-5.11-2.893-6.98-1.87-1.871-4.348-2.9-6.983-2.903-5.439 0-9.865 4.421-9.869 9.86 0 1.718.452 3.393 1.31 4.887L1.29 20.83l4.819-1.258zM17.472 14.382c-.3-.149-1.778-.878-2.052-.977-.274-.1-.474-.149-.673.15-.2.299-.773.978-.948 1.178-.175.199-.35.224-.65.075-3.007-1.505-4.577-2.678-5.702-4.615-.299-.514.299-.477.857-1.592.09-.18.045-.337-.023-.487-.068-.15-.574-1.385-.786-1.898-.206-.498-.415-.429-.574-.436-.148-.007-.32-.008-.492-.008-.172 0-.454.065-.691.32-.238.254-.908.887-.908 2.162 0 1.275.928 2.507 1.057 2.68 1.309 1.839 3.016 3.197 5.349 4.097 1.815.702 2.503.774 3.4.639.69-.104 1.778-.726 2.028-1.4.25-.674.25-1.253.175-1.376-.075-.124-.275-.199-.575-.349z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — RANK RESULT (the big reveal)
          ══════════════════════════════════════════════════════════ */}
      <div style={{
        position: "relative", zIndex: 1,
        margin: "8px 18px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        padding: "18px 16px 14px",
        textAlign: "center",
        animation: revealed ? "bbRankReveal 0.7s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
        backdropFilter: "blur(6px)",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.38)",
          textTransform: "uppercase", letterSpacing: "0.22em",
          marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <span>🎯</span> Predicted Rank Range
        </div>

        {/* The big shimmer rank number */}
        <div style={{
          fontSize: "clamp(28px, 7vw, 46px)",
          fontWeight: 900, letterSpacing: "-1px", lineHeight: 1,
          background: "linear-gradient(90deg, #f59e0b, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b)",
          backgroundSize: "300% auto",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "bbShimmer 3s linear infinite",
          padding: "6px 0",
        }}>
          {rankLow.toLocaleString("en-IN")} – {rankHigh.toLocaleString("en-IN")}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginTop: 5 }}>
          Based on 2023–2025 {examMode} historical data
        </div>

        {/* Mini stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 12 }}>
          {[
            { label: "KEA Score", value: keaScore.toFixed(1), emoji: "📊" },
            { label: "Best Rank",  value: rankLow.toLocaleString("en-IN"),  emoji: "🥇" },
            { label: "Worst Rank", value: rankHigh.toLocaleString("en-IN"), emoji: "📈" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)", borderRadius: 10,
              padding: "7px 4px", textAlign: "center",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ fontSize: 15, marginBottom: 2 }}>{s.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — KCET / NEET COUNSELLING CONTACT (below result)
          ══════════════════════════════════════════════════════════ */}
      <div style={{
        position: "relative", zIndex: 1,
        margin: "8px 18px",
        borderRadius: 16,
        background: "#ffffff",
        border: "1.5px solid #e5e7eb",
        padding: "14px 16px",
        animation: "bbSlideUp 0.4s 0.5s both",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "#4b5563",
          textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          📋 KCET / NEET / COMEDK Counselling Contact
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Phone card — full width */}
          <div style={{
            flex: 1,
            background: "rgba(99,102,241,0.05)", borderRadius: 12, padding: "14px 16px",
            border: "1.5px solid rgba(99,102,241,0.2)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5 }}>
                📞 KCET / NEET / COMEDK Counselling
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", lineHeight: 1.4 }}>
                Call for guidance & college selection support
              </div>
            </div>
            <a href={`tel:${COUNSELING_PHONE}`} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#4f46e5", borderRadius: 9, padding: "10px 14px",
              fontSize: 14, fontWeight: 900, color: "#ffffff",
              textDecoration: "none", whiteSpace: "nowrap",
              boxShadow: "0 4px 10px rgba(79, 70, 229, 0.3)",
              flexShrink: 0,
            }}>
              📞 +91 96200 12369
            </a>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", gap: 10,
        padding: "10px 18px 22px",
        animation: "bbSlideUp 0.4s 0.7s both",
      }}>
        <button onClick={onClose} style={{
          flex: 1, padding: "11px 14px", borderRadius: 13,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.07)",
          color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: 13,
          cursor: "pointer", backdropFilter: "blur(8px)",
        }}>
          Close
        </button>
        <button onClick={onColleges} style={{
          flex: 2, padding: "11px 14px", borderRadius: 13, border: "none",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)",
          color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer",
          boxShadow: "0 6px 20px rgba(139,92,246,0.5)",
          animation: "bbGlow 2s ease-in-out infinite",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        }}>
          🎯 Check Top Colleges
        </button>
      </div>
    </div>
  );
}

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
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

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
    const isKcetIncomplete = phyKcet === "" || chemKcet === "" || mathKcet === "";
    const isBoardIncomplete = phyBoard === "" || chemBoard === "" || mathBoard === "";

    if (isKcetIncomplete || isBoardIncomplete) {
      toast({
        title: "Marks Required",
        description: "Please enter all CET and Board marks fields before predicting your rank!",
        variant: "destructive"
      });
      return;
    }

    setCalculated(true);
    setResultDialogOpen(true);
    triggerConfetti();

    // Auto-save rank result to Supabase (non-blocking)
    const pred = predictRank(
      (Number(phyKcet) || 0) + (Number(chemKcet) || 0) + (Number(mathKcet) || 0),
      ((Number(phyBoard) || 0) + (Number(chemBoard) || 0) + (Number(mathBoard) || 0)) / 3
    );
    saveRankResult(pred.low, pred.high, pred.composite);

    // Smooth scroll to the result card on mobile (use setTimeout to wait for element to mount)
    setTimeout(() => {
      if (window.innerWidth < 1024 && cardRef.current) {
        cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
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

      {/* ── Birthday Blast Result Dialog ── */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-lg w-full border-0 bg-transparent p-0 shadow-none overflow-visible [&>button]:hidden">
          <BirthdayBlastPopup
            examMode={examMode}
            rankLow={rankLow}
            rankHigh={rankHigh}
            keaScore={keaScore}
            confidence={confidence}
            confidenceConfig={confidenceConfig}
            revealed={revealed}
            rank={rank}
            onClose={() => setResultDialogOpen(false)}
            onColleges={() => {
              setResultDialogOpen(false);
              setLocation(`/college-finder?rank=${rank}&category=GM&branch=CS`);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
