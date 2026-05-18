import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LeadService } from "@/lib/lead-service";
import { Phone, User, ShieldCheck, KeyRound, Sparkles, ArrowRight, GraduationCap, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhoneOtpGateProps {
  onVerified: () => void;
}

export function PhoneOtpGate({ onVerified }: PhoneOtpGateProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [step, setStep] = useState<"register" | "verify">("register");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name to proceed.",
        variant: "destructive",
      });
      return;
    }
    if (phone.length < 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Simulate generating a 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setStep("verify");
      setIsLoading(false);

      // Trigger a beautiful, accessible toast displaying the OTP for testing
      toast({
        title: "🔑 Verification Code Sent",
        description: (
          <div className="mt-1 space-y-1">
            <p>Your test OTP is: <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg tracking-wider">{code}</span></p>
            <p className="text-[10px] text-muted-foreground">(Simulated SMS lead successfully logged)</p>
          </div>
        ),
        duration: 8000,
      });
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== generatedOtp) {
      toast({
        title: "Incorrect OTP",
        description: "The verification code you entered is invalid. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Save lead information
      LeadService.login(fullName, phone);
      toast({
        title: "🎉 Verification Successful!",
        description: "Welcome! Your predicted rank is now unlocked.",
      });
      setIsLoading(false);
      onVerified();
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto my-8 relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl -z-10" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -z-10" />

      <Card className="border border-white/20 bg-background/60 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
        {/* Top Gradient Header */}
        <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500" />
        
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
            Verify Your Profile
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1.5">
            Securely verify your phone number to unlock the calibrated 2026 KCET Rank Predictor
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          <AnimatePresence mode="wait">
            {step === "register" ? (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSendOtp}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-1.5">
                    <User className="h-4 w-4 text-emerald-500" />
                    Full Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="e.g. Rahul Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-4 h-12 rounded-xl border-white/10 bg-white/5 focus-visible:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    WhatsApp/Mobile Number
                  </Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-sm font-semibold text-muted-foreground/70">+91</span>
                    <Input
                      id="phone"
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="pl-14 h-12 rounded-xl border-white/10 bg-white/5 focus-visible:ring-emerald-500 font-mono tracking-wider text-base"
                      required
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-600 dark:text-blue-400 flex gap-2 items-start">
                  <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Your number is used strictly for verification and securing your mock results. No spam guaranteed.</span>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:scale-[1.01] border-0"
                >
                  {isLoading ? "Sending OTP..." : (
                    <span className="flex items-center justify-center gap-2">
                      Send OTP Verification <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="verify"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="otp" className="text-sm font-semibold flex items-center gap-1.5">
                      <KeyRound className="h-4 w-4 text-emerald-500" />
                      Enter 6-Digit OTP
                    </Label>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                      Sent to +91 {phone}
                    </Badge>
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="h-12 rounded-xl text-center border-white/10 bg-white/5 focus-visible:ring-emerald-500 font-mono tracking-[0.4em] text-lg font-bold"
                    required
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("register");
                      setOtpCode("");
                    }}
                    className="font-semibold text-emerald-500 hover:text-emerald-600 hover:underline bg-transparent border-0"
                  >
                    Edit Phone Number
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:scale-[1.01] border-0"
                >
                  {isLoading ? "Verifying..." : (
                    <span className="flex items-center justify-center gap-2">
                      Verify & Predict Rank <ShieldCheck className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
