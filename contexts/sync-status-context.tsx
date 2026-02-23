import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type SyncStatusContextValue = {
  isSyncing: boolean;
  lastUpdatedAt: number | null;
  justUpdated: boolean;
  startSync: (key?: string) => void;
  endSync: (key?: string, ok?: boolean) => void;
};

const SyncStatusContext = createContext<SyncStatusContextValue | null>(null);

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [inFlight, setInFlight] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);

  // Para evitar double-end accidental
  const activeKeysRef = useRef(new Set<string>());

  const startSync = useCallback((key?: string) => {
    const k = key ?? `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    activeKeysRef.current.add(k);
    setInFlight((n) => n + 1);
  }, []);

  const endSync = useCallback((key?: string, ok: boolean = true) => {
    if (key) {
      // Si por alguna razón la key no está registrada (race/return temprano),
      // igual decrementamos para evitar que el spinner se quede pegado.
      if (activeKeysRef.current.has(key)) {
        activeKeysRef.current.delete(key);
      }
    }
    setInFlight((n) => Math.max(0, n - 1));
    if (ok) {
      setLastUpdatedAt(Date.now());
      setJustUpdated(true);
    }
  }, []);

  useEffect(() => {
    if (!justUpdated) return;
    const t = setTimeout(() => setJustUpdated(false), 2200);
    return () => clearTimeout(t);
  }, [justUpdated]);

  const value = useMemo(
    () => ({
      isSyncing: inFlight > 0,
      lastUpdatedAt,
      justUpdated,
      startSync,
      endSync,
    }),
    [inFlight, lastUpdatedAt, justUpdated, startSync, endSync],
  );

  return <SyncStatusContext.Provider value={value}>{children}</SyncStatusContext.Provider>;
}

export function useSyncStatus(): SyncStatusContextValue {
  const ctx = useContext(SyncStatusContext);
  if (!ctx) throw new Error("useSyncStatus must be used within SyncStatusProvider");
  return ctx;
}

