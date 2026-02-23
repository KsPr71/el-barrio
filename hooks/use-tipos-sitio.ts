import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import { getCachedTiposSitio, replaceCachedTiposSitio } from "@/lib/offline-sitios-db";

export type TipoSitio = {
  id: number;
  tipo: string;
  descripcion: string | null;
};

/** Cache en memoria para no recargar categorías en cada visita a una pantalla */
let cachedTipos: TipoSitio[] | null = null;

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

export function useTiposSitio() {
  const [tipos, setTipos] = useState<TipoSitio[]>(() => cachedTipos ?? []);
  const [loading, setLoading] = useState(() => cachedTipos === null);
  const [error, setError] = useState<string | null>(null);

  const fetchTipos = useCallback(async () => {
    const hasCache = cachedTipos !== null;
    if (!hasCache) {
      setLoading(true);
    }
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("tipos_sitio")
        .select("id, tipo, descripcion")
        .order("tipo");
      if (err) {
        console.error("[useTiposSitio] error:", err);
        throw err;
      }
      const list = (data ?? []) as TipoSitio[];
      cachedTipos = list;
      setTipos(list);
      void replaceCachedTiposSitio(list).catch((e) => {
        console.warn("[useTiposSitio] error al guardar cache SQLite:", e);
      });
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar tipos de sitio");
      setError(msg);
      if (!hasCache) {
        setTipos([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const local = await getCachedTiposSitio();
        if (!cancelled && local.length > 0) {
          cachedTipos = local;
          setTipos(local);
          setLoading(false);
        }
      } catch (e) {
        console.warn("[useTiposSitio] error al leer cache SQLite:", e);
      } finally {
        if (!cancelled) void fetchTipos();
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [fetchTipos]);

  // Realtime: actualizar caché y estado cuando cambie la tabla tipos_sitio en Supabase
  useEffect(() => {
    const channel = supabase
      .channel("tipos_sitio_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tipos_sitio",
        },
        () => {
          fetchTipos();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTipos]);

  return { tipos, loading, error, refresh: fetchTipos };
}
