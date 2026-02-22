import { useColors } from "@/hooks/use-colors";
import {
  formatFriendlyToHorario,
  type HorarioFriendly,
  parseHorarioToFriendly,
  isValidTime,
} from "@/lib/horario";
import { useEffect, useCallback, useState } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

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

/** Convierte "HH:mm" a Date (hoy a esa hora) */
function timeStringToDate(s: string): Date {
  const d = new Date();
  if (isValidTime(s)) {
    const [h, m] = s.split(":").map(Number);
    d.setHours(h, m, 0, 0);
  }
  return d;
}

/** Convierte Date a "HH:mm" */
function dateToTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const isNative = Platform.OS === "ios" || Platform.OS === "android";

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
  const [activePicker, setActivePicker] = useState<"from" | "to" | null>(null);

  const toggleCerrado = () => {
    if (slot.cerrado) {
      onChange({ cerrado: false, from: "09:00", to: "18:00" });
    } else {
      onChange({ cerrado: true, from: "", to: "" });
    }
  };

  const handleTimeChange = (field: "from" | "to") => (event: { type: string }, date?: Date) => {
    setActivePicker(null);
    if (Platform.OS === "android" && event.type !== "set") return;
    if (date) {
      const timeStr = dateToTimeString(date);
      onChange(field === "from" ? { ...slot, from: timeStr } : { ...slot, to: timeStr });
    }
  };

  const inputStyle = (isValid: boolean) => [
    styles.timeInput,
    {
      backgroundColor: colors.surface,
      color: colors.foreground,
      borderColor: isValid ? colors.border : "#ef4444",
    },
  ];

  const timeField = (field: "from" | "to", placeholder: string, value: string) => {
    if (isNative) {
      return (
        <TouchableOpacity
          onPress={() => setActivePicker(field)}
          style={inputStyle(isValidTime(value))}
        >
          <Text style={{ color: value ? colors.foreground : colors.muted }}>
            {value || placeholder}
          </Text>
        </TouchableOpacity>
      );
    }
    return (
      <TextInput
        value={value}
        onChangeText={(v) =>
          onChange({
            ...slot,
            [field]: sanitizeTimeInput(v),
          })
        }
        onBlur={() => {
          const formatted = formatTimeOnBlur(value);
          if (formatted && formatted !== value) {
            onChange({ ...slot, [field]: formatted });
          }
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={inputStyle(isValidTime(value))}
        maxLength={5}
        keyboardType="numbers-and-punctuation"
        editable
      />
    );
  };

  const pickerValue =
    activePicker === "from"
      ? timeStringToDate(slot.from || "09:00")
      : timeStringToDate(slot.to || "18:00");

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
          {timeField("from", "09:00", slot.from)}
          <Text style={[styles.sep, { color: colors.muted }]}>a</Text>
          {timeField("to", "18:00", slot.to)}
          {isNative && activePicker !== null && (
            <DateTimePicker
              value={pickerValue}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange(activePicker)}
            />
          )}
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
