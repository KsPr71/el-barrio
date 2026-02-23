import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import {
  getCachedMunicipiosByProvinciaId,
  getCachedProvincias,
  replaceCachedMunicipiosForProvincia,
  replaceCachedProvincias,
} from "@/lib/offline-sitios-db";
import { useSyncStatus } from "@/contexts/sync-status-context";

export type Provincia = { id: string; nombre: string };
export type Municipio = { id: string; nombre: string; provincia_id: string };

function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return fallback;
}

export function useLocations() {
  const { startSync, endSync } = useSyncStatus();
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loadingProvincias, setLoadingProvincias] = useState(true);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProvincias = useCallback(async () => {
    const hadLocal = provincias.length > 0;
    if (!hadLocal) setLoadingProvincias(true);
    const syncKey = `prov_${Date.now()}`;
    startSync(syncKey);
    let ok = true;
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("provincia")
        .select("id, nombre")
        .order("nombre");
      if (err) {
        console.error("[useLocations] provincia error:", err);
        throw err;
      }
      const list = (data ?? []) as Provincia[];
      setProvincias(list);
      void replaceCachedProvincias(list).catch((e) => {
        console.warn("[useLocations] error al guardar provincia_cache:", e);
      });
    } catch (e) {
      ok = false;
      const msg = getErrorMessage(e, "Error al cargar provincias");
      setError(msg);
      if (!hadLocal) setProvincias([]);
    } finally {
      setLoadingProvincias(false);
      endSync(syncKey, ok);
    }
  }, [startSync, endSync]);

  const fetchMunicipios = useCallback(async (provinciaId: string | null) => {
    if (!provinciaId) {
      setMunicipios([]);
      setLoadingMunicipios(false);
      return;
    }
    const hadLocal = municipios.length > 0;
    if (!hadLocal) setLoadingMunicipios(true);
    const syncKey = `mun_${provinciaId}_${Date.now()}`;
    startSync(syncKey);
    let ok = true;
    setError(null);
    try {
      // 1) SQLite primero (si existe)
      try {
        const local = await getCachedMunicipiosByProvinciaId(provinciaId);
        if (local.length > 0) {
          setMunicipios(local);
          setLoadingMunicipios(false);
        }
      } catch (e) {
        console.warn("[useLocations] cache municipios SQLite:", e);
      }

      // 2) Supabase en segundo plano
      const { data, error: err } = await supabase
        .from("municipio")
        .select("id, nombre, provincia_id")
        .eq("provincia_id", provinciaId)
        .order("nombre");
      if (err) {
        console.error("[useLocations] municipio error:", err);
        throw err;
      }
      const list = (data ?? []) as Municipio[];
      setMunicipios(list);
      void replaceCachedMunicipiosForProvincia(provinciaId, list).catch((e) => {
        console.warn("[useLocations] error al guardar municipio_cache:", e);
      });
    } catch (e) {
      ok = false;
      const msg = getErrorMessage(e, "Error al cargar municipios");
      setError(msg);
      if (!hadLocal) setMunicipios([]);
    } finally {
      setLoadingMunicipios(false);
      endSync(syncKey, ok);
    }
  }, [startSync, endSync]);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      // 1) Provincias desde SQLite (instantáneo/offline)
      try {
        const local = await getCachedProvincias();
        if (!cancelled && local.length > 0) {
          setProvincias(local);
          setLoadingProvincias(false);
        }
      } catch (e) {
        console.warn("[useLocations] cache provincias SQLite:", e);
      } finally {
        // 2) Supabase en segundo plano
        if (!cancelled) void fetchProvincias();
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [fetchProvincias]);

  return {
    provincias,
    municipios,
    loadingProvincias,
    loadingMunicipios,
    error,
    fetchProvincias,
    fetchMunicipios,
  };
}
