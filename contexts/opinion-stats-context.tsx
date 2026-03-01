import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type OpinionStatsUpdate = {
  sitioId: number;
  promedio: number;
  total: number;
};

type OpinionStatsContextValue = {
  /** Última actualización de opiniones (ej. tras crear una nueva) */
  lastUpdate: OpinionStatsUpdate | null;
  /** Notifica que las opiniones de un sitio se actualizaron (ej. tras crear una) */
  notifyOpinionUpdated: (sitioId: number, promedio: number, total: number) => void;
};

const OpinionStatsContext = createContext<OpinionStatsContextValue | null>(null);

export function OpinionStatsProvider({ children }: { children: React.ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState<OpinionStatsUpdate | null>(null);

  const notifyOpinionUpdated = useCallback(
    (sitioId: number, promedio: number, total: number) => {
      setLastUpdate({ sitioId, promedio, total });
    },
    [],
  );

  const value = useMemo(
    () => ({ lastUpdate, notifyOpinionUpdated }),
    [lastUpdate, notifyOpinionUpdated],
  );

  return (
    <OpinionStatsContext.Provider value={value}>
      {children}
    </OpinionStatsContext.Provider>
  );
}

export function useOpinionStats(): OpinionStatsContextValue {
  const ctx = useContext(OpinionStatsContext);
  if (!ctx)
    throw new Error("useOpinionStats must be used within OpinionStatsProvider");
  return ctx;
}
