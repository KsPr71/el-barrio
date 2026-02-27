import { useEffect, useMemo, useState } from "react";

import { isHorarioAbierto } from "@/lib/horario";

/**
 * Fuerza re-render periódico para reflejar cambios de "Abierto/Cerrado"
 * sin recargar sitios. Actualiza en el cambio de minuto (±1s).
 */
export function useHorarioLiveStatus(horario: string | null) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Alinear al próximo cambio de minuto para que el estado cambie "cuando toca".
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const schedule = () => {
      const now = new Date();
      const msUntilNextMinute =
        (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      timeout = setTimeout(() => {
        setTick((t) => t + 1);
        interval = setInterval(() => setTick((t) => t + 1), 60_000);
      }, Math.max(250, msUntilNextMinute));
    };

    schedule();
    return () => {
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  const abierto = useMemo(() => {
    // tick solo existe para disparar recomputación con el paso del tiempo
    void tick;
    return isHorarioAbierto(horario);
  }, [horario, tick]);

  return { abierto };
}

