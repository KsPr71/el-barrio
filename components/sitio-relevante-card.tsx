import { EstrellasPuntuacion } from "@/components/estrellas-puntuacion";
import { TipoSitioChip } from "@/components/ui/tipo-sitio";
import { useColors } from "@/hooks/use-colors";
import { useOpiniones } from "@/hooks/use-opiniones";
import type { SitioRelevante } from "@/hooks/use-sitios-relevantes";
import { useTiposSitio } from "@/hooks/use-tipos-sitio";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";
import { Separador } from "./separador";
import { IconSymbol } from "./ui/icon-symbol";
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

export function SitioRelevanteCard({
  sitio,
  onPress,
}: SitioRelevanteCardProps) {
  const colors = useColors();
  const { tipos } = useTiposSitio();
  const imagenUrl = getFirstImageUrl(sitio.imagenes);
  const { stats } = useOpiniones(sitio.id);

  const tipoSitio =
    sitio.tipo_sitio_id != null
      ? tipos.find((t) => t.id === sitio.tipo_sitio_id)
      : null;

  const content = (
    <View
      className="rounded-2xl overflow-hidden border border-border"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      }}
    >
      <View style={{ position: "relative" }}>
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
        {tipoSitio && <TipoSitioChip tipo={tipoSitio} overlay />}
      </View>
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
          <Text className="text-sm text-muted mt-1 leading-5" numberOfLines={3}>
            {sitio.descripcion}
          </Text>
        ) : null}
        <Separador />
        {sitio.direccion ? (
          <View className="mt-2 gap-1 flex-row items-center">
            <View
              className="flex-row items-center gap-2"
              style={{
                backgroundColor: colors.primary + "20",
                padding: 2,
                borderRadius: 30,
              }}
            >
              <IconSymbol
                name="location.fill"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text
              className="text-xs text-muted ml-2"
              style={{
                paddingHorizontal: 4,
                fontStyle: "italic",
              }}
              numberOfLines={2}
            >
              {sitio.direccion}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="mb-4">
        {content}
      </TouchableOpacity>
    );
  }

  return <View className="mb-4">{content}</View>;
}
