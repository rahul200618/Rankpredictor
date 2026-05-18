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
  isSimulated: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<any>;
  updateDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── Admin phone list ────────────────────────────────────────────────────────
const ADMIN_PHONES = ["+919999999999", "+917026802690"];

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
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

  // Determine if we should run in zero-configuration simulation mode
  const isSimulated =
    !import.meta.env.VITE_FIREBASE_API_KEY ||
    import.meta.env.VITE_FIREBASE_API_KEY.includes("AIzaSy...") ||
    import.meta.env.VITE_FIREBASE_PROJECT_ID === "your-project-id";

  // ── Session Sync (Supports local HMR/refresh persistence) ──────────────────
  useEffect(() => {
    if (isSimulated) {
      const stored = localStorage.getItem("predictrank_sim_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          localStorage.removeItem("predictrank_sim_user");
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
  }, [isSimulated]);

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const sendOtp = async (phone: string) => {
    if (isSimulated) {
      setSimPhone(phone);
      // Simulate SMS Delivery with a premium dashboard notification
      toast({
        title: "🔑 Test Verification Code",
        description: `OTP sent successfully. For local testing, use code: 123456`,
        duration: 8000,
      });
      return;
    }

    // Real Firebase Setup
    if ((window as any)._recaptchaVerifier) {
      (window as any)._recaptchaVerifier.clear();
    }

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
    });
    (window as any)._recaptchaVerifier = verifier;

    confirmationResultRef = await signInWithPhoneNumber(auth, phone, verifier);
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const verifyOtp = async (otp: string): Promise<any> => {
    if (isSimulated) {
      if (otp !== "123456") {
        throw new Error("Invalid OTP code. For simulated mode, enter: 123456");
      }
      const simUser: SimulatedUser = {
        uid: `sim-user-${simPhone}`,
        phoneNumber: simPhone,
        displayName: localStorage.getItem("predictrank_sim_name") || null,
      };
      localStorage.setItem("predictrank_sim_user", JSON.stringify(simUser));
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
    if (isSimulated) {
      localStorage.setItem("predictrank_sim_name", name);
      const updatedUser = { ...user, displayName: name } as SimulatedUser;
      localStorage.setItem("predictrank_sim_user", JSON.stringify(updatedUser));
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
    if (isSimulated) {
      localStorage.removeItem("predictrank_sim_user");
      setUser(null);
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

  const isAdmin = ADMIN_PHONES.includes(getPhoneNumber());

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin, isSimulated,
      sendOtp, verifyOtp, updateDisplayName, signOut,
    }}>
      {/* Invisible reCAPTCHA anchor */}
      <div id="recaptcha-container" style={{ display: "none" }} />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
