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
  /** Nombre corto de la provincia (ej. \"Hab\", \"Mtzas\"), derivado de la relación con provincia_id */
  provincia_short_name: string | null;
  municipio_id: string | null;
  promedio_puntuacion: number; // Promedio de calificaciones (0 si no hay opiniones)
  horario: string | null;
  facebook_link: string | null;
  instagram_link: string | null;
  sitio_web: string | null;
};

function sortSitios(list: SitioRelevante[]): SitioRelevante[] {
  const next = [...list];
  next.sort((a, b) => {
    if (a.tipo_sitio_id !== b.tipo_sitio_id) {
      if (a.tipo_sitio_id === null) return 1;
      if (b.tipo_sitio_id === null) return -1;
      return a.tipo_sitio_id - b.tipo_sitio_id;
    }
    return b.promedio_puntuacion - a.promedio_puntuacion;
  });
  return next;
}

function mergeById(
  base: SitioRelevante[],
  incoming: SitioRelevante[],
): SitioRelevante[] {
  const map = new Map<number, SitioRelevante>();
  for (const s of base) map.set(s.id, s);
  for (const s of incoming) map.set(s.id, s);
  return Array.from(map.values());
}

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
        [
          "id",
          "nombre",
          "localizacion",
          "descripcion",
          "imagenes",
          "ofertas",
          "menus",
          "tipo_sitio_id",
          "direccion",
          "telefono",
          "contador_opiniones",
          "provincia_id",
          "municipio_id",
          "horario",
          "facebook_link",
          "instagram_link",
          "sitio_web",
          // Relación con la tabla provincia para obtener short_name
          "provincia:provincia_id (short_name)",
        ].join(", "),
      )
      .eq("estado_suscripcion", "aceptado")
      .order("tipo_sitio_id", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true })
      .range(from, to);
    if (err) {
      console.error("[useSitiosRelevantes] error:", err);
      throw err;
    }

    type RawSitio = Omit<
      SitioRelevante,
      "promedio_puntuacion" | "provincia_short_name"
    > & {
      provincia?: { short_name: string | null } | null;
    };

    const sitios = (data ?? []) as RawSitio[];

    // Obtener promedios para estos sitios
    const sitioIds = sitios.map((s) => s.id);
    const promedios = await fetchPromedios(sitioIds);

    // Combinar datos
    return sitios.map((sitio) => ({
      ...sitio,
      provincia_short_name: sitio.provincia?.short_name ?? null,
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

      // 1) Cargar todas las páginas desde Supabase y construir un snapshot completo.
      const allPages: SitioRelevante[] = [];

      // Primera página
      const first = await fetchPage(0, PAGE_SIZE - 1);
      if (requestIdRef.current !== requestId) {
        finish(false);
        return;
      }
      allPages.push(...first);

      // Resto de páginas
      setLoadingMore(true);
      let offset = PAGE_SIZE;
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

      // 2) Ordenar y reemplazar lista completa por la fuente de verdad del servidor.
      const serverAll = sortSitios(allPages);
      cachedSitiosRelevantes = serverAll;
      setSitios(serverAll);

      // 3) Actualizar cache SQLite en segundo plano.
      if (serverAll.length > 0) {
        void replaceCachedSitiosRelevantes(serverAll).catch((e) => {
          console.warn("[useSitiosRelevantes] error al guardar cache SQLite:", e);
        });
      }

      finish(true);
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar sitios relevantes");
      setError(msg);
      // En caso de error, mantenemos lo que ya había en memoria / SQLite.
      finish(false);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setLoadingMore(false);
      }
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
