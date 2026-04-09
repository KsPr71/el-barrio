import { EstrellasPuntuacion } from "@/components/estrellas-puntuacion";
import { TipoSitioChip } from "@/components/ui/tipo-sitio";
import { useOpinionStats } from "@/contexts/opinion-stats-context";
import { useColors } from "@/hooks/use-colors";
import type { SitioRelevante } from "@/hooks/use-sitios-relevantes";
import type { TipoSitio } from "@/hooks/use-tipos-sitio";
import { isHorarioAbierto } from "@/lib/horario";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Separador } from "./separador";
import { IconSymbol } from "./ui/icon-symbol";

export interface SitioRelevanteCardProps {
  sitio: SitioRelevante;
  onPress?: () => void;
  tipo?: TipoSitio | null;
  /** Palabras encontradas en ofertas (ej. búsqueda "Aquí hay") */
  matchedWords?: string[];
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
  tipo = null,
  matchedWords,
}: SitioRelevanteCardProps) {
  const CARD_RADIUS = 18;
  const EDGE_RADIUS = CARD_RADIUS - 1;
  const IMAGE_HEIGHT = 200;
  const TEXT_PANEL_OVERLAP = Math.round(IMAGE_HEIGHT * 0.1);
  const TEXT_PANEL_TOP_RADIUS = 30;
  const ADDRESS_NOTCH_SIZE = 28;
  const PANEL_BACKGROUND = "#F2F0EF";
  const colors = useColors();
  const imagenUrl = getFirstImageUrl(sitio.imagenes);
  const { lastUpdate } = useOpinionStats();
  const displayStats =
    lastUpdate?.sitioId === sitio.id
      ? { promedio: lastUpdate.promedio, total: lastUpdate.total }
      : {
          promedio: sitio.promedio_puntuacion,
          total: sitio.contador_opiniones,
        };
  const [abierto, setAbierto] = useState<boolean | null>(() =>
    isHorarioAbierto(sitio.horario),
  );

  // Recalcular estado abierto/cerrado periódicamente mientras la card esté montada.
  useEffect(() => {
    let cancelled = false;

    const update = () => {
      if (cancelled) return;
      setAbierto(isHorarioAbierto(sitio.horario));
    };

    update();
    const id = setInterval(update, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sitio.horario]);

  const tipoSitio = tipo;

  const content = (
    <View
      className="rounded-2xl"
      style={{
        borderRadius: CARD_RADIUS,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      }}
    >
      <View
        className="overflow-hidden border border-border"
        style={{
          borderRadius: CARD_RADIUS,
          backgroundColor: PANEL_BACKGROUND,
          borderColor: colors.primary,
          borderWidth: 1,
        }}
      >
        <View style={{ position: "relative" }}>
          {imagenUrl ? (
            <Image
              source={{ uri: imagenUrl }}
              style={{
                width: "100%",
                height: IMAGE_HEIGHT,
                backgroundColor: colors.border,
                borderTopLeftRadius: EDGE_RADIUS,
                borderTopRightRadius: EDGE_RADIUS,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
              contentFit="cover"
            />
          ) : (
            <View
              className="w-full items-center justify-center"
              style={{
                height: 120,
                backgroundColor: colors.border,
                borderTopLeftRadius: EDGE_RADIUS,
                borderTopRightRadius: EDGE_RADIUS,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <Text className="text-4xl">📍</Text>
            </View>
          )}
          {tipoSitio && <TipoSitioChip tipo={tipoSitio} overlay />}
          {(abierto === true || abierto === false) && (
            <View
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: abierto === true ? "#16A34A" : "#DC2626",
                borderWidth: 1,
                borderColor: abierto === true ? "#15803D" : "#B91C1C",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                maxWidth: "72%",
              }}
            >
              <IconSymbol
                name={abierto === true ? "checkmark.circle.fill" : "clock.fill"}
                size={12}
                color="#FFFFFF"
              />
              <Text
                className="text-[10px] font-semibold"
                style={{ color: "#FFFFFF" }}
              >
                {abierto === true ? "Abierto" : "Cerrado"}
              </Text>
            </View>
          )}
        </View>
        <View
          style={{
            marginTop: -TEXT_PANEL_OVERLAP,
            backgroundColor: colors.primary,
            borderTopLeftRadius: TEXT_PANEL_TOP_RADIUS,
            borderTopRightRadius: TEXT_PANEL_TOP_RADIUS,
            borderBottomLeftRadius: EDGE_RADIUS,
            borderBottomRightRadius: EDGE_RADIUS,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View
            style={{
              paddingTop: 2,
              marginBottom: 12,
            }}
          >
            <View className="flex-row items-start justify-between gap-2">
              <Text
                className="text-xl font-bold flex-1"
                style={{ color: "#FFFFFF" }}
                numberOfLines={2}
              >
                {sitio.nombre}
              </Text>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.16)",
                  maxWidth: "72%",
                }}
              >
                <EstrellasPuntuacion
                  promedio={displayStats.promedio}
                  total={displayStats.total}
                  size={12}
                  showNumber
                  showTotal={displayStats.total > 0}
                  numberColor="#FFFFFF"
                  totalColor="rgba(255,255,255,0.8)"
                  emptyStarColor="rgba(255,255,255,0.42)"
                />
              </View>
            </View>
          </View>

          <View
            style={{
              backgroundColor: PANEL_BACKGROUND,
              marginHorizontal: -16,
              marginBottom: -16,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              borderBottomLeftRadius: EDGE_RADIUS,
              borderBottomRightRadius: EDGE_RADIUS,
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            {sitio.descripcion ? (
              <Text
                className="text-sm leading-5"
                style={{ color: colors.foreground + "B3" }}
                numberOfLines={3}
              >
                {sitio.descripcion}
              </Text>
            ) : null}
            <View className="mt-0">
              <Separador />
            </View>
            {matchedWords && matchedWords.length > 0 ? (
              <View className="mt-2 flex-row flex-wrap items-center gap-1">
                <Text
                  className="text-xs"
                  style={{ color: colors.muted, fontWeight: "500" }}
                >
                  En ofertas:
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: colors.primary, fontWeight: "600" }}
                >
                  {matchedWords.join(", ")}
                </Text>
              </View>
            ) : null}
            {sitio.direccion ? (
              <View
                className="flex-row items-center justify-between"
                style={{
                  marginTop: 8,
                  backgroundColor: "transparent",
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderBottomLeftRadius: EDGE_RADIUS - 2,
                  borderBottomRightRadius: EDGE_RADIUS - 2,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  position: "relative",
                  overflow: "visible",
                }}
              >
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: -ADDRESS_NOTCH_SIZE / 2,
                    left: -1,
                    width: ADDRESS_NOTCH_SIZE,
                    height: ADDRESS_NOTCH_SIZE,
                    borderRadius: ADDRESS_NOTCH_SIZE / 2,
                    backgroundColor: PANEL_BACKGROUND,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: -ADDRESS_NOTCH_SIZE / 2,
                    right: -1,
                    width: ADDRESS_NOTCH_SIZE,
                    height: ADDRESS_NOTCH_SIZE,
                    borderRadius: ADDRESS_NOTCH_SIZE / 2,
                    backgroundColor: PANEL_BACKGROUND,
                  }}
                />
                <View className="flex-row items-center gap-1 flex-1">
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
                      marginRight: 10,
                    }}
                    numberOfLines={2}
                  >
                    {sitio.direccion}
                  </Text>
                </View>
                {sitio.provincia_short_name ? (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: colors.primary + "22",
                      marginLeft: 12,
                      minWidth: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.primary + "60",
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: colors.primary }}
                    >
                      {sitio.provincia_short_name}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
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
