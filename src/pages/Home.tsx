import { Link, useLocation } from "wouter";
import { useExamMode } from "@/contexts/ExamModeContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Target, BookOpen, ArrowRight, Zap, TrendingUp, Shield, 
  Sparkles, GraduationCap, Trophy, Clock, ChevronRight, 
  Users, Award, HelpCircle, CheckCircle2, Heart, ExternalLink,
  Phone, Mail, MapPin, Send, Loader2, Check, AlertCircle, X
} from "lucide-react";

const tips = [
  "RVCE CSE GM cutoff tightened by 14 ranks in 2025",
  "COMEDK 2025 saw a 7% increase in CS/IS registrations",
  "Option entry window is typically 5–7 days — plan ahead",
  "SC/ST category seats are reserved before GM allotment rounds",
  "Allied Science streams are experiencing higher demand in 2026",
];

const faqsKcet = [
  {
    q: "How accurate is the CET Rank Predictor?",
    a: "Our algorithm uses the official KEA scoring model combined with actual CET and Board averages. Since 2026 cutoffs depend on paper difficulty and student averages, we provide a calibrated High/Moderate/Borderline confidence range to give you the most realistic estimate.",
  },
  {
    q: "What is the KEA score calculation formula?",
    a: "For Engineering streams, the KEA score is derived by taking 50% of your CET exam score (scaled out of 100) plus 50% of your PUC/12th standard Physics, Chemistry, and Mathematics (PCM) board average.",
  },
  {
    q: "Is this platform really 100% free?",
    a: "Yes! Powered by the Vidhyarthi Sewa Trust, this platform is completely free for all students. Our goal is to democratize high-quality counseling analytics without any paywalls or ads.",
  },
  {
    q: "How does the College Predictor work?",
    a: "The College Predictor maps your KEA rank directly against 3 consecutive years of round-by-round CET counseling data. It categorizes eligible choices into clear probability brackets so you can plan your option entry intelligently.",
  },
];

const faqsComedk = [
  {
    q: "How accurate is the COMEDK Rank Predictor?",
    a: "Our algorithm uses the official COMEDK scoring model combined with actual exam scores and Board averages. Since 2026 cutoffs depend on paper difficulty and student performance, we provide a calibrated High/Moderate/Borderline confidence range to give you the most realistic estimate.",
  },
  {
    q: "What is the COMEDK score calculation?",
    a: "COMEDK uses a comprehensive scoring model that evaluates your performance across all sections. Our predictor incorporates historical patterns and student metrics to give you an accurate rank estimate for your specific branch and category.",
  },
  {
    q: "Is this platform really 100% free?",
    a: "Yes! Powered by the Vidhyarthi Sewa Trust, this platform is completely free for all students. Our goal is to democratize high-quality counseling analytics without any paywalls or ads.",
  },
  {
    q: "How does the College Predictor work for COMEDK?",
    a: "The College Predictor maps your COMEDK rank directly against historical round-by-round counseling data. It categorizes eligible choices into clear probability brackets so you can plan your option entry intelligently.",
  },
];

const STREAMS = [
  { id: "engineering", label: "Engineering" },
  { id: "nursing", label: "Nursing" },
  { id: "pharmacy", label: "Pharmacy" },
  { id: "allied_science", label: "Allied Science" },
];

const EXAMS = [
  { id: "kcet", label: "CET" },
  { id: "comedk", label: "COMEDK" },
];

