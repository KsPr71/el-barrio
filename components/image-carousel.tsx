import { parseImagenesUrls } from "@/lib/imagenes";
import { useColors } from "@/hooks/use-colors";
import { Image } from "expo-image";
import { useMemo } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const THUMB_SIZE = 96;
const GAP = 8;
const PADDING_H = 16;

export interface ImageCarouselProps {
  /**
   * Campo de Supabase: varias URLs separadas por comas.
   * Ejemplo: "https://a.jpg,https://b.jpg"
   */
  imagenes: string | null;
  /** Tamaño del thumbnail (ancho y alto). Por defecto 96. */
  thumbSize?: number;
  /** Si true, no se renderiza nada cuando no hay URLs. Por defecto true. */
  hideWhenEmpty?: boolean;
  /** Llamado al presionar una imagen (p. ej. para mostrarla como principal). */
  onImagePress?: (uri: string) => void;
}

export function ImageCarousel({
  imagenes,
  thumbSize = THUMB_SIZE,
  hideWhenEmpty = true,
  onImagePress,
}: ImageCarouselProps) {
  const colors = useColors();
  const urls = useMemo(() => parseImagenesUrls(imagenes), [imagenes]);

  if (urls.length === 0) {
    if (hideWhenEmpty) return null;
    return <View style={[styles.container, { minHeight: thumbSize }]} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: PADDING_H, gap: GAP },
        ]}
      >
        {urls.map((uri, index) => {
          const thumb = (
            <View
              style={[
                styles.thumbWrapper,
                {
                  width: thumbSize,
                  height: thumbSize,
                  backgroundColor: colors.border,
                  borderRadius: 10,
                },
              ]}
            >
              <Image
                source={{ uri }}
                style={[styles.thumb, { width: thumbSize, height: thumbSize }]}
                contentFit="cover"
              />
            </View>
          );
          return (
            <TouchableOpacity
              key={`${uri}-${index}`}
              onPress={() => onImagePress?.(uri)}
              activeOpacity={0.85}
              disabled={!onImagePress}
            >
              {thumb}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  scrollContent: {
    paddingVertical: 4,
    alignItems: "center",
  },
  thumbWrapper: {
    overflow: "hidden",
  },
  thumb: {
    borderRadius: 10,
  },
});
