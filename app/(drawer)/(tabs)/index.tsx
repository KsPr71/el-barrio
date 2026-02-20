import { ScreenContainer } from "@/components/screen-container";
import { SitioRelevanteCard } from "@/components/sitio-relevante-card";
import { TipoSitioChipCarousel } from "@/components/tipo-sitio-chip-carousel";
import { useHeaderCategory } from "@/contexts/header-category-context";
import { useColors } from "@/hooks/use-colors";
import { useLocations } from "@/hooks/use-locations";
import { useProfile } from "@/hooks/use-profile";
import { useSitiosRelevantes } from "@/hooks/use-sitios-relevantes";
import { useTiposSitio } from "@/hooks/use-tipos-sitio";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SCROLL_DIRECTION_THRESHOLD = 10;
const ANIMATION_DURATION = 220;

export default function HomeScreen() {
  const colors = useColors();
  const { sitios, loading, loadingMore, error, refresh } =
    useSitiosRelevantes();
  const { tipos } = useTiposSitio();
  const { profile, refresh: refreshProfile } = useProfile();
  const { provincias } = useLocations();
  const params = useLocalSearchParams<{ categoriaId?: string }>();
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);
  const { setHeaderChip, setHeaderCategoryLabel } = useHeaderCategory();

  // Etiqueta de la categoría seleccionada para el chip del header
  const selectedCategoryLabel = useMemo(() => {
    if (selectedTipoId == null) return "Todas";
    const tipo = tipos.find((t) => t.id === selectedTipoId);
    return tipo?.tipo ?? "Todas";
  }, [selectedTipoId, tipos]);

  // Mantener siempre la etiqueta de categoría en el header (así el chip muestra la selección actual)
  useEffect(() => {
    setHeaderCategoryLabel(selectedCategoryLabel);
  }, [selectedCategoryLabel, setHeaderCategoryLabel]);

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
          // Ocultar barra
          categoriesVisibility.value = withTiming(0, {
            duration: ANIMATION_DURATION,
          });
          runOnJS(showChipInHeader)();
        } else if (diff < -SCROLL_DIRECTION_THRESHOLD) {
          // Mostrar barra
          categoriesVisibility.value = withTiming(1, {
            duration: ANIMATION_DURATION,
          });
          runOnJS(hideChipInHeader)();
        }
      },
    },
    [showChipInHeader, hideChipInHeader],
  );

  const categoriesAnimatedStyle = useAnimatedStyle(() => ({
    height: categoriesHeight.value * categoriesVisibility.value,
    opacity: categoriesVisibility.value,
  }));

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

  // Obtener el ID de la provincia del usuario
  const provinciaUsuarioId = useMemo(() => {
    if (!profile.province || provincias.length === 0) return null;
    const provincia = provincias.find((p) => p.nombre === profile.province);
    return provincia?.id ?? null;
  }, [profile.province, provincias]);

  // Filtrar sitios por provincia del usuario
  const sitiosPorProvincia = useMemo(() => {
    if (!provinciaUsuarioId) return sitios;
    return sitios.filter((s) => s.provincia_id === provinciaUsuarioId);
  }, [sitios, provinciaUsuarioId]);

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

  const tiposDisponibles = useMemo(() => {
    const idsPresentes = new Set(
      sitiosPorProvincia
        .map((s) => s.tipo_sitio_id)
        .filter((id): id is number => id != null),
    );
    return tipos.filter((t) => idsPresentes.has(t.id));
  }, [sitiosPorProvincia, tipos]);

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
            <Text className="text-x2 font-bold text-foreground mb-3">
              {profile.province
                ? `Categorías disponibles en ${profile.province}`
                : "Categorías disponibles"}
            </Text>
            {tiposDisponibles.length > 0 && !loading && !error && (
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
          <View className="gap-8">
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
                {profile.province
                  ? `No hay sitios relevantes en ${profile.province} por ahora.`
                  : "No hay sitios relevantes por ahora."}
              </Text>
            ) : sitiosFiltrados.length === 0 ? (
              <Text className="text-sm text-muted py-4">
                No hay sitios de este tipo
                {profile.province ? ` en ${profile.province}` : ""}.
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
                  const tipo = tipoId !== null ? tipos.find((t) => t.id === tipoId) : null;
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
      </View>
    </ScreenContainer>
  );
}
