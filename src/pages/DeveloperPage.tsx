import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { 
  Settings, ChevronLeft, Save, 
  TerminalSquare, Loader2, ShieldAlert,
  Users, UserPlus, Trash2, Key
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function DeveloperPage() {
  const { isDeveloper, loading: authLoading, sendOtp, verifyOtp, user } = useAuth();
  const [, setLocation] = useLocation();
  const supabaseAny = supabase as any;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpStep, setOtpStep] = useState<"idle" | "sent" | "verifying">("idle");
  const [otp, setOtp] = useState("");
  
  // Feature flags state
  const [features, setFeatures] = useState({
    feature_kcet: true,
    feature_comedk: false,
    feature_ads: false
  });
  
  // Admins state
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isDeveloper) {
      toast({ title: "Access Denied", description: "Developer privileges required.", variant: "destructive" });
      setLocation("/");
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabaseAny.from("app_settings").select("*");
        if (error) {
          console.warn("Settings table might not exist yet:", error.message);
          return;
        }

        if (data && data.length > 0) {
          const newFeatures = { ...features };
          let loadedAdmins: string[] = [];
          (data as any[]).forEach(item => {
            if (item.setting_key in newFeatures) {
              (newFeatures as any)[item.setting_key] = item.setting_value === "true" || item.setting_value === true;
            }
            if (item.setting_key === "admin_phones") {
              try {
                const parsed = typeof item.setting_value === 'string' ? JSON.parse(item.setting_value) : item.setting_value;
                if (Array.isArray(parsed)) loadedAdmins = parsed;
              } catch(e) {}
            }
          });
          setFeatures(newFeatures);
          setAdmins(loadedAdmins);
        }
      } catch (err) {
        console.error("Error fetching settings", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Real-time subscription for feature flags and admin settings
    const channel = supabase
      .channel("app_settings_realtime_dev")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        () => {
          // Refetch settings when any change occurs
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDeveloper, authLoading, setLocation]);

  const handleSendOtp = async () => {
    try {
      setOtpStep("sent");
      const phone = user && "phoneNumber" in user ? user.phoneNumber : "";
      if (!phone) throw new Error("No phone number found on account.");
      await sendOtp(phone);
      toast({ title: "OTP Sent", description: "Please check your messages." });
    } catch (e: any) {
      setOtpStep("idle");
      toast({ title: "Error", description: e.message || "Failed to send OTP", variant: "destructive" });
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setOtpStep("verifying");
      await verifyOtp(otp);
      setVerified(true);
      toast({ title: "Verified", description: "Developer access granted." });
    } catch (e: any) {
      setOtpStep("sent");
      toast({ title: "Verification Failed", description: "Invalid OTP code.", variant: "destructive" });
    }
  };

  const handleToggle = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const persistAdmins = async (newAdminsList: string[]) => {
    try {
      const updates = [{
        setting_key: "admin_phones",
        setting_value: newAdminsList,
        updated_at: new Date().toISOString()
      }];

      const rpcResult = await supabaseAny.rpc("secure_update_app_settings", {
        p_updates: updates,
        p_secret: "my_super_secret_developer_key_2026"
      });
      
      if (rpcResult.error) {
        const rpcMessage = rpcResult.error.message || "";
        const shouldFallbackToTableWrite = /schema cache|could not find the function|app_settings/i.test(rpcMessage);

        if (shouldFallbackToTableWrite) {
          const fallbackResult = await supabaseAny
            .from("app_settings")
            .upsert(updates, { onConflict: "setting_key" });

          if (fallbackResult.error) {
            throw fallbackResult.error;
          }
        } else {
          throw rpcResult.error;
        }
      }
      
      toast({
        title: "✅ Access Updated",
        description: "Admins list synced successfully with Supabase.",
      });
    } catch (err: any) {
      console.error("Error saving admins list", err);
      toast({
        title: "❌ Update Failed",
        description: err.message || "Could not write to Supabase setting.",
        variant: "destructive"
      });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin || newAdmin.length < 10) {
      toast({ title: "Invalid", description: "Please enter a valid phone number with country code.", variant: "destructive" });
      return;
    }
    const formatted = newAdmin.trim().startsWith("+") ? newAdmin.trim() : `+91${newAdmin.trim()}`;
    if (!admins.includes(formatted)) {
      const updated = [...admins, formatted];
      setAdmins(updated);
      await persistAdmins(updated);
    }
    setNewAdmin("");
  };

  const handleRemoveAdmin = async (phone: string) => {
    const updated = admins.filter(a => a !== phone);
    setAdmins(updated);
    await persistAdmins(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Array<{ setting_key: string; setting_value: any; updated_at: string }> = Object.entries(features).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString()
      }));
      
      updates.push({
        setting_key: "admin_phones",
        setting_value: admins,
        updated_at: new Date().toISOString()
      });

      const rpcResult = await supabaseAny.rpc("secure_update_app_settings", {
        p_updates: updates,
        p_secret: "my_super_secret_developer_key_2026"
      });
      
      if (rpcResult.error) {
        const rpcMessage = rpcResult.error.message || "";
        const shouldFallbackToTableWrite = /schema cache|could not find the function|app_settings/i.test(rpcMessage);

        if (shouldFallbackToTableWrite) {
          const fallbackResult = await supabaseAny
            .from("app_settings")
            .upsert(updates, { onConflict: "setting_key" });

          if (fallbackResult.error) {
            throw fallbackResult.error;
          }
        } else {
          throw rpcResult.error;
        }
      }
      
      toast({ 
        title: "✅ Settings Saved", 
        description: "Developer configuration updated successfully. Changes will appear in real-time across the platform." 
      });
      
      // Settings will auto-refresh via real-time subscription
    } catch (err: any) {
      console.error("Error saving settings", err);
      const errorMsg = err?.message || "Could not save settings.";
      toast({ 
        title: "❌ Save Failed", 
        description: errorMsg.includes("app_settings") 
          ? "Supabase could not save the settings. Run app_settings.sql in the Supabase SQL Editor, then refresh this page."
          : errorMsg,
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-card border border-border p-8 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
            <Key size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black mb-2">Developer Access</h2>
            <p className="text-muted-foreground text-sm">Please verify your identity to access critical platform configuration.</p>
          </div>
          
          {otpStep === "idle" && (
            <button 
              onClick={handleSendOtp}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/25"
            >
              Send Authentication Code
            </button>
          )}

          {otpStep === "sent" && (
            <div className="w-full space-y-4">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-center font-black tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={6}
              />
              <button 
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/25"
              >
                Verify Code
              </button>
            </div>
          )}

          {otpStep === "verifying" && (
            <div className="flex flex-col items-center justify-center space-y-3 py-4">
              <Loader2 className="animate-spin text-primary" size={24} />
              <p className="text-sm font-medium">Verifying code...</p>
            </div>
          )}
          
          <button onClick={() => setLocation("/")} className="text-xs text-muted-foreground hover:text-foreground font-semibold mt-4">
            Cancel & Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/")} className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all">
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
                <TerminalSquare className="text-primary" size={28} /> Developer Area
              </h1>
              <p className="text-muted-foreground text-sm">Manage platform feature flags and configuration</p>
            </div>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 shrink-0"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Database Requirement:</strong> To save these settings, ensure you have executed the <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">app_settings.sql</code> script in your Supabase SQL Editor. Otherwise, the save operation will fail.
          </div>
        </div>

        {/* Feature Flags Grid */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border bg-muted/20">
            <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={18} className="text-primary"/> Feature Flags</h2>
          </div>
          
          <div className="divide-y divide-border">
            {/* KCET Toggle */}
            <div className="p-5 flex items-center justify-between hover:bg-muted/5 transition-colors">
              <div>
                <div className="font-bold text-foreground">KCET Predictor</div>
                <div className="text-xs text-muted-foreground mt-1">Enable or disable the KCET college prediction tools globally.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={features.feature_kcet} onChange={() => handleToggle("feature_kcet")} />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* COMEDK Toggle */}
            <div className="p-5 flex items-center justify-between hover:bg-muted/5 transition-colors">
              <div>
                <div className="font-bold text-foreground">COMEDK Predictor (Optional)</div>
                <div className="text-xs text-muted-foreground mt-1">Unlock COMEDK features. Leave disabled if you haven't finished developing it.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={features.feature_comedk} onChange={() => handleToggle("feature_comedk")} />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Ads Toggle */}
            <div className="p-5 flex items-center justify-between hover:bg-muted/5 transition-colors">
              <div>
                <div className="font-bold text-foreground">Platform Ads</div>
                <div className="text-xs text-muted-foreground mt-1">Enable AdSense or other advertisements across the platform.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={features.feature_ads} onChange={() => handleToggle("feature_ads")} />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Manage Admins Grid */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border bg-muted/20">
            <h2 className="text-lg font-bold flex items-center gap-2"><Users size={18} className="text-primary"/> Access Management</h2>
          </div>
          <div className="p-5">
            <div className="mb-6">
              <h3 className="font-bold text-foreground mb-1">Grant Admin Access</h3>
              <p className="text-xs text-muted-foreground mb-3">Add phone numbers to grant them access to the Admin Analytics Dashboard.</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={newAdmin}
                  onChange={(e) => setNewAdmin(e.target.value)}
                  className="flex-1 bg-background border border-border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleAddAdmin}
                  className="flex items-center gap-2 px-4 py-2 bg-foreground text-background font-semibold text-sm rounded-lg hover:opacity-90 transition-all"
                >
                  <UserPlus size={16} /> Add
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Current Admins</h3>
              {admins.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2 italic">No additional admins assigned.</div>
              ) : (
                <ul className="space-y-2">
                  {admins.map((admin) => (
                    <li key={admin} className="flex items-center justify-between bg-muted/40 border border-border/50 px-4 py-2.5 rounded-xl">
                      <span className="font-medium text-sm font-mono">{admin}</span>
                      <button onClick={() => handleRemoveAdmin(admin)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Remove Admin">
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
