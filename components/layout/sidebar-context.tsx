"use client";

import * as React from "react";

// Desktop sidebar collapse state, shared between the rail (which slides out) and
// the content shell (which reclaims the freed width). Persisted to localStorage
// so the choice survives reloads. Mobile uses its own drawer and ignores this.
interface SidebarContextValue {
  hidden: boolean;
  setHidden: (value: boolean) => void;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);
const STORAGE_KEY = "rd7:sidebar-hidden";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHiddenState] = React.useState(false);

  // Load the persisted choice after mount (avoids an SSR/client mismatch).
  React.useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setHiddenState(true);
    } catch {
      /* localStorage unavailable — fall back to visible */
    }
  }, []);

  const persist = React.useCallback((value: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const setHidden = React.useCallback(
    (value: boolean) => {
      setHiddenState(value);
      persist(value);
    },
    [persist],
  );

  const toggle = React.useCallback(() => {
    setHiddenState((prev) => {
      persist(!prev);
      return !prev;
    });
  }, [persist]);

  const value = React.useMemo(
    () => ({ hidden, setHidden, toggle }),
    [hidden, setHidden, toggle],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarContextValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}
