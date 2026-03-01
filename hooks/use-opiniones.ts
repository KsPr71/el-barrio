import { useOpinionStats } from "@/contexts/opinion-stats-context";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import {
  getCachedOpinionesBySitioId,
  replaceCachedOpinionesForSitio,
} from "@/lib/offline-sitios-db";

export type Opinion = {
  id: string;
  sitio_id: number;
  calificacion: number;
  comentario: string | null;
  autor_texto: string | null;
  creado_at: string;
};

export type OpinionStats = {
  promedio: number;
  total: number;
  distribucion: { [key: number]: number }; // Distribución por calificación (1-5)
};

function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (
    e &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  ) {
    return (e as { message: string }).message;
  }
  return fallback;
}

function computeStatsFromOpiniones(opinionesData: Opinion[]): OpinionStats {
  if (opinionesData.length === 0) {
    return { promedio: 0, total: 0, distribucion: {} };
  }
  const suma = opinionesData.reduce((acc, o) => acc + o.calificacion, 0);
  const promedio = suma / opinionesData.length;
  const distribucion: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  opinionesData.forEach((o) => {
    distribucion[o.calificacion] = (distribucion[o.calificacion] || 0) + 1;
  });
  return {
    promedio: Math.round(promedio * 10) / 10,
    total: opinionesData.length,
    distribucion,
  };
}

export function useOpiniones(sitioId: number | null) {
  const { notifyOpinionUpdated } = useOpinionStats();
  const [opiniones, setOpiniones] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OpinionStats>({
    promedio: 0,
    total: 0,
    distribucion: {},
  });

  const computeStats = useCallback((opinionesData: Opinion[]) => {
    const next = computeStatsFromOpiniones(opinionesData);
    setStats(next);
  }, []);

  const fetchOpiniones = useCallback(async (): Promise<Opinion[] | null> => {
    if (!sitioId) {
      setOpiniones([]);
      setStats({ promedio: 0, total: 0, distribucion: {} });
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("opiniones")
        .select("id, sitio_id, calificacion, comentario, autor_texto, creado_at")
        .eq("sitio_id", sitioId)
        .order("creado_at", { ascending: false });

      if (err) {
        console.error("[useOpiniones] error:", err);
        throw err;
      }

      const opinionesData = (data ?? []) as Opinion[];
      setOpiniones(opinionesData);
      computeStats(opinionesData);
      void replaceCachedOpinionesForSitio(sitioId, opinionesData).catch((e) => {
        console.warn("[useOpiniones] error al guardar cache SQLite:", e);
      });
      return opinionesData;
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar opiniones");
      setError(msg);
      setOpiniones([]);
      setStats({ promedio: 0, total: 0, distribucion: {} });
      return null;
    } finally {
      setLoading(false);
    }
  }, [sitioId, computeStats]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!sitioId) {
        setOpiniones([]);
        setStats({ promedio: 0, total: 0, distribucion: {} });
        setLoading(false);
        return;
      }

      // Cuando cambia el sitio, limpiamos inmediatamente el estado para evitar
      // mostrar opiniones de otro sitio mientras se carga.
      setOpiniones([]);
      setStats({ promedio: 0, total: 0, distribucion: {} });
      setLoading(true);

      // 1) SQLite primero (offline/instantáneo)
      try {
        const local = await getCachedOpinionesBySitioId(sitioId);
        if (!cancelled && local.length > 0) {
          setOpiniones(local);
          computeStats(local);
          setLoading(false);
        }
      } catch (e) {
        console.warn("[useOpiniones] error al leer cache SQLite:", e);
      } finally {
        // 2) Supabase en segundo plano
        if (!cancelled) void fetchOpiniones();
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [fetchOpiniones, sitioId, computeStats]);

  const crearOpinion = useCallback(
    async (
      sitioId: number,
      calificacion: number,
      comentario: string | null,
      autorTexto: string | null
    ): Promise<void> => {
      try {
        const { error: err } = await supabase.from("opiniones").insert({
          sitio_id: sitioId,
          calificacion,
          comentario: comentario || null,
          autor_texto: autorTexto || null,
        });

        if (err) {
          console.error("[useOpiniones] error al crear opinión:", err);
          throw err;
        }

        // Refrescar opiniones después de crear
        const opinionesData = await fetchOpiniones();
        if (opinionesData) {
          const { promedio, total } = computeStatsFromOpiniones(opinionesData);
          notifyOpinionUpdated(sitioId, promedio, total);
        }
      } catch (e) {
        const msg = getErrorMessage(e, "Error al crear opinión");
        throw new Error(msg);
      }
    },
    [fetchOpiniones, notifyOpinionUpdated]
  );

  return {
    opiniones,
    stats,
    loading,
    error,
    refresh: fetchOpiniones,
    crearOpinion,
  };
}
