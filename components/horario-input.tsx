import { useColors } from "@/hooks/use-colors";
import {
  formatFriendlyToHorario,
  type HorarioFriendly,
  parseHorarioToFriendly,
  isValidTime,
} from "@/lib/horario";
import { useEffect, useCallback, useState } from "react";
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from "react-native";

export interface HorarioInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Solo permite dígitos y un ':', máximo 5 caracteres */
function sanitizeTimeInput(s: string): string {
  const cleaned = s.replace(/[^\d:]/g, "").slice(0, 5);
  const parts = cleaned.split(":");
  if (parts.length > 2) return `${parts[0]}:${parts.slice(1).join("")}`;
  return cleaned;
}

/** Formatea texto parcial a HH:MM al perder foco */
function formatTimeOnBlur(s: string): string {
  const t = s.trim();
  if (!t) return "";
  const m = t.match(/^(\d{1,2}):?(\d{0,2})$/);
  if (!m) return t;
  const h = Math.min(23, parseInt(m[1], 10) || 0);
  const min = Math.min(59, parseInt((m[2] || "0").slice(0, 2), 10) || 0);
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function DiaRow({
  label,
  slot,
  onChange,
  colors,
}: {
  label: string;
  slot: HorarioFriendly["weekdays"];
  onChange: (s: HorarioFriendly["weekdays"]) => void;
  colors: { muted: string; foreground: string; surface: string; border: string; primary: string };
}) {
  const toggleCerrado = () => {
    if (slot.cerrado) {
      onChange({ cerrado: false, from: "09:00", to: "18:00" });
    } else {
      onChange({ cerrado: true, from: "", to: "" });
    }
  };

  return (
    <View style={styles.row}>
      <View style={[styles.labelWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.labelText, { color: colors.foreground }]}>{label}</Text>
        <TouchableOpacity
          onPress={toggleCerrado}
          style={[
            styles.cerradoBtn,
            {
              backgroundColor: slot.cerrado ? colors.primary + "30" : colors.border + "40",
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.cerradoText,
              { color: slot.cerrado ? colors.primary : colors.muted },
            ]}
          >
            {slot.cerrado ? "Cerrado" : "Abierto"}
          </Text>
        </TouchableOpacity>
      </View>
      {!slot.cerrado && (
        <View style={styles.timeRow}>
          <TextInput
            value={slot.from}
            onChangeText={(v) =>
              onChange({
                ...slot,
                from: sanitizeTimeInput(v),
              })
            }
            onBlur={() => {
              const formatted = formatTimeOnBlur(slot.from);
              if (formatted && formatted !== slot.from) {
                onChange({ ...slot, from: formatted });
              }
            }}
            placeholder="09:00"
            placeholderTextColor={colors.muted}
            style={[
              styles.timeInput,
              {
                backgroundColor: colors.surface,
                color: colors.foreground,
                borderColor: isValidTime(slot.from) ? colors.border : "#ef4444",
              },
            ]}
            maxLength={5}
            keyboardType="numbers-and-punctuation"
            editable
          />
          <Text style={[styles.sep, { color: colors.muted }]}>a</Text>
          <TextInput
            value={slot.to}
            onChangeText={(v) =>
              onChange({
                ...slot,
                to: sanitizeTimeInput(v),
              })
            }
            onBlur={() => {
              const formatted = formatTimeOnBlur(slot.to);
              if (formatted && formatted !== slot.to) {
                onChange({ ...slot, to: formatted });
              }
            }}
            placeholder="18:00"
            placeholderTextColor={colors.muted}
            style={[
              styles.timeInput,
              {
                backgroundColor: colors.surface,
                color: colors.foreground,
                borderColor: isValidTime(slot.to) ? colors.border : "#ef4444",
              },
            ]}
            maxLength={5}
            keyboardType="numbers-and-punctuation"
            editable
          />
        </View>
      )}
    </View>
  );
}

export function HorarioInput({ value, onChange, placeholder }: HorarioInputProps) {
  const colors = useColors();

  const [friendly, setFriendlyState] = useFriendlyState(value, onChange);

  const setWeekdays = useCallback(
    (s: HorarioFriendly["weekdays"]) => {
      setFriendlyState({ ...friendly, weekdays: s });
    },
    [friendly, setFriendlyState],
  );
  const setSaturday = useCallback(
    (s: HorarioFriendly["saturday"]) => {
      setFriendlyState({ ...friendly, saturday: s });
    },
    [friendly, setFriendlyState],
  );
  const setSunday = useCallback(
    (s: HorarioFriendly["sunday"]) => {
      setFriendlyState({ ...friendly, sunday: s });
    },
    [friendly, setFriendlyState],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface + "60", borderColor: colors.border }]}>
      <DiaRow label="Lunes a Viernes" slot={friendly.weekdays} onChange={setWeekdays} colors={colors} />
      <DiaRow label="Sábado" slot={friendly.saturday} onChange={setSaturday} colors={colors} />
      <DiaRow label="Domingo" slot={friendly.sunday} onChange={setSunday} colors={colors} />
    </View>
  );
}

function canEmitComplete(f: HorarioFriendly): boolean {
  if (!f.weekdays.cerrado && (!isValidTime(f.weekdays.from) || !isValidTime(f.weekdays.to)))
    return false;
  if (!f.saturday.cerrado && (!isValidTime(f.saturday.from) || !isValidTime(f.saturday.to)))
    return false;
  if (!f.sunday.cerrado && (!isValidTime(f.sunday.from) || !isValidTime(f.sunday.to)))
    return false;
  return true;
}

function useFriendlyState(value: string, onChange: (v: string) => void) {
  const parsed = parseHorarioToFriendly(value || null);
  const [friendly, setFriendly] = useState<HorarioFriendly>(parsed);

  useEffect(() => {
    const next = parseHorarioToFriendly(value || null);
    setFriendly(next);
  }, [value]);

  const setFriendlyState = useCallback(
    (next: HorarioFriendly) => {
      setFriendly(next);
      // Solo propagar cuando todos los segmentos abiertos tienen horarios válidos
      // (evita reset al escribir valores parciales como "09:3")
      if (canEmitComplete(next)) {
        onChange(formatFriendlyToHorario(next));
      }
    },
    [onChange],
  );

  return [friendly, setFriendlyState] as const;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  row: {
    gap: 8,
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  labelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  cerradoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  cerradoText: {
    fontSize: 13,
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  sep: {
    fontSize: 14,
    fontWeight: "500",
  },
});
