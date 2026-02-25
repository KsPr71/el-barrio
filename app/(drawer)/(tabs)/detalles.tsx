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
import { formatHorarioForDisplay, isHorarioAbierto } from "@/lib/horario";
import { getCachedSitioRelevanteById } from "@/lib/offline-sitios-db";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
  useSharedValue,
  withTiming,
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
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  /** Imagen mostrada como principal; al tocar una miniatura del carrusel se actualiza. */
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const imageFadeOpacity = useSharedValue(1);
  const userTappedImage = useRef(false);

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

  const imageFadeStyle = useAnimatedStyle(() => ({
    opacity: imageFadeOpacity.value,
  }));

  const currentIdRef = useRef<string | null>(null);

  const fetchSitio = useCallback(async (sitioId: string) => {
    const numId = parseInt(sitioId, 10);
    setLoading(true);
    setError(null);
    try {
      if (Number.isNaN(numId)) throw new Error("ID inválido");

      // 1) SQLite primero (instantáneo / offline)
      try {
        const local = await getCachedSitioRelevanteById(numId);
        if (currentIdRef.current !== sitioId) return;
        if (local) {
          setSitio(local);
          setLoading(false);
        }
      } catch (e) {
        console.warn("[Detalles] error al leer cache SQLite:", e);
      }

      // 2) Supabase en segundo plano (fuente de verdad)
      const { data, error: err } = await supabase
        .from("sitios_relevantes")
        .select(
          "id, nombre, localizacion, descripcion, imagenes, ofertas, menus, tipo_sitio_id, direccion, telefono, contador_opiniones, provincia_id, municipio_id, horario, facebook_link, instagram_link, sitio_web",
        )
        .eq("id", numId)
        .eq("estado_suscripcion", "aceptado")
        .single();
      if (currentIdRef.current !== sitioId) return;
      if (err) throw err;
      setSitio(data as SitioRelevante);
    } catch (e) {
      if (currentIdRef.current === sitioId) {
        setError(e instanceof Error ? e.message : "Error al cargar el sitio");
        setSitio(null);
      }
    } finally {
      if (currentIdRef.current === sitioId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (id) {
      currentIdRef.current = id;
      fetchSitio(id);
    } else {
      setSitio(null);
      setLoading(false);
      setError(null);
    }
  }, [id, fetchSitio]);

  // Al cargar o cambiar el sitio, usar la primera imagen como principal
  useEffect(() => {
    if (sitio) setSelectedImageUrl(getFirstImageUrl(sitio.imagenes));
  }, [sitio]);

  // Animación de desvanecimiento al cambiar la imagen principal (solo cuando el usuario elige otra)
  useEffect(() => {
    if (userTappedImage.current && selectedImageUrl) {
      userTappedImage.current = false;
      imageFadeOpacity.value = 0;
      requestAnimationFrame(() => {
        imageFadeOpacity.value = withTiming(1, { duration: 350 });
      });
    }
    // imageFadeOpacity es estable (useSharedValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageUrl]);

  const handleSelectImage = useCallback((uri: string) => {
    userTappedImage.current = true;
    setSelectedImageUrl(uri);
  }, []);

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

  const imagenPrincipalUrl =
    selectedImageUrl ?? getFirstImageUrl(sitio.imagenes);
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
        </View>

        {isMapExpanded && sitio.localizacion ? (
          <View style={{ flex: 1, position: "relative" }}>
            <View style={{ flex: 1 }}>
              <Maps key={mapReloadKey} uri={sitio.localizacion} />
            </View>
            <TouchableOpacity
              onPress={() => setIsMapExpanded(false)}
              activeOpacity={0.8}
              style={{
                position: "absolute",
                bottom: 100 + (insets.bottom || 0),
                alignSelf: "center",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 10,
                paddingHorizontal: 20,
                backgroundColor: colors.background,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <IconSymbol
                name="chevron.left"
                size={20}
                color={colors.foreground}
              />
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.foreground }}
              >
                Volver
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {/* ScrollView siempre montado para que useScrollOffset tenga ref válida (evita warning de Reanimated) */}
        {isMapExpanded && sitio.localizacion ? (
          <Animated.ScrollView
            ref={scrollRef}
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
            }}
          >
            <View />
          </Animated.ScrollView>
        ) : (
          <Animated.ScrollView
            ref={scrollRef}
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
                  backgroundColor: colors.surface,
                },
                imageContainerStyle,
              ]}
            >
              {imagenPrincipalUrl ? (
                <Animated.View style={[{ flex: 1 }, imageFadeStyle]}>
                  <Image
                    source={{ uri: imagenPrincipalUrl }}
                    style={{
                      width: "100%",
                      height: IMAGE_HEIGHT_FULL,
                      backgroundColor: colors.surface,
                    }}
                    contentFit="cover"
                  />
                </Animated.View>
              ) : (
                <View
                  className="w-full items-center justify-center"
                  style={{
                    width: "100%",
                    height: IMAGE_HEIGHT_FULL,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text className="text-5xl">📍</Text>
                </View>
              )}
            </Animated.View>

            <View className="p-5 gap-4">
              {sitio.imagenes ? (
                <View className="px-5 pt-2 flex-col items-start justify-start">
                  <Text className="text-xs text-foreground mb-1">
                    Galería de imágenes
                  </Text>
                  <ImageCarousel
                    imagenes={sitio.imagenes}
                    thumbSize={96}
                    onImagePress={handleSelectImage}
                  />
                </View>
              ) : null}

              {sitio.descripcion ? (
                <Text className="text-base text-foreground leading-6">
                  {sitio.descripcion}
                </Text>
              ) : null}
              <Separador />

              {sitio.horario && sitio.horario.trim() ? (
                <Collapsible
                  title="Horario"
                  iconName="clock.fill"
                  trailingElement={
                    isHorarioAbierto(sitio.horario) === true ? (
                      <View
                        className="rounded-full px-2.5 py-1"
                        style={{ backgroundColor: "#16a34a" }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          Abierto
                        </Text>
                      </View>
                    ) : isHorarioAbierto(sitio.horario) === false ? (
                      <View
                        className="rounded-full px-2.5 py-1"
                        style={{ backgroundColor: "#dc2626" }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          Cerrado
                        </Text>
                      </View>
                    ) : null
                  }
                >
                  <View
                    className="rounded-2xl p-4"
                    style={{
                      backgroundColor: colors.background + "50",
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 40,
                    }}
                  >
                    <Text className="text-base text-foreground leading-7">
                      {formatHorarioForDisplay(sitio.horario)}
                    </Text>
                  </View>
                </Collapsible>
              ) : null}

              {/* Comentario de la sección de ofertas */}

              {sitio.ofertas && sitio.ofertas.length > 0 ? (
                <Collapsible title="Ofertas" iconName="dollarsign.circle.fill">
                  <View
                    className="rounded-2xl p-4"
                    style={{
                      backgroundColor: colors.background + "50",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      className="mt-2"
                      style={{
                        backgroundColor: colors.background,
                        padding: 10,
                        borderRadius: 10,
                      }}
                    >
                      <Text className="text-base text-foreground">
                        {sitio.ofertas}
                      </Text>
                    </View>
                  </View>
                </Collapsible>
              ) : null}

              {/* Comentario de la sección de contactos */}

              {sitio.telefono ||
              sitio.facebook_link ||
              sitio.instagram_link ||
              sitio.sitio_web ? (
                <Collapsible title="Contacto" iconName="person.fill">
                  <View
                    className="rounded-2xl p-4"
                    style={{
                      backgroundColor: colors.background + "50",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="gap-3">
                      {sitio.telefono ? (
                        <>
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
                              <Text className="text-xs text-muted">
                                Teléfono
                              </Text>
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
                              const num = String(sitio.telefono).replace(
                                /\D/g,
                                "",
                              );
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
                              <Text className="text-xs text-muted">
                                WhatsApp
                              </Text>
                              <Text
                                className="text-base font-semibold"
                                style={{ color: "#25D366" }}
                              >
                                Enviar mensaje
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </>
                      ) : null}
                      {sitio.facebook_link ? (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              sitio.facebook_link!.startsWith("http")
                                ? sitio.facebook_link!
                                : `https://${sitio.facebook_link}`,
                            )
                          }
                          activeOpacity={0.7}
                          className="flex-row items-center gap-3 rounded-xl py-3 px-4"
                          style={{ backgroundColor: colors.background }}
                        >
                          <View
                            className="rounded-full p-2"
                            style={{ backgroundColor: "#1877F220" }}
                          >
                            <MaterialCommunityIcons
                              name="facebook"
                              size={22}
                              color="#1877F2"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-muted">Facebook</Text>
                            <Text
                              className="text-base font-semibold"
                              style={{ color: colors.foreground }}
                            >
                              Ver página
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}
                      {sitio.instagram_link ? (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              sitio.instagram_link!.startsWith("http")
                                ? sitio.instagram_link!
                                : `https://${sitio.instagram_link}`,
                            )
                          }
                          activeOpacity={0.7}
                          className="flex-row items-center gap-3 rounded-xl py-3 px-4"
                          style={{ backgroundColor: colors.background }}
                        >
                          <View
                            className="rounded-full p-2"
                            style={{ backgroundColor: "#E4405F20" }}
                          >
                            <MaterialCommunityIcons
                              name="instagram"
                              size={22}
                              color="#E4405F"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-muted">
                              Instagram
                            </Text>
                            <Text
                              className="text-base font-semibold"
                              style={{ color: colors.foreground }}
                            >
                              Ver perfil
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}
                      {sitio.sitio_web ? (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              sitio.sitio_web!.startsWith("http")
                                ? sitio.sitio_web!
                                : `https://${sitio.sitio_web}`,
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
                            <MaterialCommunityIcons
                              name="web"
                              size={22}
                              color={colors.primary}
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-muted">
                              Sitio web
                            </Text>
                            <Text
                              className="text-base font-semibold"
                              style={{ color: colors.foreground }}
                            >
                              Visitar web
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </Collapsible>
              ) : null}

              {sitio.localizacion ? (
                <Collapsible title="Ubicación" iconName="location.fill">
                  <View
                    className="rounded-2xl p-4"
                    style={{
                      backgroundColor: colors.background + "50",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="gap-3">
                      <View
                        className="rounded-xl p-3"
                        style={{ backgroundColor: colors.background }}
                      >
                        <Text className="text-xs text-muted mb-1">
                          Dirección
                        </Text>
                        {sitio.direccion ? (
                          <Text className="text-base text-foreground">
                            {sitio.direccion}
                          </Text>
                        ) : (
                          <Text className="text-sm text-muted">
                            Sin dirección especificada
                          </Text>
                        )}
                      </View>
                      <Separador />

                      <View
                        className="rounded-xl p-3"
                        style={{ backgroundColor: colors.background }}
                      >
                        <Text className="text-xs text-muted mb-2">
                          Ver en el mapa
                        </Text>

                        <View className="flex-row items-center justify-between gap-3">
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
                              onPress={() => {
                                const loc = sitio.localizacion;
                                if (loc)
                                  Linking.openURL(buildGoogleMapsUrl(loc));
                              }}
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
                      </View>

                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setIsMapExpanded(true)}
                      >
                        <Maps
                          key={mapReloadKey}
                          uri={sitio.localizacion}
                          height={380}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Collapsible>
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
                    <View className="gap-4">
                      {opiniones.map((opinion) => (
                        <View
                          key={opinion.id}
                          className="rounded-xl p-4"
                          style={{
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 10,
                          }}
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
                <View className="mt-4" style={{ marginBottom: 100 }}>
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
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
