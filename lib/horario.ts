/**
 * Utilidades para parsear horarios y determinar si un sitio está Abierto o Cerrado.
 *
 * Formato soportado (ejemplos):
 * - "L-V 9:00-18:00; S 10:00-14:00; D cerrado"
 * - "Lunes-Viernes 9:00-18:00; Sábado 10:00-14:00; Domingo cerrado"
 * - "1-5 09:00-18:00; 6 10:00-14:00; 0 cerrado" (0=Dom, 1=Lu, ..., 6=Sa)
 *
 * Días: L/Lunes=1, M=2, X=3, J=4, V=5, S/Sábado=6, D/Domingo=0
 */

const DAY_MAP: Record<string, number> = {
  d: 0,
  domingo: 0,
  l: 1,
  lunes: 1,
  m: 2,
  martes: 2,
  x: 3,
  miercoles: 3,
  miércoles: 3,
  j: 4,
  jueves: 4,
  v: 5,
  viernes: 5,
  s: 6,
  sabado: 6,
  sábado: 6,
};

function parseTime(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function parseDayOrRange(s: string): number[] {
  const t = s.trim().toLowerCase().replace(/:$/, "");
  if (/^\d$/.test(t)) return [parseInt(t, 10)];
  if (/^\d-\d$/.test(t)) {
    const [a, b] = t.split("-").map((x) => parseInt(x.trim(), 10));
    if (a >= 0 && a <= 6 && b >= 0 && b <= 6) {
      const days: number[] = [];
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) days.push(i);
      return days;
    }
  }
  const single = DAY_MAP[t];
  if (single !== undefined) return [single];
  const rangeMatch = t.match(/^([a-záéíóúñ]+)-([a-záéíóúñ]+)$/);
  if (rangeMatch) {
    const start = DAY_MAP[rangeMatch[1]];
    const end = DAY_MAP[rangeMatch[2]];
    if (start !== undefined && end !== undefined) {
      const days: number[] = [];
      for (let i = Math.min(start, end); i <= Math.max(start, end); i++)
        days.push(i);
      return days;
    }
  }
  return [];
}

type Slot = { days: number[]; open: number; close: number } | { days: number[]; cerrado: true };

export function parseHorarioSlots(horario: string | null): Slot[] {
  if (!horario || !horario.trim()) return [];

  const slots: Slot[] = [];
  const parts = horario.split(/[;,]+/).map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const cerradoMatch = part.match(
      /^(.+?)\s+(cerrado|closed|cierre)$/i
    );
    if (cerradoMatch) {
      const days = parseDayOrRange(cerradoMatch[1]);
      if (days.length > 0) slots.push({ days, cerrado: true });
      continue;
    }

    const timeMatch = part.match(
      /^(.+?)\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/
    );
    if (timeMatch) {
      const days = parseDayOrRange(timeMatch[1]);
      const open = parseInt(timeMatch[2], 10) * 60 + parseInt(timeMatch[3], 10);
      const close =
        parseInt(timeMatch[4], 10) * 60 + parseInt(timeMatch[5], 10);
      if (days.length > 0 && open >= 0 && close >= 0)
        slots.push({ days, open, close });
    }
  }

  return slots;
}

/**
 * Determina si el sitio está abierto según el horario y la hora local actual.
 * @returns true = abierto, false = cerrado, null = no se puede determinar (sin horario o no coincide)
 */
export function isHorarioAbierto(horario: string | null): boolean | null {
  const slots = parseHorarioSlots(horario);
  if (slots.length === 0) return null;

  const now = new Date();
  const day = now.getDay(); // 0=Dom, 1=Lu, ..., 6=Sa
  const minutes = now.getHours() * 60 + now.getMinutes();

  for (const slot of slots) {
    if (!slot.days.includes(day)) continue;
    if ("cerrado" in slot && slot.cerrado) return false;
    if ("open" in slot && "close" in slot) {
      const { open, close } = slot;
      if (open <= close) return minutes >= open && minutes < close;
      return minutes >= open || minutes < close;
    }
  }

  return null;
}

/** Estructura amigable para editar horarios en el formulario */
export type HorarioFriendly = {
  weekdays: { cerrado: boolean; from: string; to: string };
  saturday: { cerrado: boolean; from: string; to: string };
  sunday: { cerrado: boolean; from: string; to: string };
};

