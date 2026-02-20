import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useCallback, useEffect, useState } from "react";

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
  acepto_terminos?: boolean;
};

export type UpdateSitioRelevante = InsertSitioRelevante & {
  estado_suscripcion?: "creado" | "en_revision" | "aceptado";
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

export function useSitiosAdmin() {
  const { user, isAdmin } = useSupabaseAuth();
  const [sitios, setSitios] = useState<SitioRelevanteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSitios = useCallback(async () => {
    if (!user) {
      setSitios([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await supabase.rpc("expirar_suscripciones").then(({ error }) => {
        if (error) console.warn("[useSitiosAdmin] expirar_suscripciones:", error.message);
      });
      let query = supabase
        .from("sitios_relevantes")
        .select(
          "id, nombre, localizacion, descripcion, imagenes, ofertas, menus, tipo_sitio_id, direccion, telefono, contador_opiniones, provincia_id, municipio_id, creado_por, creado_at, estado_suscripcion, fecha_cambio_estado, fecha_aceptado",
        )
        .order("creado_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("creado_por", user.id);
      }
      const { data, error: err } = await query;
      if (err) throw err;
      setSitios((data ?? []) as SitioRelevanteAdmin[]);
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar sitios");
      setError(msg);
      setSitios([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchSitios();
  }, [fetchSitios]);

  const crearSitio = useCallback(
    async (input: InsertSitioRelevante) => {
      if (!user) throw new Error("Debes iniciar sesión para crear un sitio");
      if (!input.acepto_terminos) throw new Error("Debes aceptar los términos y condiciones");
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
          creado_por: user.id,
          estado_suscripcion: "creado",
          acepto_terminos: input.acepto_terminos ?? false,
        })
        .select("id")
        .single();
      if (err) throw err;
      await fetchSitios();
      return data?.id as number;
    },
    [user, fetchSitios],
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

  return { sitios, loading, error, refresh: fetchSitios, crearSitio, cambiarEstado, actualizarSitio };
}
