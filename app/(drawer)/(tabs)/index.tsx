import { ScreenContainer } from "@/components/screen-container";
import { SitioRelevanteCard } from "@/components/sitio-relevante-card";
import { TipoSitioChipCarousel } from "@/components/tipo-sitio-chip-carousel";
import { useColors } from "@/hooks/use-colors";
import { useLocations } from "@/hooks/use-locations";
import { useProfile } from "@/hooks/use-profile";
import { useSitiosRelevantes } from "@/hooks/use-sitios-relevantes";
import { useTiposSitio } from "@/hooks/use-tipos-sitio";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const colors = useColors();
  const { sitios, loading, error, refresh } = useSitiosRelevantes();
  const { tipos } = useTiposSitio();
  const { profile, refresh: refreshProfile } = useProfile();
  const { provincias } = useLocations();
  const params = useLocalSearchParams<{ categoriaId?: string }>();
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);

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
    }, [refreshProfile, refresh])
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

  const tiposDisponibles = useMemo(() => {
    const idsPresentes = new Set(
      sitiosPorProvincia
        .map((s) => s.tipo_sitio_id)
        .filter((id): id is number => id != null),
    );
    return tipos.filter((t) => idsPresentes.has(t.id));
  }, [sitiosPorProvincia, tipos]);

  const sitiosFiltrados = useMemo(() => {
    let filtrados = sitiosPorProvincia;
    if (selectedTipoId !== null) {
      filtrados = filtrados.filter((s) => s.tipo_sitio_id === selectedTipoId);
    }
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
    <ScreenContainer className="flex-1">
      <View className="flex-1">
        {/* Carousel de categorías (fijo arriba, separado del ScrollView) */}
        <View className="px-4 pt-2 pb-3" style={{ backgroundColor: colors.background }}>
          <Text className="text-xl font-bold text-foreground mb-3">
            {profile.province
              ? `Categorías disponibles en ${profile.province}`
              : "Categorías disponibles"}
          </Text>
          {tiposDisponibles.length > 0 && !loading && !error && (
            <TipoSitioChipCarousel
              tipos={tiposDisponibles}
              selectedTipoId={selectedTipoId}
              onSelectTipo={handleSelectTipo}
            />
          )}
        </View>

        {/* ScrollView separado con los items */}
        <ScrollView
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
            {loading ? (
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
                No hay sitios de este tipo{profile.province ? ` en ${profile.province}` : ""}.
              </Text>
            ) : (
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
            )}

            {/* Feature Cards */}
            <View className="gap-4 mt-4">
              <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <View className="flex-row items-center gap-3 mb-3">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-2xl">🏘️</Text>
                  </View>
                  <Text className="text-xl font-bold text-primary flex-1">
                    Tu Comunidad
                  </Text>
                </View>
                <Text className="text-sm text-muted leading-relaxed">
                  Conecta con vecinos, comparte eventos y noticias de tu barrio.
                </Text>
              </View>

              <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <View className="flex-row items-center gap-3 mb-3">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.secondary }}
                  >
                    <Text className="text-2xl">💬</Text>
                  </View>
                  <Text className="text-xl font-bold text-primary flex-1">
                    Comunicación
                  </Text>
                </View>
                <Text className="text-sm text-muted leading-relaxed">
                  Mantente informado sobre lo que sucede en tu barrio en tiempo
                  real.
                </Text>
              </View>

              <View className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <View className="flex-row items-center gap-3 mb-3">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-2xl">🤝</Text>
                  </View>
                  <Text className="text-xl font-bold text-primary flex-1">
                    Colaboración
                  </Text>
                </View>
                <Text className="text-sm text-muted leading-relaxed">
                  Trabaja juntos para mejorar tu comunidad y barrio.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-3 mt-4">
              <TouchableOpacity
                className="rounded-full py-4 items-center active:opacity-80"
                style={{ backgroundColor: colors.primary }}
              >
                <Text
                  className="text-base font-bold"
                  style={{ color: "#FFFFFF" }}
                >
                  Comenzar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="rounded-full py-4 items-center border-2 active:opacity-70"
                style={{ borderColor: colors.secondary }}
              >
                <Text className="text-base font-bold text-foreground">
                  Explorar más
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