const DEFAULT_SLOT = {
  cerrado: false,
  from: "09:00",
  to: "18:00",
};

/** Convierte el horario almacenado a estructura amigable para el formulario */
export function parseHorarioToFriendly(horario: string | null): HorarioFriendly {
  const result: HorarioFriendly = {
    weekdays: { ...DEFAULT_SLOT },
    saturday: { cerrado: false, from: "09:00", to: "14:00" },
    sunday: { cerrado: true, from: "", to: "" },
  };

  const slots = parseHorarioSlots(horario);
  if (slots.length === 0) return result;

  const formatMinutes = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  };

  for (const slot of slots) {
    const weekdays = slot.days.filter((d) => d >= 1 && d <= 5);
    const hasSat = slot.days.includes(6);
    const hasSun = slot.days.includes(0);

    if ("cerrado" in slot && slot.cerrado) {
      if (weekdays.length > 0)
        result.weekdays = { cerrado: true, from: "", to: "" };
      if (hasSat) result.saturday = { cerrado: true, from: "", to: "" };
      if (hasSun) result.sunday = { cerrado: true, from: "", to: "" };
    } else if ("open" in slot && "close" in slot) {
      const from = formatMinutes(slot.open);
      const to = formatMinutes(slot.close);
      if (weekdays.length > 0)
        result.weekdays = { cerrado: false, from, to };
      if (hasSat)
        result.saturday = { cerrado: false, from, to };
      if (hasSun)
        result.sunday = { cerrado: false, from, to };
    }
  }

  return result;
}

/** Convierte la estructura amigable al formato de almacenamiento. Solo incluye horarios válidos. */
export function formatFriendlyToHorario(friendly: HorarioFriendly): string {
  const parts: string[] = [];

  if (friendly.weekdays.cerrado) {
    parts.push("L-V cerrado");
  } else if (isValidTime(friendly.weekdays.from) && isValidTime(friendly.weekdays.to)) {
    parts.push(`L-V ${friendly.weekdays.from}-${friendly.weekdays.to}`);
  }

  if (friendly.saturday.cerrado) {
    parts.push("S cerrado");
  } else if (isValidTime(friendly.saturday.from) && isValidTime(friendly.saturday.to)) {
    parts.push(`S ${friendly.saturday.from}-${friendly.saturday.to}`);
  }

  if (friendly.sunday.cerrado) {
    parts.push("D cerrado");
  } else if (isValidTime(friendly.sunday.from) && isValidTime(friendly.sunday.to)) {
    parts.push(`D ${friendly.sunday.from}-${friendly.sunday.to}`);
  }

  return parts.join("; ");
}

/** Valida formato HH:MM */
export function isValidTime(s: string): boolean {
  return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(s.trim());
}

const DAY_NAMES: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

function daysToDisplayLabel(days: number[]): string {
  if (days.length === 0) return "";
  if (days.length === 1) return DAY_NAMES[days[0]] ?? "";
  const min = Math.min(...days);
  const max = Math.max(...days);
  if (min === 1 && max === 5) return "Lunes-Viernes";
  if (min === 0 && max === 6) return "Lunes-Domingo";
  return days.map((d) => DAY_NAMES[d]).filter(Boolean).join(", ");
}

/** Convierte el horario técnico a texto legible para mostrar, ej: "Lunes-Viernes 9:00 - 18:00" */
export function formatHorarioForDisplay(horario: string | null): string {
  const slots = parseHorarioSlots(horario);
  if (slots.length === 0) return "";

  const lines: string[] = [];
  for (const slot of slots) {
    const label = daysToDisplayLabel(slot.days);
    if (!label) continue;
    if ("cerrado" in slot && slot.cerrado) {
      lines.push(`${label}: cerrado`);
    } else if ("open" in slot && "close" in slot) {
      const h1 = Math.floor(slot.open / 60);
      const m1 = slot.open % 60;
      const h2 = Math.floor(slot.close / 60);
      const m2 = slot.close % 60;
      const from = `${String(h1).padStart(2, "0")}:${String(m1).padStart(2, "0")}`;
      const to = `${String(h2).padStart(2, "0")}:${String(m2).padStart(2, "0")}`;
      lines.push(`${label}: ${from} - ${to}`);
    }
  }
  return lines.join("\n");
}
