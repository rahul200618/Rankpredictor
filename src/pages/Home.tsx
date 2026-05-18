import { Link } from "wouter";
import { useExamMode } from "@/contexts/ExamModeContext";
import { useState, useEffect, useRef } from "react";
import {
  Target, Search, BookOpen, Bot, ArrowRight, Zap,
  TrendingUp, Shield, Sparkles, GraduationCap, Trophy,
  Clock, ChevronRight, Star, Info, Heart, LayoutDashboard
} from "lucide-react";

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

const features = [
  {
    href: "/rank-predictor",
    icon: Target,
    label: "Rank Predictor",
    desc: "Enter your marks per subject. Instantly see rank range + KEA score.",
    gradient: "from-blue-500 to-indigo-600",
    glow: "rgba(99,102,241,0.3)",
    bg: "#6366f120",
    iconColor: "#818cf8",
    tag: "Most Used",
    tagBg: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
  },
  {
    href: "/college-finder",
    icon: BookOpen,
    label: "Predict Colleges",
    desc: "Personalised picks with High/Moderate/Borderline probability badges.",
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.3)",
    bg: "#8b5cf620",
    iconColor: "#a78bfa",
    tag: "Smart Match",
    tagBg: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300",
  },
];

const moreTools: any[] = [];

const tips = [
  "RVCE CSE GM cutoff tightened by 14 ranks in 2025",
  "COMEDK 2025 saw a 7% increase in CS/IS registrations",
  "Option entry window is typically 5–7 days — plan ahead",
  "SC/ST category seats are reserved before GM allotment rounds",
];

export default function Home() {
  const { examMode, setExamMode } = useExamMode();
  const [tipIndex, setTipIndex] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-full">
      {/* ── Blobs ── */}
      <div className="fixed -top-32 -right-32 w-96 h-96 rounded-full bg-primary/6 blur-3xl animate-blob pointer-events-none -z-0" />
      <div className="fixed -bottom-24 -left-24 w-80 h-80 rounded-full bg-violet-500/6 blur-3xl animate-blob pointer-events-none -z-0" style={{ animationDelay: "3s" }} />

      <div className="relative max-w-5xl mx-auto px-5 pt-8 pb-4">
        {/* Badges */}
        <div className="animate-slide-up flex flex-wrap items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles size={11} /> Karnataka Engineering Counseling Platform
          </span>
        </div>

        {/* Headline */}
        <div className="animate-slide-up delay-100 mb-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
            <span className="gradient-text">Crack</span>{" "}
            <span className="text-foreground">{examMode}</span><br />
            <span className="text-foreground">counseling with</span>{" "}
            <span className="gradient-text">confidence</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Predict your rank, explore 3 years of cutoffs, find the right college, and track counseling timelines — built for Karnataka students.
          </p>
        </div>

        {/* CTAs */}
        <div className="animate-slide-up delay-200 flex flex-wrap items-center gap-3 mb-6">
          <Link
            href="/rank-predictor"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
          >
            <Zap size={14} /> Predict My Rank <ArrowRight size={13} />
          </Link>
        </div>
      </div>





      {/* ── Main feature cards ── */}
      <div className="max-w-5xl mx-auto px-5 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-extrabold text-foreground">Your counseling toolkit</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ href, icon: Icon, label, desc, gradient, glow, bg, iconColor, tag, tagBg }, i) => (
            <Link
              key={href}
              href={href}
              data-testid={`feature-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className="group relative bg-card border border-card-border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden animate-scale-in"
              style={{
                animationDelay: `${i * 70}ms`,
                ...(hoveredIdx === i ? { boxShadow: `0 12px 32px -8px ${glow}`, borderColor: iconColor + "50" } : {}),
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Glow BG */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at top left, ${bg}, transparent 70%)` }}
              />

              <div className="relative flex items-start gap-4">
                <div
                  className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: bg, border: `1.5px solid ${iconColor}30` }}
                >
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                    <Icon size={15} className="text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-extrabold text-base text-foreground">{label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tagBg}`}>{tag}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>

              <div className="relative mt-4 flex items-center justify-between">
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent mr-3" />
                <span className="flex items-center gap-1 text-xs font-bold transition-all" style={{ color: iconColor }}>
                  Open <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Live Updates Feed ── */}
      <div className="max-w-5xl mx-auto px-5 pb-12 animate-slide-up delay-300">
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl overflow-hidden backdrop-blur-md">
          <TrendingUp size={14} className="text-amber-500 shrink-0" />
          <span className="text-xs font-black text-amber-600 dark:text-amber-400 shrink-0 uppercase tracking-wider">Live Insight:</span>
          <div className="overflow-hidden flex-1">
            <p key={tipIndex} className="text-xs text-foreground/80 font-bold animate-slide-up truncate">
              {tips[tipIndex]}
            </p>
          </div>
          <div className="flex gap-1 shrink-0 items-center">
            {tips.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === tipIndex ? "bg-amber-500 w-3" : "bg-amber-300 dark:bg-amber-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>




    </div>
  );
}
