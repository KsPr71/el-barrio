import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCachedSitiosRelevantes,
  getSyncMetadata,
  replaceCachedSitiosRelevantes,
  setSyncMetadata,
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

type RawSitio = Omit<
  SitioRelevante,
  "promedio_puntuacion" | "provincia_short_name"
> & {
  provincia?: { short_name: string | null } | null;
};

type RawSitioWithUpdatedAt = RawSitio & {
  updated_at: string;
};

const SYNC_CURSOR_KEY = "sitios_relevantes:last_sync_at";
const FULL_SYNC_AT_KEY = "sitios_relevantes:last_full_sync_at";
const FULL_SYNC_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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

function shouldDoFullSync(lastFullSyncAt: string | null, hasLocalData: boolean) {
  if (!hasLocalData || !lastFullSyncAt) return true;
  const parsed = Date.parse(lastFullSyncAt);
  if (Number.isNaN(parsed)) return true;
  return Date.now() - parsed >= FULL_SYNC_MAX_AGE_MS;
}

export function useSitiosRelevantes() {
  const { startSync, endSync } = useSyncStatus();
  const [sitios, setSitios] = useState<SitioRelevante[]>(
    () => cachedSitiosRelevantes ?? [],
  );
  // loading: mientras no hay cache persistente ni en memoria, mostramos loader.
  const [loading, setLoading] = useState(
    () => cachedSitiosRelevantes === null,
  );
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

    const sitios = ((data ?? []) as unknown) as RawSitio[];

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

  const fetchLatestUpdatedAt = useCallback(async (): Promise<string | null> => {
    const { data, error: err } = await supabase
      .from("sitios_relevantes")
      .select("updated_at")
      .eq("estado_suscripcion", "aceptado")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (err) {
      console.warn(
        "[useSitiosRelevantes] no se pudo obtener updated_at para sync incremental:",
        err.message,
      );
      return null;
    }

    return data?.updated_at ?? null;
  }, []);

  const fetchChangesSince = useCallback(
    async (cursor: string) => {
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
            "updated_at",
            "provincia:provincia_id (short_name)",
          ].join(", "),
        )
        .eq("estado_suscripcion", "aceptado")
        .gte("updated_at", cursor)
        .order("updated_at", { ascending: true });

      if (err) {
        throw err;
      }

      const rows = ((data ?? []) as unknown) as RawSitioWithUpdatedAt[];
      const sitioIds = rows.map((row) => row.id);
      const promedios = await fetchPromedios(sitioIds);

      const sitios = rows.map((sitio) => ({
        id: sitio.id,
        nombre: sitio.nombre,
        localizacion: sitio.localizacion,
        descripcion: sitio.descripcion,
        imagenes: sitio.imagenes,
        ofertas: sitio.ofertas,
        menus: sitio.menus,
        tipo_sitio_id: sitio.tipo_sitio_id,
        direccion: sitio.direccion,
        telefono: sitio.telefono,
        contador_opiniones: sitio.contador_opiniones,
        provincia_id: sitio.provincia_id,
        provincia_short_name: sitio.provincia?.short_name ?? null,
        municipio_id: sitio.municipio_id,
        promedio_puntuacion: promedios.get(sitio.id) ?? 0,
        horario: sitio.horario,
        facebook_link: sitio.facebook_link,
        instagram_link: sitio.instagram_link,
        sitio_web: sitio.sitio_web,
      })) satisfies SitioRelevante[];

      const latestUpdatedAt =
        rows.length > 0 ? rows[rows.length - 1]?.updated_at ?? cursor : cursor;

      return { sitios, latestUpdatedAt };
    },
    [fetchPromedios],
  );

  const fetchAcceptedIds = useCallback(async (): Promise<Set<number>> => {
    const { data, error: err } = await supabase
      .from("sitios_relevantes")
      .select("id")
      .eq("estado_suscripcion", "aceptado")
      .order("id", { ascending: true });

    if (err) {
      throw err;
    }

    return new Set((data ?? []).map((row) => row.id));
  }, []);

  const fetchSitios = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const syncKey = `sitios_${requestId}`;
    const hadVisibleData = (cachedSitiosRelevantes?.length ?? 0) > 0;
    startSync(syncKey);
    let finished = false;
    const finish = (ok: boolean) => {
      if (finished) return;
      finished = true;
      endSync(syncKey, ok);
    };

    try {
      if (!hadVisibleData) {
        setLoading(true);
      }
      setLoadingMore(false);
      setError(null);

      const [lastSyncAt, lastFullSyncAt] = await Promise.all([
        getSyncMetadata(SYNC_CURSOR_KEY),
        getSyncMetadata(FULL_SYNC_AT_KEY),
      ]);

      const mustRunFullSync = shouldDoFullSync(lastFullSyncAt, hadVisibleData);

      if (hadVisibleData && lastSyncAt && !mustRunFullSync) {
        let incremental:
          | { sitios: SitioRelevante[]; latestUpdatedAt: string }
          | null = null;
        try {
          incremental = await fetchChangesSince(lastSyncAt);
        } catch (e) {
          console.warn(
            "[useSitiosRelevantes] fallback a sync completa:",
            getErrorMessage(e, "sync incremental no disponible"),
          );
        }

        if (incremental) {
          if (requestIdRef.current !== requestId) {
            finish(false);
            return;
          }

          const acceptedIds = await fetchAcceptedIds();
          if (requestIdRef.current !== requestId) {
            finish(false);
            return;
          }

          const nextSnapshot = sortSitios(
            mergeById(cachedSitiosRelevantes ?? [], incremental.sitios).filter(
              (sitio) => acceptedIds.has(sitio.id),
            ),
          );
          const snapshotChanged =
            nextSnapshot.length !== (cachedSitiosRelevantes?.length ?? 0) ||
            incremental.sitios.length > 0;

          if (snapshotChanged) {
            cachedSitiosRelevantes = nextSnapshot;
            setSitios(nextSnapshot);
            void replaceCachedSitiosRelevantes(nextSnapshot).catch((e) => {
              console.warn(
                "[useSitiosRelevantes] error al reconciliar cache SQLite:",
                e,
              );
            });
          }

          if (incremental.latestUpdatedAt) {
            void setSyncMetadata(SYNC_CURSOR_KEY, incremental.latestUpdatedAt);
          }

          finish(true);
          return;
        }
      }

      const first = await fetchPage(0, PAGE_SIZE - 1);
      if (requestIdRef.current !== requestId) {
        finish(false);
        return;
      }

      const firstPageIsComplete = first.length < PAGE_SIZE;
      const firstSnapshot = sortSitios(
        hadVisibleData && !firstPageIsComplete
          ? mergeById(cachedSitiosRelevantes ?? [], first)
          : first,
      );
      cachedSitiosRelevantes = firstSnapshot;
      setSitios(firstSnapshot);
      setLoading(false);

      if (firstSnapshot.length > 0) {
        void replaceCachedSitiosRelevantes(firstSnapshot).catch((e) => {
          console.warn(
            "[useSitiosRelevantes] error al guardar cache SQLite:",
            e,
          );
        });
      }

      finish(true);

      if (firstPageIsComplete) {
        const latestUpdatedAt = await fetchLatestUpdatedAt();
        if (latestUpdatedAt) {
          void setSyncMetadata(SYNC_CURSOR_KEY, latestUpdatedAt);
        }
        void setSyncMetadata(FULL_SYNC_AT_KEY, new Date().toISOString());
        return;
      }

      const allPages: SitioRelevante[] = [...first];
      setLoadingMore(true);
      let offset = PAGE_SIZE;
      for (;;) {
        if (requestIdRef.current !== requestId) {
          return;
        }
        const page = await fetchPage(offset, offset + PAGE_SIZE - 1);
        if (requestIdRef.current !== requestId) {
          return;
        }
        if (page.length === 0) break;
        allPages.push(...page);
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      const fullSnapshot = sortSitios(allPages);
      cachedSitiosRelevantes = fullSnapshot;
      setSitios(fullSnapshot);

      if (fullSnapshot.length > 0) {
        void replaceCachedSitiosRelevantes(fullSnapshot).catch((e) => {
          console.warn(
            "[useSitiosRelevantes] error al guardar cache SQLite:",
            e,
          );
        });
      }

      const latestUpdatedAt = await fetchLatestUpdatedAt();
      if (latestUpdatedAt) {
        void setSyncMetadata(SYNC_CURSOR_KEY, latestUpdatedAt);
      }
      void setSyncMetadata(FULL_SYNC_AT_KEY, new Date().toISOString());
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar sitios relevantes");
      setError(msg);
      finish(false);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [
    endSync,
    fetchAcceptedIds,
    fetchChangesSince,
    fetchLatestUpdatedAt,
    fetchPage,
    startSync,
  ]);

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
