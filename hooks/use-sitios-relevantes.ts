import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";

export type SitioRelevante = {
  id: number;
  nombre: string;
  localizacion: string | null;
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
  // loading: carga inicial (primera página). loadingMore: carga incremental posterior.
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const PAGE_SIZE = 25;

  const fetchPage = useCallback(async (from: number, to: number) => {
    const { data, error: err } = await supabase
      .from("sitios_relevantes")
      .select(
        "id, nombre, localizacion, descripcion, imagenes, ofertas, menus, tipo_sitio_id, direccion, telefono, contador_opiniones, provincia_id, municipio_id",
      )
      .eq("estado_suscripcion", "aceptado")
      .order("id", { ascending: true })
      .range(from, to);
    if (err) {
      console.error("[useSitiosRelevantes] error:", err);
      throw err;
    }
    return (data ?? []) as SitioRelevante[];
  }, []);

  const fetchSitios = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    try {
      // 1) Cargar rápido la primera página para pintar la pantalla
      const first = await fetchPage(0, PAGE_SIZE - 1);
      if (requestIdRef.current !== requestId) return;
      setSitios(first);
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar sitios relevantes");
      setError(msg);
      setSitios([]);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }

    // 2) Cargar el resto en segundo plano (sin bloquear UI)
    if (requestIdRef.current !== requestId) return;
    setLoadingMore(true);
    try {
      let offset = PAGE_SIZE;
      // Seguir mientras sigan llegando páginas completas
      for (;;) {
        if (requestIdRef.current !== requestId) return;
        const page = await fetchPage(offset, offset + PAGE_SIZE - 1);
        if (requestIdRef.current !== requestId) return;
        if (page.length === 0) break;
        setSitios((prev) => [...prev, ...page]);
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
    } catch (e) {
      // Si falla la carga incremental, mantenemos lo ya cargado y solo mostramos el error.
      const msg = getErrorMessage(e, "Error al cargar más sitios");
      setError(msg);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoadingMore(false);
      }
    }
  }, [fetchPage]);

  useEffect(() => {
    fetchSitios();
  }, [fetchSitios]);

  // Realtime: actualizar lista cuando se inserta, actualiza o elimina un sitio
  useEffect(() => {
    const channel = supabase
      .channel("sitios_relevantes_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sitios_relevantes" },
        () => {
          fetchSitios();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSitios]);

  return { sitios, loading, loadingMore, error, refresh: fetchSitios };
}
