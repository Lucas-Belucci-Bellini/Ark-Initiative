import { useEffect, useState } from "react";

export type ArcaNetworkStatus = "online" | "offline" | "recovering";

/** Exposes browser connectivity only; it does not record a user's network identity or location. */
export function useNetworkStatus(): ArcaNetworkStatus {
  const [status, setStatus] = useState<ArcaNetworkStatus>(() => navigator.onLine ? "online" : "offline");

  useEffect(() => {
    let recoveryTimer: number | undefined;
    const goOffline = () => {
      if (recoveryTimer) window.clearTimeout(recoveryTimer);
      setStatus("offline");
    };
    const recover = () => {
      setStatus("recovering");
      recoveryTimer = window.setTimeout(() => setStatus("online"), 1_200);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", recover);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", recover);
      if (recoveryTimer) window.clearTimeout(recoveryTimer);
    };
  }, []);

  return status;
}
