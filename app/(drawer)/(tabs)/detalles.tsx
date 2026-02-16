import { ScreenContainer } from "@/components/screen-container";
import { UbicacionMapa } from "@/components/ubicacion-mapa";
import { useColors } from "@/hooks/use-colors";
import type { SitioRelevante } from "@/hooks/use-sitios-relevantes";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";

function getFirstImageUrl(imagenes: string | null): string | null {
  if (!imagenes || !imagenes.trim()) return null;
  const first = imagenes.split(",")[0]?.trim();
  return first && (first.startsWith("http") || first.startsWith("//"))
    ? first
    : null;
}

export default function DetallesScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [sitio, setSitio] = useState<SitioRelevante | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSitio = useCallback(async (sitioId: string) => {
    setLoading(true);
    setError(null);
    try {
      const numId = parseInt(sitioId, 10);
      if (Number.isNaN(numId)) throw new Error("ID inválido");
      const { data, error: err } = await supabase
        .from("sitios_relevantes")
        .select(
          "id, nombre, localizacion, descripcion, imagenes, ofertas, menus, tipo_sitio_id, direccion, telefono, contador_opiniones, provincia_id, municipio_id"
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

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
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
          <Text className="text-2xl font-bold text-foreground">{sitio.nombre}</Text>


          {sitio.descripcion ? (
            <Text className="text-base text-foreground leading-6">
              {sitio.descripcion}
            </Text>
          ) : null}

          {sitio.direccion ? (
            <View>
              <Text className="text-xs text-muted mb-1">Dirección</Text>
              <Text className="text-base text-foreground">📍 {sitio.direccion}</Text>
            </View>
          ) : null}

          {sitio.telefono != null && sitio.telefono !== 0 ? (
            <View>
              <Text className="text-xs text-muted mb-1">Teléfono</Text>
              <Text className="text-base text-foreground">📞 {sitio.telefono}</Text>
            </View>
          ) : null}

          {sitio.ofertas ? (
            <View className="rounded-xl p-4" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs text-muted mb-1">Ofertas</Text>
              <Text className="text-base text-foreground">{sitio.ofertas}</Text>
            </View>
          ) : null}

          {sitio.contador_opiniones > 0 && (
            <Text className="text-sm text-muted">
              {sitio.contador_opiniones} opinión{sitio.contador_opiniones !== 1 ? "es" : ""}
            </Text>
          )}

          {sitio.localizacion ? (
            <View className="mt-2">
              <Text className="text-base font-semibold text-foreground mb-2">
                Ubicación
              </Text>
              <UbicacionMapa localizacion={sitio.localizacion} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
