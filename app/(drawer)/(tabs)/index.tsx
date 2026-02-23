import { ScreenContainer } from "@/components/screen-container";
import { SitioRelevanteCard } from "@/components/sitio-relevante-card";
import { TipoSitioChipCarousel } from "@/components/tipo-sitio-chip-carousel";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useHeaderCategory } from "@/contexts/header-category-context";
import { useColors } from "@/hooks/use-colors";
import { useLocations } from "@/hooks/use-locations";
import { useProfile } from "@/hooks/use-profile";
import { useSitiosRelevantes } from "@/hooks/use-sitios-relevantes";
import { useTiposSitio, type TipoSitio } from "@/hooks/use-tipos-sitio";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCROLL_DIRECTION_THRESHOLD = 10;
const ANIMATION_DURATION = 320;
const ANIMATION_EASING = Easing.out(Easing.cubic);

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sitios, loading, loadingMore, error, refresh } =
    useSitiosRelevantes();
  const { tipos } = useTiposSitio();
  const { profile, refresh: refreshProfile } = useProfile();
  const { provincias } = useLocations();
  const params = useLocalSearchParams<{ categoriaId?: string }>();
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  /** Filtro de provincia desde el FAB: undefined = usar perfil, null = Todas, string = id provincia */
  const [filterProvinciaId, setFilterProvinciaId] = useState<
    string | null | undefined
  >(undefined);
  const [showProvinciaModal, setShowProvinciaModal] = useState(false);
  const { setHeaderChip, setHeaderCategoryLabel } = useHeaderCategory();

  const showChipInHeader = useCallback(() => {
    setHeaderChip(true);
  }, [setHeaderChip]);

  const hideChipInHeader = useCallback(() => {
    setHeaderChip(false);
  }, [setHeaderChip]);

  // Ocultar chip al salir de la pantalla
  useEffect(() => {
    return () => {
      setHeaderChip(false);
    };
  }, [setHeaderChip]);

  // Animación: ocultar categorías al bajar, mostrar al subir el scroll
  // Usamos un factor de visibilidad (0-1) para poder colapsar la altura.
  const categoriesVisibility = useSharedValue(1);
  const lastScrollY = useSharedValue(0);
  const categoriesHeight = useSharedValue(120);

  const onCategoriesLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { height } = e.nativeEvent.layout;
      categoriesHeight.value = height;
    },
    [categoriesHeight],
  );

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        const y = event.contentOffset.y;
        const diff = y - lastScrollY.value;
        lastScrollY.value = y;
        if (diff > SCROLL_DIRECTION_THRESHOLD) {
          // Ocultar barra (suave: desvanecer y deslizar)
          categoriesVisibility.value = withTiming(0, {
            duration: ANIMATION_DURATION,
            easing: ANIMATION_EASING,
          });
          runOnJS(showChipInHeader)();
        } else if (diff < -SCROLL_DIRECTION_THRESHOLD) {
          // Mostrar barra
          categoriesVisibility.value = withTiming(1, {
            duration: ANIMATION_DURATION,
            easing: ANIMATION_EASING,
          });
          runOnJS(hideChipInHeader)();
        }
      },
    },
    [showChipInHeader, hideChipInHeader],
  );

  const categoriesAnimatedStyle = useAnimatedStyle(() => {
    const v = categoriesVisibility.value;
    const h = categoriesHeight.value;
    return {
      height: h * v,
      opacity: v,
      transform: [{ translateY: -(1 - v) * h * 0.4 }],
    };
  });

  // Aplicar filtro de categoría desde el drawer
  useEffect(() => {
    if (params.categoriaId) {
      const categoriaId = parseInt(params.categoriaId, 10);
      if (!isNaN(categoriaId)) {
        setSelectedTipoId(categoriaId);
      }
    }
  }, [params.categoriaId]);

  // Refrescar el perfil y los sitios cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      refresh(); // Refrescar sitios para actualizar las estrellas después de crear una opinión
    }, [refreshProfile, refresh]),
  );

  // Provincia del perfil (para valor por defecto)
  const provinciaUsuarioId = useMemo(() => {
    if (!profile.province || provincias.length === 0) return null;
    const provincia = provincias.find((p) => p.nombre === profile.province);
    return provincia?.id ?? null;
  }, [profile.province, provincias]);

  // Provincia efectiva: FAB override o perfil; null = mostrar todos
  const effectiveProvinciaId = useMemo(() => {
    if (filterProvinciaId === undefined) return provinciaUsuarioId;
    return filterProvinciaId;
  }, [filterProvinciaId, provinciaUsuarioId]);

  const effectiveProvinciaNombre = useMemo(() => {
    if (!effectiveProvinciaId) return null;
    return (
      provincias.find((p) => p.id === effectiveProvinciaId)?.nombre ?? null
    );
  }, [effectiveProvinciaId, provincias]);

  // Filtrar sitios por provincia efectiva
  const sitiosPorProvincia = useMemo(() => {
    if (!effectiveProvinciaId) return sitios;
    return sitios.filter((s) => s.provincia_id === effectiveProvinciaId);
  }, [sitios, effectiveProvinciaId]);

  // Cantidad de sitios por tipo (para los badges de categorías)
  const countsByTipoId = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const sitio of sitiosPorProvincia) {
      const tipoId = sitio.tipo_sitio_id;
      if (tipoId == null) continue;
      counts[tipoId] = (counts[tipoId] ?? 0) + 1;
    }
    return counts;
  }, [sitiosPorProvincia]);

  const totalSitios = sitiosPorProvincia.length;

  // Categorías para el carrusel: si ya tenemos tipos con nombres, usarlos;
  // si no (tipos aún cargando), derivar desde los sitios para pintar el carrusel al instante.
  const tiposDisponibles = useMemo((): TipoSitio[] => {
    const idsPresentes = new Set(
      sitiosPorProvincia
        .map((s) => s.tipo_sitio_id)
        .filter((id): id is number => id != null),
    );
    if (idsPresentes.size === 0) return tipos;

    const conNombres = tipos.filter((t) => idsPresentes.has(t.id));
    if (conNombres.length > 0) return conNombres;

    return Array.from(idsPresentes)
      .sort((a, b) => a - b)
      .map((id) => ({ id, tipo: `Categoría ${id}`, descripcion: null }));
  }, [sitiosPorProvincia, tipos]);

  const selectedCategoryLabel = useMemo(() => {
    if (selectedTipoId == null) return "Todas";
    const tipo = tiposDisponibles.find((t) => t.id === selectedTipoId);
    return tipo?.tipo ?? "Todas";
  }, [selectedTipoId, tiposDisponibles]);

  // Mantener siempre la etiqueta de categoría en el header (así el chip muestra la selección actual)
  useEffect(() => {
    setHeaderCategoryLabel(selectedCategoryLabel);
  }, [selectedCategoryLabel, setHeaderCategoryLabel]);

  // Agrupar sitios por categoría (tipo_sitio_id) y ordenar por puntuación dentro de cada grupo
  const sitiosAgrupados = useMemo(() => {
    const grupos: Map<number | null, typeof sitiosPorProvincia> = new Map();

    for (const sitio of sitiosPorProvincia) {
      const tipoId = sitio.tipo_sitio_id;
      if (!grupos.has(tipoId)) {
        grupos.set(tipoId, []);
      }
      grupos.get(tipoId)!.push(sitio);
    }

    // Ordenar cada grupo por puntuación descendente
    grupos.forEach((sitiosGrupo) => {
      sitiosGrupo.sort((a, b) => b.promedio_puntuacion - a.promedio_puntuacion);
    });

    return grupos;
  }, [sitiosPorProvincia]);

  const sitiosFiltrados = useMemo(() => {
    let filtrados = sitiosPorProvincia;
    if (selectedTipoId !== null) {
      // Si hay filtro de categoría, mostrar solo esa categoría y ordenar por puntuación
      filtrados = sitiosPorProvincia
        .filter((s) => s.tipo_sitio_id === selectedTipoId)
        .sort((a, b) => b.promedio_puntuacion - a.promedio_puntuacion);
    }
    // Sin filtro: devolver todos (se mostrarán agrupados en secciones)
    return filtrados;
  }, [sitiosPorProvincia, selectedTipoId]);

  useEffect(() => {
    if (
      selectedTipoId != null &&
      !tiposDisponibles.some((t) => t.id === selectedTipoId)
    ) {
      setSelectedTipoId(null);
    }
  }, [selectedTipoId, tiposDisponibles]);

  // Sincronizar el estado local con los parámetros de la ruta cuando cambia desde el carousel
  const handleSelectTipo = useCallback((tipoId: number | null) => {
    setSelectedTipoId(tipoId);
    // Actualizar los parámetros de la ruta para sincronizar con el drawer
    if (tipoId !== null) {
      router.setParams({ categoriaId: String(tipoId) });
    } else {
      router.setParams({});
    }
  }, []);

  return (
    <ScreenContainer edges={["left", "right"]} className="flex-1">
      <View className="flex-1" style={{ overflow: "hidden" }}>
        {/* Barra de categorías (fuera del ScrollView, con animación de entrada/salida) */}
        <Animated.View style={categoriesAnimatedStyle}>
          <View
            onLayout={onCategoriesLayout}
            style={{
              backgroundColor: colors.background,
              overflow: "hidden",
            }}
            className="px-4 pt-2 pb-3"
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <Text
                className="text-x2 font-bold text-foreground"
                style={{ flex: 1 }}
              >
                {effectiveProvinciaNombre
                  ? `Categorías en ${effectiveProvinciaNombre}`
                  : "Categorías disponibles"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowProvinciaModal(true)}
                activeOpacity={0.85}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.primary,
                }}
              >
                <IconSymbol name="location.fill" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
            {tiposDisponibles.length > 0 && sitiosPorProvincia.length > 0 && (
              <TipoSitioChipCarousel
                tipos={tiposDisponibles}
                selectedTipoId={selectedTipoId}
                onSelectTipo={handleSelectTipo}
                countsByTipoId={countsByTipoId}
                totalCount={totalSitios}
              />
            )}
          </View>
        </Animated.View>

        {/* ScrollView con detección de dirección para animar categorías */}
        <View style={{ height: 20 }}></View>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 8,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-8" style={{ paddingBottom: 100 }}>
            {loading && sitiosPorProvincia.length === 0 ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-sm mt-3 text-muted">
                  Cargando sitios...
                </Text>
              </View>
            ) : error ? (
              <View
                className="py-6 rounded-2xl p-4"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-sm text-foreground mb-2">{error}</Text>
                <TouchableOpacity
                  onPress={refresh}
                  className="rounded-xl py-2 px-4 self-start"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: "#FFF" }}
                  >
                    Reintentar
                  </Text>
                </TouchableOpacity>
              </View>
            ) : sitiosPorProvincia.length === 0 ? (
              <Text className="text-sm text-muted py-4">
                {effectiveProvinciaNombre
                  ? `No hay sitios relevantes en ${effectiveProvinciaNombre} por ahora.`
                  : "No hay sitios relevantes por ahora."}
              </Text>
            ) : sitiosFiltrados.length === 0 ? (
              <Text className="text-sm text-muted py-4">
                No hay sitios de este tipo
                {effectiveProvinciaNombre
                  ? ` en ${effectiveProvinciaNombre}`
                  : ""}
                .
              </Text>
            ) : selectedTipoId !== null ? (
              // Mostrar solo la categoría seleccionada
              sitiosFiltrados.map((sitio) => (
                <SitioRelevanteCard
                  key={sitio.id}
                  sitio={sitio}
                  onPress={() =>
                    router.push({
                      pathname: "/(drawer)/(tabs)/detalles",
                      params: { id: String(sitio.id) },
                    })
                  }
                />
              ))
            ) : (
              // Mostrar agrupados por categoría
              Array.from(sitiosAgrupados.entries())
                .sort(([a], [b]) => {
                  // Ordenar categorías: primero las que tienen tipo, luego null
                  if (a === null) return 1;
                  if (b === null) return -1;
                  return a - b;
                })
                .map(([tipoId, sitiosGrupo]) => {
                  const tipo =
                    tipoId !== null ? tipos.find((t) => t.id === tipoId) : null;
                  const nombreCategoria = tipo?.tipo ?? "Sin categoría";

                  return (
                    <View key={tipoId ?? "sin_categoria"} className="mb-6">
                      <View className="mb-4 px-2">
                        <Text
                          className="text-xl font-bold"
                          style={{ color: colors.foreground }}
                        >
                          {nombreCategoria}
                        </Text>
                        <Text
                          className="text-xs mt-1"
                          style={{ color: colors.muted }}
                        >
                          {sitiosGrupo.length}{" "}
                          {sitiosGrupo.length === 1 ? "sitio" : "sitios"}
                        </Text>
                      </View>
                      {sitiosGrupo.map((sitio) => (
                        <SitioRelevanteCard
                          key={sitio.id}
                          sitio={sitio}
                          onPress={() =>
                            router.push({
                              pathname: "/(drawer)/(tabs)/detalles",
                              params: { id: String(sitio.id) },
                            })
                          }
                        />
                      ))}
                    </View>
                  );
                })
            )}

            {/* Indicador de carga incremental */}
            {loadingMore && !loading && (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-xs mt-2 text-muted">
                  Cargando más sitios...
                </Text>
              </View>
            )}
          </View>
        </Animated.ScrollView>

        {/* Modal: elegir provincia */}
        <Modal
          visible={showProvinciaModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowProvinciaModal(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
            onPress={() => setShowProvinciaModal(false)}
          >
            <Pressable
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: Math.max(insets.bottom, 16),
                maxHeight: "70%",
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <View
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text
                  className="text-lg font-semibold"
                  style={{ color: colors.foreground }}
                >
                  Filtrar por provincia
                </Text>
              </View>
              <ScrollView
                style={{ maxHeight: 400 }}
                contentContainerStyle={{ paddingVertical: 8 }}
                keyboardShouldPersistTaps="handled"
              >
                <TouchableOpacity
                  onPress={() => {
                    setFilterProvinciaId(null);
                    setShowProvinciaModal(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    backgroundColor:
                      effectiveProvinciaId === null
                        ? colors.primary + "20"
                        : "transparent",
                  }}
                >
                  <IconSymbol
                    name="location.fill"
                    size={22}
                    color={
                      effectiveProvinciaId === null
                        ? colors.primary
                        : colors.muted
                    }
                  />
                  <Text
                    className="text-base ml-3"
                    style={{
                      color:
                        effectiveProvinciaId === null
                          ? colors.primary
                          : colors.foreground,
                      fontWeight: effectiveProvinciaId === null ? "600" : "400",
                    }}
                  >
                    Todas las provincias
                  </Text>
                </TouchableOpacity>
                {provincias.map((p) => {
                  const isSelected = effectiveProvinciaId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => {
                        setFilterProvinciaId(p.id);
                        setShowProvinciaModal(false);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 14,
                        paddingHorizontal: 20,
                        backgroundColor: isSelected
                          ? colors.primary + "20"
                          : "transparent",
                      }}
                    >
                      <IconSymbol
                        name="location.fill"
                        size={22}
                        color={isSelected ? colors.primary : colors.muted}
                      />
                      <Text
                        className="text-base ml-3"
                        style={{
                          color: isSelected
                            ? colors.primary
                            : colors.foreground,
                          fontWeight: isSelected ? "600" : "400",
                        }}
                      >
                        {p.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </ScreenContainer>
  );
}
