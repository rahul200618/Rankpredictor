import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Phone, Lock, ArrowRight, Shield,
  CheckCircle2, Loader2, Check, ChevronDown, User, BookOpen
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ── Interested Subject Options ────────────────────────────────────────────────
const SUBJECT_OPTIONS = [
  {
    id: "engineering",
    label: "Engineering",
    emoji: "⚙️",
    description: "B.E / B.Tech programmes",
    color: "from-blue-500 to-indigo-600",
    ring: "ring-blue-500/60",
    bg: "bg-blue-500/10",
    border: "border-blue-500/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    emoji: "💊",
    description: "B.Pharm / Pharm.D programmes",
    color: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-500/60",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "allied_science",
    label: "Allied Science / Agriculture / Veterinary",
    emoji: "🌿",
    description: "B.Sc Agriculture, Veterinary & Allied Health",
    color: "from-amber-500 to-orange-500",
    ring: "ring-amber-500/60",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    text: "text-amber-600 dark:text-amber-400",
  },
];

export default function AuthPage() {
  const { sendOtp, verifyOtp, updateDisplayName, user, isDevMode } = useAuth();
  const [, navigate] = useLocation();

  // ── Form States ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [interestedSubjects, setInterestedSubjects] = useState<string[]>([]);

  // ── System States ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown
  const startCooldown = () => {
    setResendCooldown(30);
    const t = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const formatPhone = (raw: string) => raw.replace(/\D/g, "").slice(0, 10);

  // Toggle a subject selection
  const toggleSubject = (id: string) => {
    setInterestedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // ── Action: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (phone.length !== 10) { setError("Enter a valid 10-digit mobile number"); return; }
    setError("");
    setLoading(true);
    try {
      await sendOtp(`+91${phone}`);
      setOtpSent(true);
      startCooldown();
      toast({
        title: "📲 OTP Sent Successfully",
        description: "Please check your phone for the 6-digit verification code.",
      });
    } catch (err: any) {
      setError(err.message ?? "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const isVerifyingRef = useRef(false);
  const isVerifiedRef = useRef(false);

  // ── Helper: Save Profile and Navigate ─────────────────────────────────────
  const completeSignupFlow = async (nameVal: string, subjectsVal: string[], verifiedUser?: any) => {
    setError("");
    setLoading(true);
    try {
      await updateDisplayName(nameVal);

      const activeUser = verifiedUser || user;
      const uid = (activeUser && "uid" in activeUser ? activeUser.uid : undefined) ?? `dev-+91${phone}`;

      try {
        await supabase.from("user_profiles").upsert({
          id: uid,
          phone: `+91${phone}`,
          full_name: nameVal,
          interested_subjects: subjectsVal,
          interested_exams: [],
        });
      } catch (dbErr) {
        console.warn("Error starting Supabase write: ", dbErr);
      }

      toast({
        title: "🎉 Registration Complete",
        description: `Welcome to RankPrediction, ${nameVal}!`,
      });
      navigate("/rank-predictor");
    } catch (err: any) {
      setError(err.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Action: Save Profile & Complete Signup ───────────────────────────────
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifyingRef.current) return;
    if (!name.trim()) { setError("Please enter your full name"); return; }
    if (interestedSubjects.length === 0) {
      setError("Please select at least one stream you're interested in");
      return;
    }

    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the 6-digit OTP code"); return; }

    let verifiedUser = null;
    if (!isVerifiedRef.current && !isVerifyingRef.current) {
      isVerifyingRef.current = true;
      setVerifyingOtp(true);
      setError("");
      try {
        verifiedUser = await verifyOtp(code);
        isVerifiedRef.current = true;
        setOtpVerified(true);
      } catch (verifyErr: any) {
        setError(
          isDevMode
            ? `Dev mode: use code 123456`
            : (verifyErr?.message ?? "Invalid verification code. Please check and try again.")
        );
        return;
      } finally {
        isVerifyingRef.current = false;
        setVerifyingOtp(false);
      }
    }

    await completeSignupFlow(name.trim(), interestedSubjects, verifiedUser);
  };

  // ── Auto-verify when all 6 digits are entered ───────────────────────────
  const autoVerifyOtp = async (otpArr: string[]) => {
    const code = otpArr.join("");
    if (code.length !== 6 || isVerifiedRef.current || isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    setVerifyingOtp(true);
    setError("");
    try {
      const verifiedUser = await verifyOtp(code);
      isVerifiedRef.current = true;
      setOtpVerified(true);

      // Auto-submit and navigate if details are already filled
      if (name.trim() && interestedSubjects.length > 0) {
        await completeSignupFlow(name.trim(), interestedSubjects, verifiedUser);
      }
    } catch (err: any) {
      setError(
        isDevMode
          ? `Dev mode: use code 123456`
          : (err.message ?? "Invalid verification code. Please try again.")
      );
      // Clear the OTP boxes so user can re-enter
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => document.getElementById("otp-0")?.focus(), 50);
    } finally {
      isVerifyingRef.current = false;
      setVerifyingOtp(false);
    }
  };

  // ── OTP input helpers ────────────────────────────────────────────────────
  const handleOtpInput = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next);
    if (digit && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
    // Auto-verify when last digit is filled
    if (digit && idx === 5) {
      autoVerifyOtp([...otp.slice(0, 5), digit]);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    [...pasted].forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4 py-8">
      {/* ── Ambient Glows ── */}
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 left-1/4 w-64 h-64 rounded-full bg-indigo-400/5 blur-3xl pointer-events-none" />

      {/* ── Container Card ── */}
      <div className="relative w-full max-w-lg">
        <div
          className="relative bg-card/85 backdrop-blur-xl border border-border/60 rounded-3xl shadow-2xl overflow-hidden"
          style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.1)" }}
        >
          {/* Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          {/* ── Card Header ── */}
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="inline-flex items-center justify-center h-16 mb-4 w-48 relative overflow-visible">
              <img
                src="/Ranktransparent.png"
                alt="RankPrediction Logo"
                className="w-full h-full object-contain scale-[1.5] origin-center drop-shadow-[0_4px_12px_rgba(99,102,241,0.3)] dark:invert-0 invert transition-all"
              />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight"></h1>
            <p className="text-sm text-muted-foreground mt-1">Join RankPrediction to unlock cutoff analysis and predictive tools</p>
          </div>

          {/* ── Main Form ── */}
          <form onSubmit={handleCompleteSignup} className="px-8 pb-8 space-y-5">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-muted/40 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
                <User size={15} className="absolute left-3.5 text-muted-foreground" />
              </div>
            </div>

            {/* ── Interested Subjects Multi-Select (Required) ── */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={12} className="text-muted-foreground" />
                Interested Stream
                <span className="text-[10px] font-semibold text-red-500 ml-1">* required</span>
              </label>
              <p className="text-[11px] text-muted-foreground -mt-0.5">Select all that apply</p>
              <div className="grid grid-cols-1 gap-2.5">
                {SUBJECT_OPTIONS.map(opt => {
                  const isSelected = interestedSubjects.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleSubject(opt.id)}
                      className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
                        ${isSelected
                          ? `${opt.border} ${opt.bg} ring-2 ${opt.ring}`
                          : "border-border bg-muted/20 hover:border-border/80 hover:bg-muted/30"
                        }`}
                    >
                      {/* Checkbox circle */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200
                        ${isSelected ? `${opt.border} ${opt.bg}` : "border-muted-foreground/40 bg-transparent"}`}
                      >
                        {isSelected && (
                          <svg viewBox="0 0 10 10" className="w-3 h-3" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={opt.text} />
                          </svg>
                        )}
                      </div>

                      {/* Emoji + label */}
                      <span className="text-xl leading-none select-none">{opt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold transition-colors ${isSelected ? opt.text : "text-foreground"}`}>
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{opt.description}</div>
                      </div>

                      {/* Selected badge */}
                      {isSelected && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${opt.bg} ${opt.text} border ${opt.border}`}>
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {interestedSubjects.length === 0 && (
                <p className="text-[10px] text-muted-foreground/70 italic pt-0.5">
                  You must select at least one stream to continue
                </p>
              )}
            </div>

            {/* Phone Input with Send OTP Button inline */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex items-center flex-1">
                  <div className="absolute left-3.5 flex items-center gap-1 border-r border-border pr-2 py-1 bg-transparent">
                    <span className="text-sm">🇮🇳</span>
                    <span className="text-xs font-bold text-foreground">+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    maxLength={10}
                    disabled={otpVerified}
                    className="w-full pl-16 pr-4 py-3 rounded-xl border border-border bg-muted/40 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || phone.length !== 10 || otpVerified}
                  className="px-4 py-3 bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  {loading && !otpSent ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : otpSent ? (
                    resendCooldown > 0 ? `${resendCooldown}s` : "Resend"
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </div>
            </div>

            {/* OTP Section (visible after code is sent) */}
            {otpSent && (
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                    Enter Verification Code
                  </span>
                  {verifyingOtp ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                      <Loader2 size={10} className="animate-spin" /> Verifying…
                    </span>
                  ) : otpVerified ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Check size={10} strokeWidth={3} /> Verified
                    </span>
                  ) : null}
                </div>

                {isDevMode && (
                  <p className="text-[10px] text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 font-semibold">
                    🛠️ Localhost dev mode — enter code: <strong>123456</strong>
                  </p>
                )}

                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      disabled={otpVerified || verifyingOtp}
                      className={`w-11 text-center text-lg font-black rounded-xl border transition-all bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70 ${otpVerified
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                          : digit
                            ? "border-primary bg-primary/5 text-primary scale-105"
                            : "border-border text-foreground"
                        }`}
                      style={{ height: "3.25rem" }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            {/* Complete Signup Button */}
            <button
              type="submit"
              disabled={loading || verifyingOtp || otp.join("").length !== 6 || !name.trim() || interestedSubjects.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99] mt-6"
            >
              {loading || verifyingOtp ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Secure Footer */}
          <div className="px-8 py-3 bg-muted/20 border-t border-border/40 flex items-center justify-center gap-2">
            <Shield size={11} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-semibold">
              Secured by Firebase · Verified SMS OTP · Privacy Protected
            </span>
          </div>
        </div>

        {/* Glow behind the card */}
        <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/10 blur-2xl" />
      </div>
    </div>
  );
}
