import { supabase } from "@/lib/supabase";
import {
  getCachedSitiosAdmin,
  getSyncMetadata,
  replaceCachedSitiosAdmin,
  setSyncMetadata,
} from "@/lib/offline-sitios-db";
import { useCallback, useEffect, useRef, useState } from "react";

export type SitioRelevanteAdmin = {
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
  creado_por: string | null;
  creado_at: string;
  estado_suscripcion: "creado" | "en_revision" | "aceptado";
  fecha_cambio_estado: string | null;
  fecha_aceptado: string | null;
  horario: string | null;
  facebook_link: string | null;
  instagram_link: string | null;
  sitio_web: string | null;
};

export type InsertSitioRelevante = {
  nombre: string;
  localizacion?: string | null;
  descripcion?: string | null;
  imagenes?: string | null;
  ofertas?: string | null;
  menus?: unknown | null;
  tipo_sitio_id?: number | null;
  direccion?: string | null;
  telefono?: number | null;
  provincia_id?: string | null;
  municipio_id?: string | null;
  horario?: string | null;
  facebook_link?: string | null;
  instagram_link?: string | null;
  sitio_web?: string | null;
  acepto_terminos?: boolean;
};

export type UpdateSitioRelevante = InsertSitioRelevante & {
  estado_suscripcion?: "creado" | "en_revision" | "aceptado";
};

type UseSitiosAdminOptions = {
  userId?: string | null;
  isAdmin?: boolean;
};

const adminCacheByScope = new Map<string, SitioRelevanteAdmin[]>();
const FULL_SYNC_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SITIOS_ADMIN_SELECT = [
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
  "creado_por",
  "creado_at",
  "estado_suscripcion",
  "fecha_cambio_estado",
  "fecha_aceptado",
  "horario",
  "facebook_link",
  "instagram_link",
  "sitio_web",
].join(", ");
const SITIOS_ADMIN_SELECT_WITH_UPDATED_AT = `${SITIOS_ADMIN_SELECT}, updated_at`;

