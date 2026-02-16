import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export type SitioRelevante = {
  id: number;
  nombre: string;
  localizacion: string;
  descripcion: string | null;
  imagenes: string | null;
  ofertas: string | null;
  menus: unknown | null;
  tipo_sitio_id: number | null;
  direccion: string | null;
  telefono: number | null;
  contador_opiniones: number;
  provincia_id: string | null;
  municipio_id: string | null;
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

export function useSitiosRelevantes() {
  const [sitios, setSitios] = useState<SitioRelevante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSitios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("sitios_relevantes")
        .select(
          "id, nombre, localizacion, descripcion, imagenes, ofertas, menus, tipo_sitio_id, direccion, telefono, contador_opiniones, provincia_id, municipio_id"
        )
        .order("id", { ascending: true });
      if (err) {
        console.error("[useSitiosRelevantes] error:", err);
        throw err;
      }
      setSitios((data ?? []) as SitioRelevante[]);
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar sitios relevantes");
      setError(msg);
      setSitios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSitios();
  }, [fetchSitios]);

  return { sitios, loading, error, refresh: fetchSitios };
}
