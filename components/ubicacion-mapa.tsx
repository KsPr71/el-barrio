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

function buildMapsOpenUrl(localizacion: string): string {
  const coords = parseCoordenadas(localizacion);
  const q = coords
    ? `${coords.lat},${coords.lng}`
    : encodeURIComponent(localizacion.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function PlaceholderMapa({
  localizacion,
  openUrl,
  height,
}: {
  localizacion: string;
  openUrl: string;
  height: number;
}) {
  const colors = useColors();
  return (
    <View style={[styles.wrapper, { minHeight: height }]}>

      <TouchableOpacity
        onPress={() => Linking.openURL(openUrl)}
        activeOpacity={0.8}
        className="mt-3 rounded-xl py-3 items-center"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
          Ver ubicación en Google Maps
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function UbicacionMapa({ localizacion, height = 220 }: UbicacionMapaProps) {
  const openUrl = buildMapsOpenUrl(localizacion);
  return (
    <PlaceholderMapa
      localizacion={localizacion}
      openUrl={openUrl}
      height={height}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 12,
  },
  placeholder: {
    width: "100%",
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
});
