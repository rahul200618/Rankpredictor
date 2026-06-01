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
import { toast } from "@/hooks/use-toast";
import { AdBanner } from "@/components/AdBanner";

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
        className={`absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg text-xs font-bold text-white whitespace-nowrap pointer-events-none transition-all duration-200 ${hovered ? "opacity-100 -translate-y-0" : "opacity-0 translate-y-1"
          }`}
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      >
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black/75" />
      </div>

      {/* Icon container */}
      <div
        className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive
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

function DesktopNavItem({
  path,
  label,
  icon: Icon,
  color,
  glow,
  badge,
  isActive,
}: {
  path: string;
  label: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  badge?: string;
  isActive: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={path}
      className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-black transition-all duration-300 group overflow-hidden border ${isActive
          ? "text-white"
          : "text-white/75 hover:text-white"
        }`}
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${color}, ${color}dd)`
          : hovered
            ? `linear-gradient(135deg, ${color}22, ${color}33)`
            : "rgba(255,255,255,0.03)",
        borderColor: hovered || isActive ? `${color}66` : "rgba(255,255,255,0.12)",
        boxShadow: hovered || isActive ? `0 0 0 1px ${color}22, 0 0 28px ${glow}` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at center, ${glow}, transparent 72%)` }}
      />
      <Icon
        size={16}
        className={`relative z-10 transition-transform duration-300 ${hovered ? "scale-110" : ""}`}
        style={{ color: isActive || hovered ? "#ffffff" : color }}
      />
      <span className="relative z-10">{label}</span>
      {badge && (
        <span
          className="relative z-10 ml-0.5 text-[9px] px-1.5 py-0.5 rounded-md font-black text-white bg-blue-500 border border-white/15"
          style={{ lineHeight: 1 }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function UserMenu({ upwards = false }: { upwards?: boolean }) {
  const { user, isAdmin, isDeveloper, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <Link
        href="/auth"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all hover:scale-105 shadow-md shadow-primary/20"
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
          <div className={`absolute right-0 ${upwards ? 'bottom-full mb-2' : 'top-full mt-2'} w-52 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden`}>
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
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <Shield size={13} /> Admin Dashboard
                </Link>
              )}
              {isDeveloper && (
                <Link
                  href="/developer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                >
                  <TerminalSquare size={13} /> Developer Settings
                </Link>
              )}
              <button
                onClick={async () => {
                  setOpen(false);
                  await signOut();
                  setLocation("/");
                  toast({
                    title: "Logged out successfully",
                    description: "Have a great day ahead! Let us know if you need any more college help.",
                  });
                }}
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
  const supabaseAny = supabase as any;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showExamToggle, setShowExamToggle] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/Ranktransparent.png");

  const activeNavItems = [
    { path: "/", label: "Home", icon: LayoutDashboard, color: "#60a5fa", glow: "rgba(96,165,250,0.5)" },
    { path: "/rank-predictor", label: "Predictor", icon: Target, color: "#818cf8", glow: "rgba(129,140,248,0.5)", badge: "Hot" },
    { path: "/college-finder", label: "Predict Colleges", icon: BookOpen, color: "#a78bfa", glow: "rgba(167,139,250,0.5)" }
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabaseAny.from("app_settings").select("*");
        if (data) {
          const isKcetOn = data.find(d => d.setting_key === "feature_kcet")?.setting_value;
          const isComedkOn = data.find(d => d.setting_key === "feature_comedk")?.setting_value;
          const kcetEnabled = isKcetOn === "true" || isKcetOn === true;
          const comedkEnabled = isComedkOn === "true" || isComedkOn === true;
          const enabledModes = [
            kcetEnabled ? "KCET" : null,
            comedkEnabled ? "COMEDK" : null,
          ].filter(Boolean) as Array<"KCET" | "COMEDK">;

          setShowExamToggle(enabledModes.length > 1);

          if (enabledModes.length === 1 && examMode !== enabledModes[0]) {
            setExamMode(enabledModes[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching settings for exam toggle", err);
      }
    };
    fetchSettings();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        () => fetchSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [examMode, setExamMode]);

  useEffect(() => {
    const main = document.getElementById("main-scroll");
    const handler = () => setScrolled((main?.scrollTop ?? 0) > 20);
    main?.addEventListener("scroll", handler);
    return () => main?.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
      {/* Global WhatsApp Floating Sidebar Tab */}
      <a
        href="https://wa.me/919620012369?text=Hello!%20I%20want%20free%20counseling%20for%20counseling%20help."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white font-extrabold px-1.5 py-2.5 sm:px-3 sm:py-4 rounded-l-lg sm:rounded-l-2xl shadow-2xl flex flex-col items-center gap-1.5 sm:gap-3 transition-all duration-300 hover:-translate-x-1 border-l border-t border-b border-white/20 select-none group"
      >
        <svg
          className="w-3 h-3.5 sm:w-4 sm:h-5 fill-current animate-bounce"
          viewBox="0 0 24 24"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.66.986 3.292 1.48 4.743 1.481 5.378 0 9.753-4.375 9.756-9.759.002-2.607-1.013-5.059-2.859-6.905C16.398 2.126 13.95 1.11 11.343 1.111c-5.385 0-9.76 4.375-9.764 9.759-.001 1.702.46 3.36 1.332 4.795l-.997 3.641 3.734-.98c1.393.759 2.87 1.168 4.419 1.168zm10.155-6.818c-.28-.14-1.654-.816-1.91-.908-.256-.092-.443-.139-.629.14-.186.278-.718.908-.88 1.093-.163.186-.326.21-.605.07-.28-.14-1.18-.435-2.247-1.387-.83-.74-1.39-1.653-1.552-1.933-.163-.28-.017-.43.123-.569.126-.125.28-.326.42-.489.14-.163.186-.279.28-.465.093-.186.046-.349-.023-.489-.069-.14-.629-1.517-.861-2.074-.227-.547-.456-.473-.629-.482-.163-.008-.349-.01-.535-.01-.186 0-.489.07-.745.349-.256.279-.977.954-.977 2.325s1.001 2.699 1.14 2.885c.14.186 1.97 3.007 4.773 4.213.667.287 1.187.459 1.592.587.67.213 1.28.183 1.763.111.539-.08 1.654-.676 1.887-1.328.232-.653.232-1.213.163-1.328-.07-.113-.256-.184-.536-.324z" />
        </svg>
        <span className="[writing-mode:vertical-lr] text-[8px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap leading-none">
          Click here for free counselling
        </span>
      </a>

      {/* ── Top bar ── */}
      <header
        className={`relative shrink-0 flex items-center gap-3 px-5 py-3 transition-all duration-300 ${scrolled
            ? "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-b border-slate-700/30 shadow-md shadow-slate-900/20 text-slate-50"
            : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/30 text-slate-50"
          }`}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center justify-start -ml-8 sm:-ml-5 group shrink-0">
          <div className="relative h-10 w-[150px] sm:w-[220px] md:w-[280px] overflow-visible shrink-0 transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(96,165,250,0.34)]">
            <img
              src={logoSrc}
              alt="RankPrediction Logo"
              onError={() => {
                if (logoSrc !== "/my-new-logo.svg") setLogoSrc("/my-new-logo.svg");
              }}
              className="w-full h-full object-contain scale-[1.42] origin-left transition-transform duration-300 group-hover:scale-[1.5]"
            />
          </div>
        </Link>

        {/* Center Desktop Navigation Pill */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-2 p-1.5 rounded-[22px] border border-white/20 bg-white/8 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          {activeNavItems.map(({ path, label, icon: Icon, color, glow, badge }) => {
            const isActive = location === path;
            return (
              <DesktopNavItem
                key={path}
                path={path}
                label={label}
                icon={Icon}
                color={color}
                glow={glow}
                badge={badge}
                isActive={isActive}
              />
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
              className={`relative px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all duration-300 ${examMode === "KCET"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-black/20"
                  : "text-white/70 hover:text-white"
                }`}
            >
              CET
              {examMode === "KCET" && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-emerald-400 rounded-full border border-background" />
              )}
            </button>
            <button
              data-testid="toggle-comedk"
              onClick={() => setExamMode("COMEDK")}
              className={`relative px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all duration-300 ${examMode === "COMEDK"
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
        <div className="hidden md:block">
          <UserMenu />
        </div>

        {/* Mobile hamburger */}
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-xl border border-white/20 hover:bg-white/10 text-white/80 hover:text-white shadow-inner"
        >
          <Menu size={16} />
        </button>
      </header>

      {/* ── Main content ── */}
      <main id="main-scroll" className="flex-1 overflow-y-auto flex flex-col justify-between">
        <div className="flex-1">
          {children}
        </div>

        {/* Global AdSense — horizontal banner above footer */}
        <AdBanner
          slot="9020022771"
          format="horizontal"
          className="px-4 py-2 max-w-5xl mx-auto"
        />

        {/* Global Production Footer */}
        <footer className="mt-8 border-t border-slate-700/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50 backdrop-blur-lg pb-20 md:pb-0">
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
                  <div className="relative w-12 h-12 rounded-xl bg-white border border-white/20 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                    <img
                      src="/vidyarthi-sewa-logo.png"
                      alt="Vidhyarthi Sewa Trust"
                      className="w-full h-full object-contain p-1 rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.footer-logo-fallback') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }
                      }}
                    />
                    <span className="footer-logo-fallback text-sm font-black text-blue-600 hidden">VS</span>
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
                      CET Rank Predictor
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-6 px-4 py-3 border-t border-border/50 bg-card/90 backdrop-blur-xl shadow-lg"
      >
        {activeNavItems.map(({ path, label, icon: Icon, color, badge }) => {
          const isActive = location === path;
          return (
            <Link
              key={path}
              href={path}
              className="flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? "scale-110" : ""}`}
                style={{
                  background: isActive ? color + "22" : "transparent",
                  border: isActive ? `1.5px solid ${color}60` : "1.5px solid transparent",
                }}
              >
                <Icon size={17} className={isActive ? "animate-bounce-subtle" : ""} style={{ color: isActive ? color : "hsl(var(--muted-foreground))" }} />
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
      </div>

      {/* ── Mobile full-screen menu ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
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
              {activeNavItems.map(({ path, label, icon: Icon, color }) => {
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
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${examMode === "KCET" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                        }`}
                    >
                      CET
                    </button>
                    <button
                      onClick={() => setExamMode("COMEDK")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${examMode === "COMEDK" ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"
                        }`}
                    >
                      COMEDK
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <UserMenu upwards={true} />
                <button onClick={toggleTheme} className="p-2 rounded-xl border border-border hover:bg-accent">
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
