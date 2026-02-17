import { EstrellasPuntuacion } from "@/components/estrellas-puntuacion";
import { FormularioOpinion } from "@/components/formulario-opinion";
import { ScreenContainer } from "@/components/screen-container";
import { UbicacionMapa } from "@/components/ubicacion-mapa";
import { Collapsible } from "@/components/ui/collapsible";
import { TipoSitioChip } from "@/components/ui/tipo-sitio";
import { useColors } from "@/hooks/use-colors";
import { useOpiniones } from "@/hooks/use-opiniones";
import type { SitioRelevante } from "@/hooks/use-sitios-relevantes";
import { useTiposSitio } from "@/hooks/use-tipos-sitio";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
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
        <ScrollView
          contentContainerStyle={{
            paddingBottom: Math.max(24, insets.bottom + 16),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {imagenUrl ? (
            <Image
              source={{ uri: imagenUrl }}
              style={{
                width: "100%",
                height: 220,
                backgroundColor: colors.border,
              }}
              contentFit="cover"
            />
          ) : (
            <View
              className="w-full items-center justify-center"
              style={{
                height: 160,
                backgroundColor: colors.border,
              }}
            >
              <Text className="text-5xl">📍</Text>
            </View>
          )}

          <View className="p-5 gap-4">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                {sitio.nombre}
              </Text>
              {tipoSitio && (
                <View className="mt-2">
                  <TipoSitioChip tipo={tipoSitio} />
                </View>
              )}
              {stats.total > 0 && (
                <View className="mt-2">
                  <EstrellasPuntuacion
                    promedio={stats.promedio}
                    total={stats.total}
                    size={20}
                    showNumber
                    showTotal
                  />
                </View>
              )}
            </View>

            {sitio.descripcion ? (
              <Text className="text-base text-foreground leading-6">
                {sitio.descripcion}
              </Text>
            ) : null}

            {sitio.direccion ? (
              <View>
                <Text className="text-xs text-muted mb-1">Dirección</Text>
                <Text className="text-base text-foreground">
                  📍 {sitio.direccion}
                </Text>
              </View>
            ) : null}

            {sitio.telefono != null && sitio.telefono !== 0 ? (
              <View>
                <Text className="text-xs text-muted mb-1">Teléfono</Text>
                <Text className="text-base text-foreground">
                  📞 {sitio.telefono}
                </Text>
              </View>
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

            {sitio.localizacion ? (
              <View className="mt-2">
                <Text className="text-base font-semibold text-foreground mb-2">
                  Ubicación
                </Text>
                <UbicacionMapa localizacion={sitio.localizacion} />
              </View>
            ) : null}

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
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
