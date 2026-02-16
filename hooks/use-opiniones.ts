import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

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

export function useOpiniones(sitioId: number | null) {
  const [opiniones, setOpiniones] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OpinionStats>({
    promedio: 0,
    total: 0,
    distribucion: {},
  });

  const fetchOpiniones = useCallback(async () => {
    if (!sitioId) {
      setOpiniones([]);
      setStats({ promedio: 0, total: 0, distribucion: {} });
      setLoading(false);
      return;
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

      // Calcular estadísticas
      if (opinionesData.length > 0) {
        const suma = opinionesData.reduce((acc, o) => acc + o.calificacion, 0);
        const promedio = suma / opinionesData.length;
        const distribucion: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        opinionesData.forEach((o) => {
          distribucion[o.calificacion] = (distribucion[o.calificacion] || 0) + 1;
        });

        setStats({
          promedio: Math.round(promedio * 10) / 10, // Redondear a 1 decimal
          total: opinionesData.length,
          distribucion,
        });
      } else {
        setStats({ promedio: 0, total: 0, distribucion: {} });
      }
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar opiniones");
      setError(msg);
      setOpiniones([]);
      setStats({ promedio: 0, total: 0, distribucion: {} });
    } finally {
      setLoading(false);
    }
  }, [sitioId]);

  useEffect(() => {
    fetchOpiniones();
  }, [fetchOpiniones]);

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
        await fetchOpiniones();
      } catch (e) {
        const msg = getErrorMessage(e, "Error al crear opinión");
        throw new Error(msg);
      }
    },
    [fetchOpiniones]
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
