import { useColors } from "@/hooks/use-colors";
import * as Linking from "expo-linking";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface UbicacionMapaProps {
  localizacion: string;
  height?: number;
}

/**
 * Intenta parsear coordenadas desde localizacion (ej: "40.4168, -3.7038" o "40.4168,-3.7038").
 */
export function parseCoordenadas(localizacion: string): { lat: number; lng: number } | null {
  const trimmed = localizacion.trim();
  const match = trimmed.match(/^(-?\d+[.,]?\d*)\s*[,;\s]\s*(-?\d+[.,]?\d*)$/);
  if (!match) return null;
  const lat = parseFloat(match[1].replace(",", "."));
  const lng = parseFloat(match[2].replace(",", "."));
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/** URL para abrir en Google Maps (solo enlace, no requiere API key). */
function buildGoogleMapsUrl(localizacion: string): string {
  const coords = parseCoordenadas(localizacion);
  const q = coords
    ? `${coords.lat},${coords.lng}`
    : encodeURIComponent(localizacion.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function UbicacionMapa({ localizacion, height = 220 }: UbicacionMapaProps) {
  const colors = useColors();
  const googleUrl = buildGoogleMapsUrl(localizacion);
  return (
    <View style={[styles.wrapper, { minHeight: height }]}>
      <TouchableOpacity
        onPress={() => Linking.openURL(googleUrl)}
        activeOpacity={0.8}
        className="mt-3 rounded-xl py-3 items-center"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
          Ver en Google Maps
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 12,
  },
});
