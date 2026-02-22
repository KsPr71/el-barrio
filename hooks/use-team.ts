import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export type TeamMember = {
  nombre: string;
  role: string;
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

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("team")
        .select("nombre, role");

      if (err) throw err;
      const raw = (data ?? []) as TeamMember[];
      const roleOrder = ["Desarrollador", "Diseño", "Beta testers", "Colaborador"];
      raw.sort((a, b) => {
        const ia = roleOrder.findIndex((r) =>
          a.role.toLowerCase().includes(r.toLowerCase())
        );
        const ib = roleOrder.findIndex((r) =>
          b.role.toLowerCase().includes(r.toLowerCase())
        );
        const diff = (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre);
      });
      setMembers(raw);
    } catch (e) {
      const msg = getErrorMessage(e, "Error al cargar el equipo");
      setError(msg);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return { members, loading, error, refresh: fetchTeam };
}
