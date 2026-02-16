import { useColors } from "@/hooks/use-colors";
import type { SitioRelevante } from "@/hooks/use-sitios-relevantes";
import { EstrellasPuntuacion } from "@/components/estrellas-puntuacion";
import { useOpiniones } from "@/hooks/use-opiniones";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";

export interface SitioRelevanteCardProps {
  sitio: SitioRelevante;
  onPress?: () => void;
}

/** Obtiene la primera URL de imagen si imagenes es una URL o varias separadas por coma. */
function getFirstImageUrl(imagenes: string | null): string | null {
  if (!imagenes || !imagenes.trim()) return null;
  const first = imagenes.split(",")[0]?.trim();
  return first && (first.startsWith("http") || first.startsWith("//"))
    ? first
    : null;
}

export function SitioRelevanteCard({ sitio, onPress }: SitioRelevanteCardProps) {
  const colors = useColors();
  const imagenUrl = getFirstImageUrl(sitio.imagenes);
  const { stats } = useOpiniones(sitio.id);

  const content = (
    <View
        className="rounded-2xl overflow-hidden border border-border"
        style={{ backgroundColor: colors.surface }}
      >
        {imagenUrl ? (
          <Image
            source={{ uri: imagenUrl }}
            style={{
              width: "100%",
              height: 160,
              backgroundColor: colors.border,
            }}
            contentFit="cover"
          />
        ) : (
          <View
            className="w-full items-center justify-center"
            style={{
              height: 120,
              backgroundColor: colors.border,
            }}
          >
            <Text className="text-4xl">📍</Text>
          </View>
        )}
        <View className="p-4">
          <Text className="text-lg font-bold text-foreground" numberOfLines={2}>
            {sitio.nombre}
          </Text>

          {stats.total > 0 && (
            <View className="mt-2">
              <EstrellasPuntuacion
                promedio={stats.promedio}
                total={stats.total}
                size={14}
                showNumber
                showTotal
              />
            </View>
          )}

          {sitio.descripcion ? (
            <Text
              className="text-sm text-muted mt-1 leading-5"
              numberOfLines={3}
            >
              {sitio.descripcion}
            </Text>
          ) : null}
          {sitio.direccion ? (
            <Text className="text-xs text-muted mt-2" numberOfLines={2}>
              📍 {sitio.direccion}
            </Text>
          ) : null}
        </View>
      </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        className="mb-4"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View className="mb-4">{content}</View>;
}