export default function Home() {
  const { examMode, setExamMode } = useExamMode();
  const supabaseAny = supabase as any;
  const [tipIndex, setTipIndex] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [availableExamModes, setAvailableExamModes] = useState<Array<"KCET" | "COMEDK">>([]);
  const [, setLocation] = useLocation();
  const [showPredictorModal, setShowPredictorModal] = useState(false);

  // Counseling Enquiry Form State
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [enquiryMessage, setEnquiryMessage] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchExamFlags = async () => {
      try {
        const { data } = await supabaseAny.from("app_settings").select("*");
        if (!data) return;

        const isKcetOn = data.find((d: any) => d.setting_key === "feature_kcet")?.setting_value;
        const isComedkOn = data.find((d: any) => d.setting_key === "feature_comedk")?.setting_value;

        const kcetEnabled = isKcetOn === "true" || isKcetOn === true;
        const comedkEnabled = isComedkOn === "true" || isComedkOn === true;
        const enabledModes = [
          kcetEnabled ? "KCET" : null,
          comedkEnabled ? "COMEDK" : null,
        ].filter(Boolean) as Array<"KCET" | "COMEDK">;

        setAvailableExamModes(enabledModes);

        if (enabledModes.length === 1 && examMode !== enabledModes[0]) {
          setExamMode(enabledModes[0]);
        }
      } catch (err) {
        console.error("Error fetching exam flags on home page", err);
      }
    };

    fetchExamFlags();
  }, [examMode, setExamMode]);

  const displayExamMode = availableExamModes.length === 1 ? availableExamModes[0] : examMode;

  // Offline Fallback Auto-Synchronization Effect (online fallback sync back)
  useEffect(() => {
    const syncEnquiries = async () => {
      try {
        const stored = localStorage.getItem("saved_counseling_enquiries");
        if (!stored) return;
        const enquiries = JSON.parse(stored);
        if (enquiries.length === 0) return;

        console.log(`Attempting to sync ${enquiries.length} offline enquiries back to database...`);
        const { error } = await supabaseAny.from("counseling_enquiries").upsert(
          enquiries.map((e: any) => ({
            name: e.name,
            phone: e.phone,
            email: e.email || null,
            interested_streams: e.interested_streams || [],
            interested_exams: e.interested_exams || [],
            message: e.message || null,
            created_at: e.created_at || new Date().toISOString()
          })),
          { onConflict: 'phone' }
        );

        if (!error) {
          localStorage.removeItem("saved_counseling_enquiries");
          console.log("Offline enquiries successfully synchronized with Supabase database!");
        } else {
          throw error;
        }
      } catch (err) {
        console.warn("Failed to sync offline enquiries back to Supabase database (will retry later):", err);
      }
    };

    // Run sync when page loads/mounts
    syncEnquiries();

    // Re-attempt sync when internet connection goes online
    window.addEventListener("online", syncEnquiries);
    return () => window.removeEventListener("online", syncEnquiries);
  }, []);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName.trim() || !enquiryPhone.trim()) {
      setSubmitError("Please fill in your Name and Mobile Number.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    const payload = {
      name: enquiryName.trim(),
      phone: enquiryPhone.trim(),
      email: enquiryEmail.trim() || null,
      interested_streams: selectedStreams,
      interested_exams: selectedExams,
      message: enquiryMessage.trim() || null,
    };

    try {
      const { error } = await supabaseAny.from("counseling_enquiries").upsert(
        [payload],
        { onConflict: 'phone' }
      );

      if (error) throw error;

      setSubmitSuccess(true);
      setEnquiryName("");
      setEnquiryPhone("");
      setEnquiryEmail("");
      setSelectedStreams([]);
      setSelectedExams([]);
      setEnquiryMessage("");
    } catch (err: any) {
      console.warn("Database save failed, trying local backup fallback:", err.message);
      
      // Attempt local storage fallback if network is interrupted or table isn't ready
      try {
        const localEnquiries = JSON.parse(localStorage.getItem("saved_counseling_enquiries") || "[]");
        localEnquiries.push({
          ...payload,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("saved_counseling_enquiries", JSON.stringify(localEnquiries));
        setSubmitSuccess(true);
        setEnquiryName("");
        setEnquiryPhone("");
        setEnquiryEmail("");
        setSelectedStreams([]);
        setSelectedExams([]);
        setEnquiryMessage("");
      } catch (backupErr) {
        setSubmitError("Failed to submit enquiry. Please check your network connection.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full space-y-16 pb-20">
      {/* ── Background Blobs ── */}
      <div className="fixed -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl animate-blob pointer-events-none -z-10" />
      <div className="fixed top-1/2 -left-32 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl animate-blob pointer-events-none -z-10" style={{ animationDelay: "3s" }} />

      {/* ── HERO HEADER SECTION ── */}
      <section className="relative max-w-4xl mx-auto px-5 pt-16 pb-4 text-center">
        <div className="flex flex-col items-center space-y-3">

            {/* Large Trust logo and subtitle */}
            <div className="animate-slide-up flex flex-col items-center space-y-1.5">
              <img 
                src="/vidyarthi-sewa-logo.png" 
                alt="Vidyarthi Sewa Trust Logo" 
                className="h-16 sm:h-20 md:h-24 object-contain hover:scale-105 transition-transform duration-300 pointer-events-auto"
              />
              <span className="text-xs sm:text-sm md:text-base font-extrabold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                Brought to you by Vidyarthi Sewa Trust
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-slide-up text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="gradient-text">Crack</span>{" "}
              <span className="text-foreground">{displayExamMode === "KCET" ? "CET" : displayExamMode}</span><br />
              <span className="text-foreground">counseling with</span>{" "}
              <span className="gradient-text">absolute confidence</span>
            </h1>

            {/* Subtext */}
            <p className="animate-slide-up delay-100 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Predict your expected rank, analyze 3 years of official round cutoffs, find the right matches, and build your smart option entry list — built for students.
            </p>

            {/* Action CTAs */}
            <div className="animate-slide-up delay-150 flex flex-wrap justify-center items-center gap-4">
              <button
                onClick={() => setShowPredictorModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl text-base md:text-lg font-black hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-600/30"
              >
                <Zap size={18} /> Predict My Rank <ArrowRight size={18} />
              </button>
            </div>
        </div>
      </section>

      {/* ── TOOLKIT DIRECT CARDS ── */}
      <section className="max-w-5xl mx-auto px-5">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-extrabold text-foreground">Smart Counseling Suite</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              href: "/rank-predictor",
              icon: Target,
              label: "Rank Predictor",
              desc: displayExamMode === "KCET" 
                ? "Input your actual or expected CET marks & PUC board average. See KEA Score calculations and predicted rank ranges instantly."
                : "Input your actual or expected COMEDK marks. Get accurate rank predictions and confidence brackets for your specific branch.",
              gradient: "from-blue-500 to-indigo-600",
              glow: "rgba(99,102,241,0.25)",
              bg: "#6366f115",
              iconColor: "#818cf8",
              tag: "Most Accurate",
              tagBg: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
            },
            {
              href: "/college-finder",
              icon: BookOpen,
              label: "Predict Colleges",
              desc: displayExamMode === "KCET"
                ? "Predict target colleges based on your KEA rank, branch, and reservations. Maps round cutoffs with high/moderate prediction badges."
                : "Predict target colleges based on your COMEDK rank, branch, and reservations. Maps counseling data with prediction confidence.",
              gradient: "from-violet-500 to-purple-600",
              glow: "rgba(139,92,246,0.25)",
              bg: "#8b5cf615",
              iconColor: "#a78bfa",
              tag: "Cutoff Analysis",
              tagBg: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300",
            },
          ].map(({ href, icon: Icon, label, desc, gradient, glow, bg, iconColor, tag, tagBg }, i) => {
            const isRankPredictor = href === "/rank-predictor";
            return (
              <div
                key={href}
                onClick={() => {
                  if (isRankPredictor) {
                    setShowPredictorModal(true);
                  } else {
                    setLocation(href);
                  }
                }}
                className="group relative bg-card border border-card-border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden shadow-sm cursor-pointer"
                style={{
                  ...(hoveredIdx === i ? { boxShadow: `0 12px 32px -8px ${glow}`, borderColor: iconColor + "50" } : {}),
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
              {/* Radial gradient background hover effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at top left, ${bg}, transparent 70%)` }}
              />

              <div className="relative flex items-start gap-4">
                <div
                  className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: bg, border: `1.5px solid ${iconColor}30` }}
                >
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                    <Icon size={16} className="text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-extrabold text-base text-foreground">{label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tagBg}`}>{tag}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>

              <div className="relative mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                <span className="text-[11px] text-muted-foreground font-medium">Get started immediately</span>
                <span className="flex items-center gap-1 text-xs font-bold transition-all" style={{ color: iconColor }}>
                  Open Dashboard <ChevronRight size={13} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LIVE HIGHLIGHT FEED TICKER ── */}
      <section className="max-w-5xl mx-auto px-5">
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl overflow-hidden backdrop-blur-md">
          <TrendingUp size={14} className="text-amber-500 shrink-0" />
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 shrink-0 uppercase tracking-widest">Live Cutoff Insight:</span>
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
      </section>


      {/* ── DEDICATED VIDHYARTHI SEWA TRUST SECTION ── */}
      <section className="max-w-5xl mx-auto px-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/5 border border-primary/20 p-8 md:p-12 shadow-lg">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-5 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                <Heart size={10} /> Benefactor Spotlight
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                Brought to you by <span className="gradient-text">Vidhyarthi Sewa Trust</span>
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-xl">
                Vidhyarthi Sewa Trust (Student Service Trust) is committed to mentoring, supporting, and enabling students across Karnataka. By offering counseling guides, financial assistance schemes, and high-performance predictive academic tools, we ensure a smooth journey to your target career.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <a
                  href="https://www.vidhyarthisewa.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black hover:opacity-90 transition-all hover:scale-105 shadow-md shadow-primary/20"
                >
                  Visit Official Trust Site <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-center items-center">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-lg shadow-blue-500/20 relative">
                <img 
                  src="/vidyarthi-sewa-logo.png" 
                  alt="VS Logo" 
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <span className="logo-initials text-4xl font-extrabold relative z-10 tracking-wider">VS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT & COUNSELING SUPPORT ENQUIRY SECTION ── */}
      <section className="max-w-5xl mx-auto px-5">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-extrabold text-foreground">Contact & Counseling Support Desk</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Direct Contact Details */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="bg-card border border-card-border rounded-2xl p-6 space-y-6 shadow-sm h-full flex flex-col justify-center">
              <div>
                <span className="text-xs font-black text-primary uppercase tracking-widest">Reach Us Directly</span>
                <h3 className="text-lg font-extrabold text-foreground mt-1">Counseling Help Desk</h3>
                <p className="text-xs text-muted-foreground mt-1">Get directly in touch with our counselors for immediate college support.</p>
              </div>

              <div className="space-y-4">
                <a 
                  href="tel:9620012369"
                  className="flex items-center gap-4 p-3 bg-muted/40 hover:bg-muted/80 transition-all rounded-xl border border-border/60 hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold">CALL HELPLINE</div>
                    <div className="text-sm font-black text-foreground hover:text-primary transition-colors">+91 96200 12369</div>
                  </div>
                </a>

                <a 
                  href="mailto:ramdgonline@gmail.com"
                  className="flex items-center gap-4 p-3 bg-muted/40 hover:bg-muted/80 transition-all rounded-xl border border-border/60 hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold">EMAIL SUPPORT</div>
                    <div className="text-sm font-black text-foreground hover:text-primary transition-colors truncate">ramdgonline@gmail.com</div>
                  </div>
                </a>

                <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-xl border border-border/60">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold">SUPPORT CENTRE</div>
                    <div className="text-xs font-bold text-foreground">Vidhyarthi Sewa Trust, Bengaluru</div>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Right Column: Counseling Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-card border-2 border-primary/15 rounded-2xl p-6 shadow-md shadow-primary/5">
              <span className="text-xs font-black text-primary uppercase tracking-widest">Enquiry Form</span>
              <h3 className="text-lg font-extrabold text-foreground mt-1">Get Free Counseling Mentorship 🎓</h3>
              <p className="text-xs text-muted-foreground mt-1">Submit your details to match your target streams with best allotment options.</p>

              <form onSubmit={handleEnquirySubmit} className="mt-5 space-y-4">
                
                {/* Error Banner */}
                {submitError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span className="font-bold">{submitError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {submitSuccess && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs animate-scale-in">
                    <Check size={16} className="shrink-0 mt-0.5 bg-emerald-500 text-white rounded-full p-0.5" />
                    <div>
                      <strong className="block text-sm">Enquiry Submitted Successfully!</strong>
                      <span className="text-[11px] leading-relaxed">Our counselling mentors will reach out shortly on +91 {enquiryPhone}.</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="enquiry-name" className="text-xs font-bold text-foreground">Full Name *</label>
                    <input 
                      id="enquiry-name"
                      type="text" 
                      placeholder="Enter student name"
                      value={enquiryName}
                      onChange={e => setEnquiryName(e.target.value)}
                      disabled={submitting}
                      className="w-full px-3.5 py-2.5 bg-muted/40 hover:bg-muted/80 focus:bg-background border border-border focus:border-primary rounded-xl text-xs font-bold outline-none transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="enquiry-phone" className="text-xs font-bold text-foreground">Mobile Number (10 digits) *</label>
                    <input 
                      id="enquiry-phone"
                      type="tel" 
                      maxLength={10}
                      placeholder="e.g. 9620012369"
                      value={enquiryPhone}
                      onChange={e => setEnquiryPhone(e.target.value.replace(/\D/g, ""))}
                      disabled={submitting}
                      className="w-full px-3.5 py-2.5 bg-muted/40 hover:bg-muted/80 focus:bg-background border border-border focus:border-primary rounded-xl text-xs font-bold outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="enquiry-email" className="text-xs font-bold text-foreground">Email Address (Optional)</label>
                  <input 
                    id="enquiry-email"
                    type="email" 
                    placeholder="Enter email address"
                    value={enquiryEmail}
                    onChange={e => setEnquiryEmail(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3.5 py-2.5 bg-muted/40 hover:bg-muted/80 focus:bg-background border border-border focus:border-primary rounded-xl text-xs font-bold outline-none transition-all disabled:opacity-50"
                  />
                </div>

                {/* Interested Counseling Streams */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Interested Counseling Streams (Optional)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STREAMS.map(stream => {
                      const isSelected = selectedStreams.includes(stream.label);
                      return (
                        <button
                          key={stream.id}
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStreams(selectedStreams.filter(s => s !== stream.label));
                            } else {
                              setSelectedStreams([...selectedStreams, stream.label]);
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all text-left ${
                            isSelected 
                              ? "bg-primary/10 border-primary text-primary shadow-sm"
                              : "bg-muted/30 border-border text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                          }`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span>{stream.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Counseling Exams */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Target Counseling Exams (Optional)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXAMS.map(exam => {
                      const isSelected = selectedExams.includes(exam.label);
                      return (
                        <button
                          key={exam.id}
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedExams(selectedExams.filter(e => e !== exam.label));
                            } else {
                              setSelectedExams([...selectedExams, exam.label]);
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all text-left ${
                            isSelected 
                              ? "bg-primary/10 border-primary text-primary shadow-sm"
                              : "bg-muted/30 border-border text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                          }`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span>{exam.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Counseling Query / Message */}
                <div className="space-y-1.5">
                  <label htmlFor="enquiry-message" className="text-xs font-bold text-foreground">Counseling Query / Message (Optional)</label>
                  <textarea 
                    id="enquiry-message"
                    rows={3}
                    placeholder="Describe your queries, marks, or preferred colleges..."
                    value={enquiryMessage}
                    onChange={e => setEnquiryMessage(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3.5 py-2.5 bg-muted/40 hover:bg-muted/80 focus:bg-background border border-border focus:border-primary rounded-xl text-xs font-bold outline-none transition-all disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary text-primary-foreground rounded-xl text-xs font-black hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/25 disabled:opacity-50 disabled:scale-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Submit Counseling Enquiry
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>

        </div>
      </section>

      {/* ── FAQs ACCORDION SECTION ── */}
      <section className="max-w-4xl mx-auto px-5 space-y-6">
        <div className="text-center space-y-2">
          <HelpCircle size={24} className="text-primary mx-auto" />
          <h2 className="text-2xl font-extrabold text-foreground">Frequently Asked Questions</h2>
          <p className="text-xs text-muted-foreground">Clear answers to common questions about {displayExamMode === "KCET" ? "CET" : displayExamMode} counseling and predictions.</p>
        </div>

          {(displayExamMode === "KCET" ? faqsKcet : faqsComedk).map(({ q, a }, i) => {
            const isOpen = activeFaq === i;
            return (
              <div 
                key={q}
                className="border border-border rounded-2xl bg-card overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-4 font-bold text-sm text-foreground hover:bg-muted/40 transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-primary shrink-0" />
                    {q}
                  </span>
                  <span className={`text-muted-foreground transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-border/40 text-xs text-muted-foreground leading-relaxed animate-slide-up">
                    {a}
                  </div>
                )}
              </div>
            );
          })}
      </section>

      {/* ── Predictor Choice Modal ── */}
      {showPredictorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-scale-in">
          {/* Backdrop click close */}
          <div className="absolute inset-0" onClick={() => setShowPredictorModal(false)} />
          
          <div className="relative bg-card border border-card-border rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl overflow-hidden z-10">
            {/* Background glowing decorations */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setShowPredictorModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase">
                <Sparkles size={10} /> Prediction Suite
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">Choose Exam Predictor</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select the exam you'd like to analyze. Our calibrated algorithms will predict your ranks and target colleges.
              </p>
            </div>

            <div className="space-y-4">
              {/* CET Button Option */}
              <button
                onClick={() => {
                  setExamMode("KCET");
                  setLocation("/rank-predictor");
                  setShowPredictorModal(false);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-blue-500/20 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0 transition-transform group-hover:scale-110">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h4 className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                    CET Predictor
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      KEA
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">
                    Predict ranks based on CET scores and PUC board averages.
                  </p>
                </div>
              </button>

              {/* COMEDK Button Option */}
              <button
                onClick={() => {
                  setExamMode("COMEDK");
                  setLocation("/rank-predictor");
                  setShowPredictorModal(false);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-violet-500/20 hover:border-violet-500/60 bg-violet-500/5 hover:bg-violet-500/10 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10 group"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-600/30 shrink-0 transition-transform group-hover:scale-110">
                  <Target size={22} />
                </div>
                <div>
                  <h4 className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                    COMEDK Predictor
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-violet-500/20 text-violet-600 dark:text-violet-400">
                      UGET
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">
                    Analyze target cutoff scores for premium private institutions.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
