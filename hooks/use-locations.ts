import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

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
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loadingProvincias, setLoadingProvincias] = useState(true);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProvincias = useCallback(async () => {
    setLoadingProvincias(true);
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
      setProvincias((data ?? []) as Provincia[]);
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar provincias");
      setError(msg);
      setProvincias([]);
    } finally {
      setLoadingProvincias(false);
    }
  }, []);

  const fetchMunicipios = useCallback(async (provinciaId: string | null) => {
    if (!provinciaId) {
      setMunicipios([]);
      setLoadingMunicipios(false);
      return;
    }
    setLoadingMunicipios(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("municipio")
        .select("id, nombre, provincia_id")
        .eq("provincia_id", provinciaId)
        .order("nombre");
      if (err) {
        console.error("[useLocations] municipio error:", err);
        throw err;
      }
      setMunicipios((data ?? []) as Municipio[]);
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar municipios");
      setError(msg);
      setMunicipios([]);
    } finally {
      setLoadingMunicipios(false);
    }
  }, []);

  useEffect(() => {
    fetchProvincias();
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
