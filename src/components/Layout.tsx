import { useState, useRef, useEffect, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useExamMode } from "@/contexts/ExamModeContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, TrendingUp, Search, Target, Bot,
  BookOpen, Star, Info, Heart, Sun, Moon, Zap,
  ChevronDown, Sparkles, Menu, X, LogOut, Shield, TerminalSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { path: "/", label: "Home", icon: LayoutDashboard, color: "#60a5fa", glow: "rgba(96,165,250,0.5)" },
  { path: "/rank-predictor", label: "Predictor", icon: Target, color: "#818cf8", glow: "rgba(129,140,248,0.5)", badge: "Hot" },
  { path: "/college-finder", label: "Predict Colleges", icon: BookOpen, color: "#a78bfa", glow: "rgba(167,139,250,0.5)" },
];

interface LayoutProps {
  children: ReactNode;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

function DockItem({
  path, label, icon: Icon, color, glow, badge, isActive, onClick
}: {
  path: string; label: string; icon: React.ElementType;
  color: string; glow: string; badge?: string;
  isActive: boolean; onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={path}
      onClick={onClick}
      className="relative flex flex-col items-center gap-1 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Label tooltip above */}
      <div
        className={`absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg text-xs font-bold text-white whitespace-nowrap pointer-events-none transition-all duration-200 ${
          hovered ? "opacity-100 -translate-y-0" : "opacity-0 translate-y-1"
        }`}
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      >
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black/75" />
      </div>

      {/* Icon container */}
      <div
        className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isActive
            ? "scale-110"
            : hovered
            ? "scale-125 -translate-y-2"
            : "scale-100"
        }`}
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${color}33, ${color}55)`
            : hovered
            ? `linear-gradient(135deg, ${color}22, ${color}44)`
            : "hsl(var(--card))",
          border: `1.5px solid ${isActive ? color + "80" : hovered ? color + "50" : "hsl(var(--border))"}`,
          boxShadow: isActive
            ? `0 0 16px ${glow}, 0 4px 12px ${color}30`
            : hovered
            ? `0 0 12px ${glow}, 0 8px 20px ${color}25`
            : "none",
        }}
      >
        <Icon
          size={18}
          style={{ color: isActive || hovered ? color : "hsl(var(--muted-foreground))" }}
          className="transition-colors duration-200"
        />
        {isActive && (
          <span
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
          />
        )}
        {badge && (
          <span
            className="absolute -top-1.5 -right-1.5 text-[9px] px-1 py-0.5 rounded-md font-black text-white border border-white/20"
            style={{ background: badge === "AI" ? "#f59e0b" : "#3b82f6", lineHeight: 1 }}
          >
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}

function UserMenu() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link
        href="/auth"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all hover:scale-105 shadow-md shadow-primary/20"
      >
        <Sparkles size={12} /> Sign In
      </Link>
    );
  }

  const displayName = user?.displayName || user?.phoneNumber || "User";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-border hover:bg-accent transition-all group"
      >
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
          {initials}
        </div>
        {isAdmin && (
          <Shield size={11} className="text-amber-500" />
        )}
        <ChevronDown size={12} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-xs font-bold text-foreground truncate">{user.displayName ?? "User"}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{user.phoneNumber}</p>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-black text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  <Shield size={9} /> Admin
                </span>
              )}
            </div>

            <div className="p-2 space-y-0.5">
              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    <Shield size={13} /> Admin Dashboard
                  </Link>
                  <Link
                    href="/developer"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                  >
                    <TerminalSquare size={13} /> Developer Settings
                  </Link>
                </>
              )}
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Layout({ children, theme, toggleTheme }: LayoutProps) {
  const [location] = useLocation();
  const { examMode, setExamMode } = useExamMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showExamToggle, setShowExamToggle] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from("app_settings").select("*");
        if (data) {
          const isKcetOn = data.find(d => d.setting_key === "feature_kcet")?.setting_value;
          const isComedkOn = data.find(d => d.setting_key === "feature_comedk")?.setting_value;
          setShowExamToggle((isKcetOn === "true" || isKcetOn === true) && (isComedkOn === "true" || isComedkOn === true));
        }
      } catch (err) {
        console.error("Error fetching settings for exam toggle", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const main = document.getElementById("main-scroll");
    const handler = () => setScrolled((main?.scrollTop ?? 0) > 20);
    main?.addEventListener("scroll", handler);
    return () => main?.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">

      {/* ── Top bar ── */}
      <header
        className={`shrink-0 flex items-center gap-3 px-5 py-3 transition-all duration-300 ${
          scrolled
            ? "bg-gradient-to-r from-slate-700/95 to-slate-800/95 backdrop-blur-xl border-b border-slate-500/30 shadow-md shadow-slate-900/20 text-white"
            : "bg-gradient-to-r from-slate-700 to-slate-800 text-white"
        }`}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg shadow-black/10 shrink-0 transition-transform group-hover:scale-110">
            <Zap size={14} className="text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-transparent animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-base tracking-tight text-white leading-none flex items-center gap-1.5">
              RankPrediction
              <Sparkles size={11} className="text-amber-400" />
            </span>
            <div className="text-[10px] text-white/80 font-medium leading-none mt-0.5">Student Counseling Intelligence</div>
          </div>
        </Link>

        <div className="flex-1 md:hidden" />

        {/* Center Desktop Navigation Pill */}
        <nav className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
          {navItems.map(({ path, label, icon: Icon, color, glow, badge }) => {
            const isActive = location === path;
            return (
              <Link
                key={path}
                href={path}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-300 group overflow-hidden ${
                  isActive
                    ? "text-white shadow-sm shadow-black/20"
                    : "text-white/70 hover:text-white"
                }`}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${color}, ${color}dd)`
                    : "transparent",
                }}
              >
                <Icon
                  size={14}
                  className={`transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-white animate-bounce-subtle" : "text-white/70 group-hover:text-white"
                  }`}
                  style={{ color: isActive ? "#ffffff" : color }}
                />
                <span>{label}</span>
                {badge && (
                  <span
                    className="ml-0.5 text-[8px] px-1 py-0.5 rounded font-black text-white bg-blue-500 border border-white/10"
                    style={{ lineHeight: 1 }}
                  >
                    {badge}
                  </span>
                )}
                {/* Micro-sparkle glow pulse on active */}
                {isActive && (
                  <span className="absolute inset-0 w-full h-full bg-white/10 mix-blend-overlay animate-pulse-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Exam toggle */}
        {showExamToggle && (
          <div
            className="flex items-center gap-0.5 p-0.5 sm:p-1 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm shrink-0 shadow-inner"
            data-testid="exam-toggle-container"
          >
            <button
              data-testid="toggle-kcet"
              onClick={() => setExamMode("KCET")}
              className={`relative px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all duration-300 ${
                examMode === "KCET"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-black/20"
                  : "text-white/70 hover:text-white"
              }`}
            >
              KCET
              {examMode === "KCET" && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-emerald-400 rounded-full border border-background" />
              )}
            </button>
            <button
              data-testid="toggle-comedk"
              onClick={() => setExamMode("COMEDK")}
              className={`relative px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all duration-300 ${
                examMode === "COMEDK"
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-black/20"
                  : "text-white/70 hover:text-white"
              }`}
            >
              COMEDK
              {examMode === "COMEDK" && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-emerald-400 rounded-full border border-background" />
              )}
            </button>
          </div>
        )}

        {/* Theme toggle */}
        <button
          data-testid="theme-toggle"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-white/20 hover:bg-white/10 text-white/80 hover:text-white transition-all hover:scale-110 shadow-inner"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* User avatar / auth actions */}
        <UserMenu />

        {/* Mobile hamburger */}
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(true)}
          className="sm:hidden p-2 rounded-xl border border-white/20 hover:bg-white/10 text-white/80 hover:text-white shadow-inner"
        >
          <Menu size={16} />
        </button>
      </header>

      {/* ── Main content ── */}
      <main id="main-scroll" className="flex-1 overflow-y-auto flex flex-col justify-between">
        <div className="flex-1">
          {children}
        </div>

        {/* Global Production Footer */}
        <footer className="mt-8 border-t border-slate-700/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50 backdrop-blur-lg pb-16 sm:pb-0">
          <div className="max-w-5xl mx-auto px-6 py-6">
            

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
              {/* Column 1: Trust Info & Logo */}
              <div className="space-y-3.5 col-span-1 md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
                <a 
                  href="https://www.vidhyarthisewa.org/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 hover:opacity-90 transition-all w-fit"
                >
                  <div className="relative w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-extrabold text-lg shadow-md shrink-0 overflow-hidden">
                    <img 
                      src="/vidyarthi-sewa-logo.png" 
                      alt="VS" 
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="text-sm font-black relative z-10">VS</span>
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-black text-white tracking-tight leading-none">Vidhyarthi Sewa Trust</span>
                    <span className="text-[9px] text-white/60 font-bold tracking-wide uppercase mt-1">Student Service Initiative</span>
                  </div>
                </a>
                <p className="text-[11px] text-white/70 leading-relaxed max-w-sm">
                  Empowering students with advanced counseling intelligence, predictor analysis, and dynamic cutoff explorers.
                </p>
              </div>

              {/* Column 2: Quick Features */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Counseling Tools</h4>
                <ul className="space-y-1.5 text-[11px] font-semibold text-white/70">
                  <li>
                    <Link href="/" className="hover:text-white transition-colors">
                      Home Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/rank-predictor" className="hover:text-white transition-colors">
                      KCET Rank Predictor
                    </Link>
                  </li>
                  <li>
                    <Link href="/college-finder" className="hover:text-white transition-colors">
                      College Predictor Finder
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Resources */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Official Resources</h4>
                <ul className="space-y-1.5 text-[11px] font-semibold text-white/70">
                  <li>
                    <a 
                      href="https://cetonline.karnataka.gov.in/kea/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-white transition-colors flex items-center gap-1"
                    >
                      KEA Official Portal
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://www.comedk.org/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-white transition-colors flex items-center gap-1"
                    >
                      COMEDK Portal
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://www.vidhyarthisewa.org/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-white transition-colors flex items-center gap-1"
                    >
                      Vidhyarthi Sewa Site
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Merged Copyright Row */}
            <hr className="border-white/10 my-4" />
            <div className="text-center text-[10px] text-white/60 font-medium">
              © {new Date().getFullYear()} RankPrediction. Developed by{" "}
              <a 
                href="https://openalgon.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-white/80 font-bold transition-colors underline decoration-dotted decoration-white/50"
              >
                OpenAlgon
              </a>.
            </div>

          </div>
        </footer>
      </main>

      {/* ── Mobile bottom nav ── */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t border-border"
        style={{
          background: theme === "dark" ? "rgba(12,18,40,0.95)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(16px)",
        }}
      >
        {navItems.slice(0, 5).map(({ path, label, icon: Icon, color, badge }) => {
          const isActive = location === path;
          return (
            <Link
              key={path}
              href={path}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all"
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? "scale-110" : ""}`}
                style={{
                  background: isActive ? color + "22" : "transparent",
                  border: isActive ? `1.5px solid ${color}60` : "1.5px solid transparent",
                }}
              >
                <Icon size={16} className={isActive ? "animate-bounce-subtle" : ""} style={{ color: isActive ? color : "hsl(var(--muted-foreground))" }} />
              </div>
              <span
                className="text-[9px] font-bold leading-none"
                style={{ color: isActive ? color : "hsl(var(--muted-foreground))" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-border">
            <Menu size={14} className="text-muted-foreground" />
          </div>
          <span className="text-[9px] font-bold text-muted-foreground">More</span>
        </button>
      </div>

      {/* ── Mobile full-screen menu ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 pb-10"
            style={{
              background: theme === "dark" ? "hsl(222 47% 7%)" : "hsl(0 0% 100%)",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="font-extrabold text-base text-foreground">Navigation</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-accent">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {navItems.map(({ path, label, icon: Icon, color }) => {
                const isActive = location === path;
                return (
                  <Link
                    key={path}
                    href={path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all"
                    style={{
                      background: isActive ? color + "15" : "hsl(var(--muted))",
                      borderColor: isActive ? color + "50" : "transparent",
                    }}
                  >
                    <Icon size={20} style={{ color }} />
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showExamToggle && (
                  <>
                    <button
                      onClick={() => setExamMode("KCET")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        examMode === "KCET" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      KCET
                    </button>
                    <button
                      onClick={() => setExamMode("COMEDK")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        examMode === "COMEDK" ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      COMEDK
                    </button>
                  </>
                )}
              </div>
              <button onClick={toggleTheme} className="p-2 rounded-xl border border-border hover:bg-accent">
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