type SitioAdminRowWithUpdatedAt = SitioRelevanteAdmin & {
  updated_at: string;
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

function sortSitiosAdmin(list: SitioRelevanteAdmin[]): SitioRelevanteAdmin[] {
  const next = [...list];
  next.sort((a, b) => {
    const createdDiff =
      new Date(b.creado_at).getTime() - new Date(a.creado_at).getTime();
    if (createdDiff !== 0) return createdDiff;
    return b.id - a.id;
  });
  return next;
}

function mergeSitiosAdminById(
  base: SitioRelevanteAdmin[],
  incoming: SitioRelevanteAdmin[],
): SitioRelevanteAdmin[] {
  const map = new Map<number, SitioRelevanteAdmin>();
  for (const sitio of base) map.set(sitio.id, sitio);
  for (const sitio of incoming) map.set(sitio.id, sitio);
  return Array.from(map.values());
}

function shouldDoFullSync(lastFullSyncAt: string | null, hasLocalData: boolean) {
  if (!hasLocalData || !lastFullSyncAt) return true;
  const parsed = Date.parse(lastFullSyncAt);
  if (Number.isNaN(parsed)) return true;
  return Date.now() - parsed >= FULL_SYNC_MAX_AGE_MS;
}

export function useSitiosAdmin(options?: UseSitiosAdminOptions) {
  const userId = options?.userId ?? null;
  const isAdmin = options?.isAdmin ?? false;
  const [sitios, setSitios] = useState<SitioRelevanteAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const scopeKey = userId ? `${isAdmin ? "admin" : "user"}:${userId}` : null;
  const syncCursorKey = scopeKey ? `sitios_admin:${scopeKey}:last_sync_at` : null;
  const fullSyncAtKey = scopeKey
    ? `sitios_admin:${scopeKey}:last_full_sync_at`
    : null;

  function withTimeout<T>(
    promise: PromiseLike<T>,
    ms: number,
    label: string,
  ): Promise<T> {
    let t: ReturnType<typeof setTimeout> | null = null;
    const timeout = new Promise<never>((_, reject) => {
      t = setTimeout(() => reject(new Error(`Timeout (${label})`)), ms);
    });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
      if (t) clearTimeout(t);
    }) as Promise<T>;
  }

  const buildBaseQuery = useCallback(
    (selectClause: string, includeCreatedOrder = false) => {
      let query = supabase.from("sitios_relevantes").select(selectClause);

      if (!isAdmin && userId) {
        query = query.eq("creado_por", userId);
      }

      if (includeCreatedOrder) {
        query = query.order("creado_at", { ascending: false });
      }

      return query;
    },
    [isAdmin, userId],
  );

  const fetchLatestUpdatedAt = useCallback(async (): Promise<string | null> => {
    const query = buildBaseQuery("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error: err } = await withTimeout(
      query,
      12000,
      "cargar updated_at admin",
    );
    if (err) {
      console.warn(
        "[useSitiosAdmin] no se pudo obtener updated_at para sync incremental:",
        err.message,
      );
      return null;
    }
    const row = (data as unknown as { updated_at?: string } | null) ?? null;
    return row?.updated_at ?? null;
  }, [buildBaseQuery]);

  const fetchVisibleIds = useCallback(async (): Promise<Set<number>> => {
    const query = buildBaseQuery("id");
    const { data, error: err } = await withTimeout(
      query,
      12000,
      "cargar ids admin",
    );
    if (err) throw err;
    const rows = ((data ?? []) as unknown) as Array<{ id: number }>;
    return new Set(rows.map((row) => row.id));
  }, [buildBaseQuery]);

  const fetchChangesSince = useCallback(
    async (cursor: string) => {
      const query = buildBaseQuery(SITIOS_ADMIN_SELECT_WITH_UPDATED_AT)
        .gte("updated_at", cursor)
        .order("updated_at", { ascending: true });
      const { data, error: err } = await withTimeout(
        query,
        12000,
        "cargar cambios admin",
      );
      if (err) throw err;

      const rows = ((data ?? []) as unknown) as SitioAdminRowWithUpdatedAt[];
      const sitios = rows.map(({ updated_at: _updatedAt, ...sitio }) => sitio);
      const latestUpdatedAt =
        rows.length > 0 ? rows[rows.length - 1]?.updated_at ?? cursor : cursor;

      return {
        sitios: sitios as SitioRelevanteAdmin[],
        latestUpdatedAt,
      };
    },
    [buildBaseQuery],
  );

  const fetchFullSnapshot = useCallback(async () => {
    const query = buildBaseQuery(SITIOS_ADMIN_SELECT, true);
    const { data, error: err } = await withTimeout(
      query,
      12000,
      "cargar sitios",
    );
    if (err) throw err;
    return sortSitiosAdmin(((data ?? []) as unknown) as SitioRelevanteAdmin[]);
  }, [buildBaseQuery]);

  const fetchSitios = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!userId) {
      setError(null);
      setSitios([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const currentScopeKey = `${isAdmin ? "admin" : "user"}:${userId}`;
    const hasVisibleData =
      (adminCacheByScope.get(currentScopeKey)?.length ?? 0) > 0;

    setRefreshing(true);
    if (!hasVisibleData) {
      setLoading(true);
    }
    setError(null);

    try {
      void supabase.rpc("expirar_suscripciones").then(({ error }) => {
        if (error) console.warn("[useSitiosAdmin] expirar_suscripciones:", error.message);
      });

      const [lastSyncAt, lastFullSyncAt] = await Promise.all([
        syncCursorKey ? getSyncMetadata(syncCursorKey) : Promise.resolve(null),
        fullSyncAtKey ? getSyncMetadata(fullSyncAtKey) : Promise.resolve(null),
      ]);

      const mustRunFullSync = shouldDoFullSync(lastFullSyncAt, hasVisibleData);

      if (hasVisibleData && lastSyncAt && !mustRunFullSync) {
        try {
          const incremental = await fetchChangesSince(lastSyncAt);
          if (requestIdRef.current !== requestId) return;

          const visibleIds = await fetchVisibleIds();
          if (requestIdRef.current !== requestId) return;

          const nextSnapshot = sortSitiosAdmin(
            mergeSitiosAdminById(
              adminCacheByScope.get(currentScopeKey) ?? [],
              incremental.sitios,
            ).filter((sitio) => visibleIds.has(sitio.id)),
          );

          adminCacheByScope.set(currentScopeKey, nextSnapshot);
          setSitios(nextSnapshot);
          void replaceCachedSitiosAdmin(currentScopeKey, nextSnapshot);

          if (syncCursorKey && incremental.latestUpdatedAt) {
            void setSyncMetadata(syncCursorKey, incremental.latestUpdatedAt);
          }

          return;
        } catch (e) {
          console.warn(
            "[useSitiosAdmin] fallback a sync completa:",
            getErrorMessage(e, "sync incremental no disponible"),
          );
        }
      }

      const snapshot = await fetchFullSnapshot();
      if (requestIdRef.current !== requestId) return;

      adminCacheByScope.set(currentScopeKey, snapshot);
      setSitios(snapshot);
      void replaceCachedSitiosAdmin(currentScopeKey, snapshot);

      const latestUpdatedAt = await fetchLatestUpdatedAt();
      if (requestIdRef.current !== requestId) return;
      if (syncCursorKey && latestUpdatedAt) {
        void setSyncMetadata(syncCursorKey, latestUpdatedAt);
      }
      if (fullSyncAtKey) {
        void setSyncMetadata(fullSyncAtKey, new Date().toISOString());
      }
    } catch (e) {
      if (requestIdRef.current !== requestId) return;
      const msg = getErrorMessage(e, "Error al cargar sitios");
      setError(msg);
      if (!hasVisibleData) {
        setSitios([]);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [
    fetchChangesSince,
    fetchFullSnapshot,
    fetchLatestUpdatedAt,
    fetchVisibleIds,
    fullSyncAtKey,
    isAdmin,
    syncCursorKey,
    userId,
  ]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!scopeKey) {
        setSitios([]);
        setLoading(false);
        setError(null);
        return;
      }

      const memory = adminCacheByScope.get(scopeKey);
      if (memory && memory.length > 0) {
        setSitios(memory);
        setLoading(false);
      } else {
        setLoading(true);
        try {
          const local = await getCachedSitiosAdmin(scopeKey);
          if (!cancelled && local.length > 0) {
            adminCacheByScope.set(scopeKey, local);
            setSitios(local);
            setLoading(false);
          }
        } catch (e) {
          console.warn("[useSitiosAdmin] error al leer cache SQLite:", e);
        }
      }

      if (!cancelled) {
        void fetchSitios();
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [fetchSitios, scopeKey]);

  const crearSitio = useCallback(
    async (input: InsertSitioRelevante) => {
      if (!userId) throw new Error("Debes iniciar sesión para crear un sitio");
      if (!input.acepto_terminos) {
        throw new Error("Debes aceptar los términos y condiciones");
      }

      const { data, error: err } = await supabase
        .from("sitios_relevantes")
        .insert({
          nombre: input.nombre,
          localizacion: input.localizacion?.trim() || null,
          descripcion: input.descripcion ?? null,
          imagenes: input.imagenes ?? null,
          ofertas: input.ofertas ?? null,
          menus: input.menus ?? null,
          tipo_sitio_id: input.tipo_sitio_id ?? null,
          direccion: input.direccion ?? null,
          telefono: input.telefono ?? null,
          provincia_id: input.provincia_id ?? null,
          municipio_id: input.municipio_id ?? null,
          horario: input.horario ?? null,
          facebook_link: input.facebook_link?.trim() || null,
          instagram_link: input.instagram_link?.trim() || null,
          sitio_web: input.sitio_web?.trim() || null,
          creado_por: userId,
          estado_suscripcion: "creado",
          acepto_terminos: input.acepto_terminos ?? false,
        })
        .select("id")
        .single();

      if (err) throw err;
      await fetchSitios();
      return data?.id as number;
    },
    [userId, fetchSitios],
  );

  const cambiarEstado = useCallback(
    async (id: number, estado: "creado" | "en_revision" | "aceptado") => {
      if (!isAdmin) throw new Error("Solo el administrador puede cambiar el estado");

      const payload: Record<string, unknown> = {
        estado_suscripcion: estado,
        fecha_cambio_estado: new Date().toISOString(),
      };
      if (estado === "aceptado") {
        payload.fecha_aceptado = new Date().toISOString();
      }

      const { error: err } = await supabase
        .from("sitios_relevantes")
        .update(payload)
        .eq("id", id);
      if (err) throw err;
      await fetchSitios();
    },
    [isAdmin, fetchSitios],
  );

  const actualizarSitio = useCallback(
    async (
      id: number,
      input: Omit<UpdateSitioRelevante, "estado_suscripcion">,
      estado?: "creado" | "en_revision" | "aceptado",
    ) => {
      const payload: Record<string, unknown> = {
        nombre: input.nombre,
        localizacion: input.localizacion?.trim() || null,
        descripcion: input.descripcion ?? null,
        imagenes: input.imagenes ?? null,
        ofertas: input.ofertas ?? null,
        menus: input.menus ?? null,
        tipo_sitio_id: input.tipo_sitio_id ?? null,
        direccion: input.direccion ?? null,
        telefono: input.telefono ?? null,
        provincia_id: input.provincia_id ?? null,
        municipio_id: input.municipio_id ?? null,
        horario: input.horario ?? null,
        facebook_link: input.facebook_link?.trim() || null,
        instagram_link: input.instagram_link?.trim() || null,
        sitio_web: input.sitio_web?.trim() || null,
      };

      if (isAdmin && estado != null) {
        payload.estado_suscripcion = estado;
        payload.fecha_cambio_estado = new Date().toISOString();
        if (estado === "aceptado") {
          payload.fecha_aceptado = new Date().toISOString();
        }
      }

      const { error: err } = await supabase
        .from("sitios_relevantes")
        .update(payload)
        .eq("id", id);
      if (err) throw err;
      await fetchSitios();
    },
    [isAdmin, fetchSitios],
  );

  return {
    sitios,
    loading,
    refreshing,
    error,
    refresh: fetchSitios,
    crearSitio,
    cambiarEstado,
    actualizarSitio,
  };
}
