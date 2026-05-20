import {
  createContext, useContext, useEffect, useState, ReactNode
} from "react";
import {
  onAuthStateChanged, signOut as firebaseSignOut,
  User, RecaptchaVerifier, signInWithPhoneNumber,
  ConfirmationResult, updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ─── Simulated User Type ──────────────────────────────────────────────────────
interface SimulatedUser {
  uid: string;
  phoneNumber: string;
  displayName: string | null;
}

// ─── Global Auth Context Interface ────────────────────────────────────────────
interface AuthContextType {
  user: User | SimulatedUser | null;
  loading: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isSimulated: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<any>;
  updateDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── Developer phone list ────────────────────────────────────────────────────────
const DEVELOPER_PHONES = ["+916360749270", "+917026802690"];

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isDeveloper: false,
  isSimulated: true,
  sendOtp: async () => {},
  verifyOtp: async () => { throw new Error("Not ready"); },
  updateDisplayName: async () => {},
  signOut: async () => {},
});

let confirmationResultRef: ConfirmationResult | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | SimulatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [simPhone, setSimPhone] = useState<string>("");
  const [dynamicAdminPhones, setDynamicAdminPhones] = useState<string[]>([]);
  const [forceSimulatedMode, setForceSimulatedMode] = useState(false);

  useEffect(() => {
    // Initial fetch
    const fetchAdmins = async () => {
      try {
        const { data } = await supabase.from("app_settings").select("*").eq("setting_key", "admin_phones").single();
        if (data?.setting_value) {
          try {
            let val = data.setting_value;
            let parsed = typeof val === 'string' ? val : JSON.stringify(val);
            try {
              const j = JSON.parse(parsed);
              parsed = Array.isArray(j) ? j : [parsed];
            } catch {
              parsed = parsed.split(",").map((p: string) => p.trim());
            }
            if (Array.isArray(parsed)) setDynamicAdminPhones(parsed);
          } catch(e) {}
        }
      } catch (e) {
        console.error("Error fetching admin phones", e);
      }
    };
    fetchAdmins();

    // Realtime subscription — updates instantly when developer saves settings
    const channel = supabase
      .channel("app_settings_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "setting_key=eq.admin_phones" },
        (payload) => {
          try {
            const val = (payload.new as any)?.setting_value;
            let parsed = typeof val === 'string' ? val : JSON.stringify(val);
            try {
              const j = JSON.parse(parsed);
              parsed = Array.isArray(j) ? j : [parsed];
            } catch {
              parsed = parsed.split(",").map((p: string) => p.trim());
            }
            if (Array.isArray(parsed)) setDynamicAdminPhones(parsed);
          } catch(e) {}
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Determine if we should run in zero-configuration simulation mode
  const isSimulated =
    !import.meta.env.VITE_FIREBASE_API_KEY ||
    import.meta.env.VITE_FIREBASE_API_KEY.includes("AIzaSy...") ||
    import.meta.env.VITE_FIREBASE_PROJECT_ID === "your-project-id";
  const activeSimulatedMode = isSimulated || forceSimulatedMode;

  // ── Session Sync (Supports local HMR/refresh persistence) ──────────────────
  useEffect(() => {
    if (activeSimulatedMode) {
      const stored = localStorage.getItem("rankprediction_sim_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          localStorage.removeItem("rankprediction_sim_user");
        }
      }
      setLoading(false);
    } else {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
      return unsub;
    }
  }, [activeSimulatedMode]);

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const sendOtp = async (phone: string) => {
    if (activeSimulatedMode) {
      setSimPhone(phone);
      // Simulate SMS Delivery with a premium dashboard notification
      toast({
        title: "🔑 Test Verification Code",
        description: `OTP sent successfully. For local testing, use code: 123456`,
        duration: 8000,
      });
      return;
    }

    const triggerSignIn = async (forceFresh = false) => {
      let verifier = (window as any)._recaptchaVerifier;

      if (forceFresh && verifier) {
        try {
          verifier.clear();
        } catch (e) {}
        verifier = null;
        (window as any)._recaptchaVerifier = null;
      }

      if (verifier) {
        const container = document.getElementById("recaptcha-container");
        if (!container || !container.hasChildNodes()) {
          try {
            verifier.clear();
          } catch (e) {}
          verifier = null;
          (window as any)._recaptchaVerifier = null;
        }
      }

      if (!verifier) {
        verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        });
        (window as any)._recaptchaVerifier = verifier;
      }

      return signInWithPhoneNumber(auth, phone, verifier);
    };

    try {
      confirmationResultRef = await triggerSignIn(false);
    } catch (err: any) {
      console.warn("First sign-in attempt failed. Retrying with fresh recaptcha...", err);
      const message = String(err?.message ?? "").toLowerCase();
      const code = String(err?.code ?? "").toLowerCase();
      const isRecaptchaErr =
        message.includes("rendered") ||
        message.includes("removed") ||
        message.includes("already-exists") ||
        code.includes("recaptcha");

      if (isRecaptchaErr) {
        try {
          confirmationResultRef = await triggerSignIn(true);
          return;
        } catch (retryErr: any) {
          err = retryErr;
        }
      }

      const isCredentialErr =
        code.includes("invalid-app-credential") ||
        code.includes("operation-not-allowed") ||
        code.includes("app-credential-too-old") ||
        message.includes("invalid-app-credential") ||
        message.includes("operation-not-allowed");

      if (isCredentialErr) {
        setForceSimulatedMode(true);
        setSimPhone(phone);
        confirmationResultRef = null;
        toast({
          title: "Test mode enabled",
          description: "Phone verification is unavailable in this environment. Use OTP 123456 to continue.",
          duration: 8000,
        });
        return;
      }

      throw err;
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const verifyOtp = async (otp: string): Promise<any> => {
    if (activeSimulatedMode) {
      if (otp !== "123456") {
        throw new Error("Invalid OTP code. For simulated mode, enter: 123456");
      }
      const simUser: SimulatedUser = {
        uid: `sim-user-${simPhone}`,
        phoneNumber: simPhone,
        displayName: localStorage.getItem("rankprediction_sim_name") || null,
      };
      localStorage.setItem("rankprediction_sim_user", JSON.stringify(simUser));
      setUser(simUser);
      return simUser;
    }

    // Real Firebase Verification
    if (!confirmationResultRef) throw new Error("No OTP session active.");
    const result = await confirmationResultRef.confirm(otp);
    return result.user;
  };

  // ── Update display name ────────────────────────────────────────────────────
  const updateDisplayName = async (name: string) => {
    if (activeSimulatedMode) {
      localStorage.setItem("rankprediction_sim_name", name);
      const updatedUser = { ...user, displayName: name } as SimulatedUser;
      localStorage.setItem("rankprediction_sim_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return;
    }

    // Real Firebase Profile Update
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName: name });
    setUser({ ...auth.currentUser });
  };

  // ── Sign Out ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    if (activeSimulatedMode) {
      localStorage.removeItem("rankprediction_sim_user");
      setUser(null);
      setForceSimulatedMode(false);
      return;
    }

    confirmationResultRef = null;
    await firebaseSignOut(auth);
  };

  // Admin access validation
  const getPhoneNumber = (): string => {
    if (!user) return "";
    return "phoneNumber" in user ? (user.phoneNumber ?? "") : "";
  };

  const currentPhone = getPhoneNumber();
  const normalizedCurrent = currentPhone.replace(/\D/g, "").slice(-10);
  
  const isDeveloper = DEVELOPER_PHONES.some(p => p.replace(/\D/g, "").slice(-10) === normalizedCurrent && normalizedCurrent !== "");
  const isAdmin = isDeveloper || dynamicAdminPhones.some(p => p.replace(/\D/g, "").slice(-10) === normalizedCurrent && normalizedCurrent !== "");

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin, isDeveloper, isSimulated: activeSimulatedMode,
      sendOtp, verifyOtp, updateDisplayName, signOut,
    }}>
      {/* Invisible reCAPTCHA anchor */}
      <div id="recaptcha-container" />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
