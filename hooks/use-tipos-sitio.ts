import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export type TipoSitio = {
  id: number;
  tipo: string;
  descripcion: string | null;
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

export function useTiposSitio() {
  const [tipos, setTipos] = useState<TipoSitio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTipos = useCallback(async () => {
    setLoading(true);
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
      setTipos((data ?? []) as TipoSitio[]);
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar tipos de sitio");
      setError(msg);
      setTipos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTipos();
  }, [fetchTipos]);

  return { tipos, loading, error, refresh: fetchTipos };
}
