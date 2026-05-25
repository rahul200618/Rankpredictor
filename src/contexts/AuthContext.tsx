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

// ─── Detect localhost / dev environment ───────────────────────────────────────
const IS_LOCALHOST =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

// ─── Simulated User (dev only) ────────────────────────────────────────────────
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
  isDevMode: boolean; // true only on localhost
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<any>;
  updateDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── Developer phone list (from environment variable) ─────────────────────────
// Set VITE_DEVELOPER_PHONES in your .env.local as a comma-separated list
const DEVELOPER_PHONES = (import.meta.env.VITE_DEVELOPER_PHONES ?? "")
  .split(",")
  .map((p: string) => p.trim())
  .filter(Boolean);

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isDeveloper: false,
  isDevMode: false,
  sendOtp: async () => { },
  verifyOtp: async () => { throw new Error("Not ready"); },
  updateDisplayName: async () => { },
  signOut: async () => { },
});

let confirmationResultRef: ConfirmationResult | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | SimulatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [simPhone, setSimPhone] = useState<string>("");
  const [dynamicAdminPhones, setDynamicAdminPhones] = useState<string[]>([]);

  useEffect(() => {
    // Initial fetch of admin phones
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
          } catch (e) { }
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
          } catch (e) { }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Session sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (IS_LOCALHOST) {
      // On localhost: restore any previously stored dev session
      const stored = localStorage.getItem("rankprediction_dev_user");
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch {
          localStorage.removeItem("rankprediction_dev_user");
        }
      }
      setLoading(false);
    } else {
      // Production: real Firebase auth state
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
      return unsub;
    }
  }, []);

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const sendOtp = async (phone: string) => {
    if (IS_LOCALHOST) {
      // Dev mode: skip real SMS, just store the phone
      setSimPhone(phone);
      toast({
        title: "🛠️ Dev Mode — OTP Bypassed",
        description: "Running on localhost. Enter code: 123456",
        duration: 8000,
      });
      return;
    }

    // Production: real Firebase phone auth
    const triggerSignIn = async () => {
      let verifier = (window as any)._recaptchaVerifier;

      if (verifier) {
        try { verifier.clear(); } catch (e) { }
        (window as any)._recaptchaVerifier = null;
      }

      // Remove any existing dynamic recaptcha container
      const oldContainer = document.getElementById("dynamic-recaptcha-container");
      if (oldContainer) {
        try { oldContainer.remove(); } catch (e) { }
      }

      // Create a fresh dynamic recaptcha container and append to body
      const container = document.createElement("div");
      container.id = "dynamic-recaptcha-container";
      document.body.appendChild(container);

      verifier = new RecaptchaVerifier(auth, container, {
        size: "invisible",
        callback: () => { },
      });
      (window as any)._recaptchaVerifier = verifier;

      return signInWithPhoneNumber(auth, phone, verifier);
    };

    try {
      confirmationResultRef = await triggerSignIn();
    } catch (err: any) {
      console.warn("First sign-in attempt failed. Retrying with fresh recaptcha...", err);
      try {
        confirmationResultRef = await triggerSignIn();
      } catch (retryErr: any) {
        throw retryErr;
      }
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const verifyOtp = async (otp: string): Promise<any> => {
    if (IS_LOCALHOST) {
      if (otp !== "123456") {
        throw new Error("Dev mode: use code 123456");
      }
      const devUser: SimulatedUser = {
        uid: `dev-user-${simPhone}`,
        phoneNumber: simPhone,
        displayName: localStorage.getItem("rankprediction_dev_name") || null,
      };
      localStorage.setItem("rankprediction_dev_user", JSON.stringify(devUser));
      setUser(devUser);
      return devUser;
    }

    // Production: real Firebase verification
    if (!confirmationResultRef) throw new Error("No OTP session active. Please request a new code.");
    const result = await confirmationResultRef.confirm(otp);
    return result.user;
  };

  // ── Update display name ────────────────────────────────────────────────────
  const updateDisplayName = async (name: string) => {
    if (IS_LOCALHOST) {
      localStorage.setItem("rankprediction_dev_name", name);
      const updatedUser = { ...user, displayName: name } as SimulatedUser;
      localStorage.setItem("rankprediction_dev_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return;
    }
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName: name });
    setUser({ ...auth.currentUser });
  };

  // ── Sign Out ───────────────────────────────────────────────────────────────
  const signOut = async () => {
    if (IS_LOCALHOST) {
      localStorage.removeItem("rankprediction_dev_user");
      localStorage.removeItem("rankprediction_dev_name");
      setUser(null);
      return;
    }
    confirmationResultRef = null;
    await firebaseSignOut(auth);
  };

  // ── Admin / Developer access validation ───────────────────────────────────
  const getPhoneNumber = (): string => {
    if (!user) return "";
    return "phoneNumber" in user ? (user.phoneNumber ?? "") : "";
  };

  const currentPhone = getPhoneNumber();
  const normalizedCurrent = currentPhone.replace(/\D/g, "").slice(-10);

  const isDeveloper = DEVELOPER_PHONES.some(
    p => p.replace(/\D/g, "").slice(-10) === normalizedCurrent && normalizedCurrent !== ""
  );
  const isAdmin = isDeveloper || dynamicAdminPhones.some(
    p => p.replace(/\D/g, "").slice(-10) === normalizedCurrent && normalizedCurrent !== ""
  );

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin, isDeveloper,
      isDevMode: IS_LOCALHOST,
      sendOtp, verifyOtp, updateDisplayName, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
