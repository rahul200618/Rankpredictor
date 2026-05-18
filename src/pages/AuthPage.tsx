import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import {
  Sparkles, Phone, Lock, ArrowRight, Shield,
  ChevronLeft, CheckCircle2, Loader2
} from "lucide-react";

type Step = "phone" | "otp" | "name";

export default function AuthPage() {
  const { sendOtp, verifyOtp, updateDisplayName } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatPhone = (raw: string) => raw.replace(/\D/g, "").slice(0, 10);

  const startCooldown = () => {
    setResendCooldown(30);
    const t = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phone.length !== 10) { setError("Enter a valid 10-digit Indian mobile number"); return; }
    setError("");
    setLoading(true);
    try {
      await sendOtp(`+91${phone}`);
      setStep("otp");
      startCooldown();
    } catch (err: any) {
      if (err.message?.includes("api-key-not-valid")) {
        setError("Invalid Firebase API Key. Please double check the credentials in your .env.local file.");
      } else {
        setError(err.message ?? "Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const token = otp.join("");
    if (token.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    setError("");
    setLoading(true);
    try {
      const user = await verifyOtp(token);
      // New user → ask for name
      if (!user.displayName) {
        setStep("name");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError("Invalid OTP. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Save name ────────────────────────────────────────────────────
  const handleSaveName = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { setError("Please enter your name"); return; }
    setError("");
    setLoading(true);
    try {
      await updateDisplayName(name.trim());
      navigate("/");
    } catch (err: any) {
      setError("Failed to save name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP box helpers ──────────────────────────────────────────────────────
  const handleOtpInput = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next);
    if (digit && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
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

  const stepIndex = { phone: 0, otp: 1, name: 2 } as const;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">

      {/* ── Ambient blobs ── */}
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 left-1/4 w-64 h-64 rounded-full bg-indigo-400/5 blur-3xl pointer-events-none" />

      {/* ── Card ── */}
      <div className="relative w-full max-w-md">
        <div
          className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl shadow-2xl overflow-hidden"
          style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.1)" }}
        >
          {/* Shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          {/* ── Card Header ── */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
              <Sparkles size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-1">PredictRank</h1>
            <p className="text-sm text-muted-foreground">
              {step === "phone" && "Sign in with your Indian mobile number"}
              {step === "otp" && `OTP sent to +91 ${phone}`}
              {step === "name" && "Welcome! What should we call you?"}
            </p>
          </div>

          {/* ── Progress stepper ── */}
          <div className="px-8 mb-6">
            <div className="flex items-center gap-2">
              {(["phone", "otp", "name"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                    step === s
                      ? "bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/30"
                      : stepIndex[step] > i
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {stepIndex[step] > i ? <CheckCircle2 size={12} /> : i + 1}
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                      stepIndex[step] > i ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-8 pb-8 space-y-0">

            {/* ── Step 1: Phone ── */}
            {step === "phone" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                    Mobile Number
                  </label>
                  <div className="flex items-center border border-border bg-muted/40 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <div className="flex items-center gap-2 px-3 py-3.5 border-r border-border bg-muted/60 shrink-0">
                      <span className="text-base">🇮🇳</span>
                      <span className="text-sm font-bold text-foreground">+91</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      maxLength={10}
                      className="flex-1 px-3 py-3.5 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                      autoFocus
                    />
                    <Phone size={15} className="text-muted-foreground mr-3 shrink-0" />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    A 6-digit OTP will be sent via SMS
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><span>Send OTP</span><ArrowRight size={14} /></>
                  }
                </button>

                <p className="text-center text-[11px] text-muted-foreground pt-1">
                  By continuing you agree to our{" "}
                  <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
                </p>
              </form>
            )}

            {/* ── Step 2: OTP ── */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">
                    Enter 6-digit OTP
                  </label>
                  <div className="flex items-center gap-2 justify-center" onPaste={handleOtpPaste}>
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
                        autoFocus={i === 0}
                        className={`w-11 text-center text-lg font-black rounded-xl border transition-all bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          digit
                            ? "border-primary bg-primary/5 text-primary scale-105"
                            : "border-border text-foreground"
                        }`}
                        style={{ height: "3.25rem" }}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-center">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><Lock size={14} /><span>Verify & Continue</span><ArrowRight size={14} /></>
                  }
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(""); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft size={13} /> Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs font-bold text-primary disabled:text-muted-foreground disabled:cursor-not-allowed hover:underline transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 3: Name ── */}
            {step === "name" && (
              <form onSubmit={handleSaveName} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Arjun Sharma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-muted/40 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><CheckCircle2 size={14} /><span>Let's Go!</span><ArrowRight size={14} /></>
                  }
                </button>
              </form>
            )}

          </div>

          {/* Trust footer */}
          <div className="px-8 py-4 bg-muted/20 border-t border-border/40 flex items-center justify-center gap-2">
            <Shield size={11} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">
              Secured by Firebase · Verified SMS OTP · No spam
            </span>
          </div>
        </div>

        {/* Outer card glow */}
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/10 blur-2xl" />
      </div>
    </div>
  );
}
