import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCachedSitiosRelevantes,
  replaceCachedSitiosRelevantes,
} from "@/lib/offline-sitios-db";
import { useSyncStatus } from "@/contexts/sync-status-context";

/** Cache en memoria para no tener que consultar la BD en cada búsqueda (p. ej. en "Aquí hay") */
let cachedSitiosRelevantes: SitioRelevante[] | null = null;

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
  promedio_puntuacion: number; // Promedio de calificaciones (0 si no hay opiniones)
  horario: string | null;
  facebook_link: string | null;
  instagram_link: string | null;
  sitio_web: string | null;
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
  const { startSync, endSync } = useSyncStatus();
  const [sitios, setSitios] = useState<SitioRelevante[]>(() => cachedSitiosRelevantes ?? []);
  // loading: mientras no hay cache persistente ni en memoria, mostramos loader.
  const [loading, setLoading] = useState(() => cachedSitiosRelevantes === null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const PAGE_SIZE = 25;

  // Obtener promedios de calificaciones para todos los sitios
  const fetchPromedios = useCallback(async (sitioIds: number[]) => {
    if (sitioIds.length === 0) return new Map<number, number>();
    
    const { data, error: err } = await supabase
      .from("opiniones")
      .select("sitio_id, calificacion")
      .in("sitio_id", sitioIds);
    
    if (err) {
      console.error("[useSitiosRelevantes] error al obtener promedios:", err);
      return new Map<number, number>();
    }
    
    // Calcular promedio por sitio
    const promedios = new Map<number, { suma: number; count: number }>();
    (data ?? []).forEach((o) => {
      const current = promedios.get(o.sitio_id) || { suma: 0, count: 0 };
      promedios.set(o.sitio_id, {
        suma: current.suma + o.calificacion,
        count: current.count + 1,
      });
    });
    
    const resultado = new Map<number, number>();
    promedios.forEach((val, sitioId) => {
      resultado.set(sitioId, Math.round((val.suma / val.count) * 10) / 10);
    });
    
    return resultado;
  }, []);

  const fetchPage = useCallback(async (from: number, to: number) => {
    const { data, error: err } = await supabase
      .from("sitios_relevantes")
      .select(
        "id, nombre, localizacion, descripcion, imagenes, ofertas, menus, tipo_sitio_id, direccion, telefono, contador_opiniones, provincia_id, municipio_id, horario, facebook_link, instagram_link, sitio_web",
      )
      .eq("estado_suscripcion", "aceptado")
      .order("tipo_sitio_id", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true })
      .range(from, to);
    if (err) {
      console.error("[useSitiosRelevantes] error:", err);
      throw err;
    }
    
    const sitios = (data ?? []) as Omit<SitioRelevante, "promedio_puntuacion">[];
    
    // Obtener promedios para estos sitios
    const sitioIds = sitios.map((s) => s.id);
    const promedios = await fetchPromedios(sitioIds);
    
    // Combinar datos
    return sitios.map((sitio) => ({
      ...sitio,
      promedio_puntuacion: promedios.get(sitio.id) ?? 0,
    })) as SitioRelevante[];
  }, [fetchPromedios]);

  const fetchSitios = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const syncKey = `sitios_${requestId}`;
    startSync(syncKey);
    let finished = false;
    const finish = (ok: boolean) => {
      if (finished) return;
      finished = true;
      endSync(syncKey, ok);
    };
    
    try {
      setLoading(true);
      setLoadingMore(false);
      setError(null);
      try {
        // 1) Cargar rápido la primera página para pintar la pantalla
        const first = await fetchPage(0, PAGE_SIZE - 1);
        if (requestIdRef.current !== requestId) {
          finish(false);
          return;
        }
        // Ordenar primera página por tipo_sitio_id y luego por puntuación
        first.sort((a, b) => {
          if (a.tipo_sitio_id !== b.tipo_sitio_id) {
            if (a.tipo_sitio_id === null) return 1;
            if (b.tipo_sitio_id === null) return -1;
            return a.tipo_sitio_id - b.tipo_sitio_id;
          }
          return b.promedio_puntuacion - a.promedio_puntuacion;
        });
        cachedSitiosRelevantes = first;
        setSitios(first);
      } catch (e) {
        const msg = getErrorMessage(e, "Error al cargar sitios relevantes");
        setError(msg);
        cachedSitiosRelevantes = null;
        setSitios([]);
        // Si falla la primera página, terminamos aquí
        finish(false);
        return;
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }

      // 2) Cargar el resto en segundo plano (sin bloquear UI)
      if (requestIdRef.current !== requestId) {
        finish(false);
        return;
      }
      setLoadingMore(true);
      try {
        let offset = PAGE_SIZE;
        // Seguir mientras sigan llegando páginas completas
        const allPages: SitioRelevante[] = [];
        for (;;) {
          if (requestIdRef.current !== requestId) {
            finish(false);
            return;
          }
          const page = await fetchPage(offset, offset + PAGE_SIZE - 1);
          if (requestIdRef.current !== requestId) {
            finish(false);
            return;
          }
          if (page.length === 0) break;
          allPages.push(...page);
          if (page.length < PAGE_SIZE) break;
          offset += PAGE_SIZE;
        }
        
        // Ordenar todos los sitios: primero por tipo_sitio_id, luego por promedio_puntuacion descendente
        allPages.sort((a, b) => {
          // Primero agrupar por tipo_sitio_id (nulls al final)
          if (a.tipo_sitio_id !== b.tipo_sitio_id) {
            if (a.tipo_sitio_id === null) return 1;
            if (b.tipo_sitio_id === null) return -1;
            return a.tipo_sitio_id - b.tipo_sitio_id;
          }
          // Dentro del mismo tipo, ordenar por puntuación descendente
          return b.promedio_puntuacion - a.promedio_puntuacion;
        });
        
        setSitios((prev) => {
          const combined = [...prev, ...allPages];
          combined.sort((a, b) => {
            if (a.tipo_sitio_id !== b.tipo_sitio_id) {
              if (a.tipo_sitio_id === null) return 1;
              if (b.tipo_sitio_id === null) return -1;
              return a.tipo_sitio_id - b.tipo_sitio_id;
            }
            return b.promedio_puntuacion - a.promedio_puntuacion;
          });
          cachedSitiosRelevantes = combined;
          return combined;
        });
      } catch (e) {
        // Si falla la carga incremental, mantenemos lo ya cargado y solo mostramos el error.
        const msg = getErrorMessage(e, "Error al cargar más sitios");
        setError(msg);
      } finally {
        if (requestIdRef.current === requestId) {
          setLoadingMore(false);
        }
      }
      // Sincronizar cache persistente en segundo plano con la última lista conocida
      if (cachedSitiosRelevantes && cachedSitiosRelevantes.length > 0) {
        void replaceCachedSitiosRelevantes(cachedSitiosRelevantes).catch((e) => {
          console.warn("[useSitiosRelevantes] error al guardar cache SQLite:", e);
        });
      }
      finish(true);
    } catch (e) {
      // Catch-all para cualquier error inesperado
      console.error("[useSitiosRelevantes] error inesperado en fetchSitios:", e);
      finish(false);
    }
  }, [fetchPage, startSync, endSync]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        // 1) Intentar cargar desde SQLite para mostrar datos al instante / offline
        const local = await getCachedSitiosRelevantes();
        if (!cancelled && local.length > 0) {
          cachedSitiosRelevantes = local;
          setSitios(local);
          setLoading(false);
        }
      } catch (e) {
        console.warn("[useSitiosRelevantes] error al leer cache SQLite:", e);
      } finally {
        // 2) Siempre intentar refrescar desde Supabase en segundo plano
        if (!cancelled) {
          void fetchSitios();
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
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
