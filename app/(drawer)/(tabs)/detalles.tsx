import { EstrellasPuntuacion } from "@/components/estrellas-puntuacion";
import { FormularioOpinion } from "@/components/formulario-opinion";
import { ImageCarousel } from "@/components/image-carousel";
import Maps from "@/components/maps";
import { ScreenContainer } from "@/components/screen-container";
import { Separador } from "@/components/separador";
import { buildGoogleMapsUrl } from "@/components/ubicacion-mapa";
import { Collapsible } from "@/components/ui/collapsible";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TipoSitioChip } from "@/components/ui/tipo-sitio";
import { useColors } from "@/hooks/use-colors";
import { useOpiniones } from "@/hooks/use-opiniones";
import type { SitioRelevante } from "@/hooks/use-sitios-relevantes";
import { useTiposSitio } from "@/hooks/use-tipos-sitio";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getFirstImageUrl(imagenes: string | null): string | null {
  if (!imagenes || !imagenes.trim()) return null;
  const first = imagenes.split(",")[0]?.trim();
  return first && (first.startsWith("http") || first.startsWith("//"))
    ? first
    : null;
}

export default function DetallesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [sitio, setSitio] = useState<SitioRelevante | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usamos el ID de la ruta para cargar opiniones, independientemente de si ya cargamos el sitio
  const sitioId =
    id && !Number.isNaN(parseInt(id, 10)) ? parseInt(id, 10) : null;
  const {
    opiniones,
    stats,
    crearOpinion,
    refresh: refreshOpiniones,
  } = useOpiniones(sitioId);
  const { tipos } = useTiposSitio();
  const [mapReloadKey, setMapReloadKey] = useState(0);

  const IMAGE_HEIGHT_FULL = 320;
  const IMAGE_HEIGHT_COLLAPSED = 220;
  const SCROLL_RANGE = IMAGE_HEIGHT_FULL - IMAGE_HEIGHT_COLLAPSED;

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const imageContainerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollOffset.value,
      [0, SCROLL_RANGE],
      [IMAGE_HEIGHT_FULL, IMAGE_HEIGHT_COLLAPSED],
      Extrapolation.CLAMP,
    ),
  }));

  const fetchSitio = useCallback(async (sitioId: string) => {
    setLoading(true);
    setError(null);
    try {
      const numId = parseInt(sitioId, 10);
      if (Number.isNaN(numId)) throw new Error("ID inválido");
      const { data, error: err } = await supabase
        .from("sitios_relevantes")
        .select(
          "id, nombre, localizacion, descripcion, imagenes, ofertas, menus, tipo_sitio_id, direccion, telefono, contador_opiniones, provincia_id, municipio_id",
        )
        .eq("id", numId)
        .single();
      if (err) throw err;
      setSitio(data as SitioRelevante);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el sitio");
      setSitio(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchSitio(id);
    } else {
      setSitio(null);
      setLoading(false);
      setError(null);
    }
  }, [id, fetchSitio]);

  if (!id) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center py-16">
          <Text className="text-lg text-muted text-center">
            Toca una card en Inicio para ver los detalles del sitio.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-muted">Cargando...</Text>
      </ScreenContainer>
    );
  }

  if (error || !sitio) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center py-16">
          <Text className="text-center text-foreground">
            {error ?? "Sitio no encontrado"}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const imagenUrl = getFirstImageUrl(sitio.imagenes);
  const tipoSitio =
    sitio.tipo_sitio_id != null
      ? tipos.find((t) => t.id === sitio.tipo_sitio_id)
      : null;

  return (
    <ScreenContainer className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Animated.ScrollView
          ref={scrollRef}
          stickyHeaderIndices={[1]}
          contentContainerStyle={{
            paddingBottom: Math.max(24, insets.bottom + 16),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          <Animated.View
            style={[
              {
                width: "100%",
                overflow: "hidden",
                backgroundColor: colors.border,
              },
              imageContainerStyle,
            ]}
          >
            {imagenUrl ? (
              <Image
                source={{ uri: imagenUrl }}
                style={{
                  width: "100%",
                  height: IMAGE_HEIGHT_FULL,
                  backgroundColor: colors.border,
                }}
                contentFit="cover"
              />
            ) : (
              <View
                className="w-full items-center justify-center"
                style={{
                  width: "100%",
                  height: IMAGE_HEIGHT_FULL,
                  backgroundColor: colors.border,
                }}
              >
                <Text className="text-5xl">📍</Text>
              </View>
            )}
          </Animated.View>

          <View
            className="px-5 py-4"
            style={{ backgroundColor: colors.background }}
          >
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 shrink gap-2">
                <Text className="text-2xl font-bold text-foreground">
                  {sitio.nombre}
                </Text>
                {tipoSitio && <TipoSitioChip tipo={tipoSitio} />}
              </View>
              {stats.total > 0 && (
                <EstrellasPuntuacion
                  promedio={stats.promedio}
                  total={stats.total}
                  size={20}
                  showNumber
                  showTotal
                />
              )}
            </View>
            <Separador />
          </View>

          <View className="p-5 gap-4">
            {sitio.imagenes ? (
              <View className="px-5 pt-2 flex-col items-start justify-start">
                <Text className="text-xs text-foreground mb-1">
                  Galería de imágenes
                </Text>
                <ImageCarousel imagenes={sitio.imagenes} thumbSize={96} />
              </View>
            ) : null}

            {sitio.descripcion ? (
              <Text className="text-base text-foreground leading-6">
                {sitio.descripcion}
              </Text>
            ) : null}

            {sitio.ofertas ? (
              <View
                className="rounded-xl p-4"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-xs text-muted mb-1">Ofertas</Text>
                <Text className="text-base text-foreground">
                  {sitio.ofertas}
                </Text>
              </View>
            ) : null}
            {sitio.telefono ? (
              <View
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-xs text-muted mb-3 font-medium uppercase tracking-wide">
                  Contactar
                </Text>
                <View className="gap-3">
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `tel:${String(sitio.telefono).replace(/\D/g, "")}`,
                      )
                    }
                    activeOpacity={0.7}
                    className="flex-row items-center gap-3 rounded-xl py-3 px-4"
                    style={{ backgroundColor: colors.background }}
                  >
                    <View
                      className="rounded-full p-2"
                      style={{ backgroundColor: colors.primary + "20" }}
                    >
                      <IconSymbol
                        name="phone.fill"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted">Teléfono</Text>
                      <Text
                        className="text-base font-semibold"
                        style={{ color: colors.foreground }}
                      >
                        {sitio.telefono}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const num = String(sitio.telefono).replace(/\D/g, "");
                      const whatsappNum = num.startsWith("53")
                        ? num
                        : `53${num}`;
                      Linking.openURL(`https://wa.me/${whatsappNum}`);
                    }}
                    activeOpacity={0.7}
                    className="flex-row items-center gap-3 rounded-xl py-3 px-4"
                    style={{ backgroundColor: colors.background }}
                  >
                    <View
                      className="rounded-full p-2"
                      style={{ backgroundColor: "#25D36620" }}
                    >
                      <IconSymbol
                        name="message.fill"
                        size={22}
                        color="#25D366"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted">WhatsApp</Text>
                      <Text
                        className="text-base font-semibold"
                        style={{ color: "#25D366" }}
                      >
                        Enviar mensaje
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {sitio.localizacion ? (
              <View className="mt-2 gap-3">
                <View
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-stretch p-4 gap-4">
                    <View className="flex-1 gap-1 min-w-0">
                      <View className="flex-row items-center gap-2">
                        <View
                          className="rounded-full p-2"
                          style={{ backgroundColor: colors.primary + "20" }}
                        >
                          <IconSymbol
                            name="location.fill"
                            size={20}
                            color={colors.primary}
                          />
                        </View>
                        <Text className="text-xs text-muted font-medium uppercase tracking-wide">
                          Ubicación
                        </Text>
                      </View>
                      {sitio.direccion ? (
                        <Text
                          className="text-base text-foreground mt-1"
                          numberOfLines={3}
                        >
                          {sitio.direccion}
                        </Text>
                      ) : (
                        <Text className="text-sm text-muted mt-1">
                          Ver en mapa
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center justify-between gap-3 px-1">
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        "Aviso",
                        "Algunas funcionalidades de Google Maps pueden no estar disponibles. Abra Google Maps si desea más información.",
                      )
                    }
                    activeOpacity={0.7}
                    className="flex-row items-center gap-1"
                  >
                    <IconSymbol
                      name="exclamationmark.triangle.fill"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(buildGoogleMapsUrl(sitio.localizacion))
                      }
                      activeOpacity={0.7}
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text
                        className="text-[11px] font-semibold"
                        style={{ color: "#FFFFFF" }}
                      >
                        Google Maps
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setMapReloadKey((k) => k + 1)}
                      activeOpacity={0.7}
                      className="rounded-lg px-3 py-2 border"
                      style={{ borderColor: colors.border }}
                    >
                      <Text
                        className="text-[11px]"
                        style={{ color: colors.muted }}
                      >
                        Resetear mapa
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Maps
                  key={mapReloadKey}
                  uri={sitio.localizacion}
                  height={380}
                />
              </View>
            ) : null}

            <Separador />

            {/* Sección de Opiniones de Clientes */}
            {opiniones.length > 0 && (
              <View className="mt-4">
                <Text className="text-lg font-semibold text-foreground mb-3">
                  Opiniones de Clientes ({opiniones.length})
                </Text>
                <ScrollView
                  style={{ maxHeight: 400 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  <View
                    className="gap-4"
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                    }}
                  >
                    {opiniones.map((opinion) => (
                      <View
                        key={opinion.id}
                        className="rounded-xl p-4"
                        style={{ backgroundColor: colors.surface }}
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <EstrellasPuntuacion
                            promedio={opinion.calificacion}
                            size={16}
                          />
                          {opinion.autor_texto && (
                            <Text className="text-sm font-medium text-foreground">
                              {opinion.autor_texto}
                            </Text>
                          )}
                        </View>
                        {opinion.comentario && (
                          <Text className="text-sm text-foreground mt-2 leading-5">
                            {opinion.comentario}
                          </Text>
                        )}
                        <Text className="text-xs text-muted mt-2">
                          {new Date(opinion.creado_at).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Formulario para escribir opinión - dentro de accordion */}
            {sitioId && (
              <View className="mt-4">
                <Collapsible title="Escribe tu opinión">
                  <FormularioOpinion
                    sitioId={sitioId}
                    onCreateOpinion={crearOpinion}
                    onSuccess={() => {
                      refreshOpiniones();
                      // Marcar que se necesita refrescar los sitios en index
                      // Esto se manejará con useFocusEffect en index.tsx
                    }}
                  />
                </Collapsible>
              </View>
            )}
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
