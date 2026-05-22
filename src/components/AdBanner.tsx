import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── Ad slot configurations ────────────────────────────────────────────────────
// Replace the data-ad-slot values with your actual slot IDs from Google AdSense
// AdSense → Ads → By ad unit → Display ads → copy the slot number
export type AdFormat = "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";

interface AdBannerProps {
  slot: string;          // Your AdSense ad slot ID e.g. "1234567890"
  format?: AdFormat;
  className?: string;
  style?: React.CSSProperties;
}

// ── Global feature_ads cache (avoid re-fetching per component) ───────────────
let adsEnabled: boolean | null = null;
let adsEnabledListeners: Array<(v: boolean) => void> = [];

const fetchAdsFlag = async () => {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "feature_ads")
      .single();
    const val = data?.setting_value;
    adsEnabled = val === true || val === "true";
  } catch {
    adsEnabled = false;
  }
  adsEnabledListeners.forEach(fn => fn(adsEnabled!));
  adsEnabledListeners = [];
};

// Kick off the fetch immediately when the module loads
fetchAdsFlag();

// ─────────────────────────────────────────────────────────────────────────────

export function AdBanner({ slot, format = "auto", className = "", style }: AdBannerProps) {
  const adRef = useRef<HTMLInsElement>(null);
  const [show, setShow] = useState<boolean | null>(adsEnabled);
  const pushed = useRef(false);

  // Wait for the feature flag if not yet loaded
  useEffect(() => {
    if (adsEnabled !== null) {
      setShow(adsEnabled);
      return;
    }
    const handler = (v: boolean) => setShow(v);
    adsEnabledListeners.push(handler);
    return () => {
      adsEnabledListeners = adsEnabledListeners.filter(fn => fn !== handler);
    };
  }, []);

  // Push the ad once we know ads are enabled
  useEffect(() => {
    if (!show || pushed.current) return;
    if (!adRef.current) return;
    try {
      pushed.current = true;
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.warn("[AdBanner] adsbygoogle push failed:", e);
    }
  }, [show]);

  // Don't render anything if ads are disabled or flag not yet loaded
  if (!show) return null;

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={style}
      aria-label="Advertisement"
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5664325162210470"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
