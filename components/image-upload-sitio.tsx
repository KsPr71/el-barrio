import { useColors } from "@/hooks/use-colors";
import { supabase } from "@/lib/supabase";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BUCKET = "todos";

/** Sanitiza el nombre del sitio para usar en rutas de archivo. */
function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "sitio";
}

export interface ImageUploadSitioProps {
  /** Nombre del sitio (para nombrar archivos: nombre-1.webp, nombre-2.webp...) */
  nombreSitio: string;
  /** URLs separadas por coma (valor actual del campo imagenes) */
  value: string;
  /** Se llama con las URLs separadas por coma tras subir */
  onChange: (urlsCommaSeparated: string) => void;
  /** Si true, se deshabilita la selección */
  disabled?: boolean;
}

export function ImageUploadSitio({
  nombreSitio,
  value,
  onChange,
  disabled = false,
}: ImageUploadSitioProps) {
  const colors = useColors();
  const [uploading, setUploading] = useState(false);

  const urls = useMemo(
    () =>
      value
        ? value
            .split(",")
            .map((s) => s.trim())
            .filter((u) => u.startsWith("http"))
        : [],
    [value],
  );

  const pickAndUpload = useCallback(async () => {
    if (!nombreSitio.trim()) {
      Alert.alert("Aviso", "Indica el nombre del sitio antes de subir imágenes.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos",
        "Se necesita acceso a la galería para seleccionar imágenes."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.9,
    });

    if (result.canceled || result.assets.length === 0) return;

    setUploading(true);
    const base = slugify(nombreSitio);
    const newUrls: string[] = [...urls];
    let nextIndex = newUrls.length + 1;

    try {
      for (const asset of result.assets) {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [],
          {
            compress: 0.85,
            format: ImageManipulator.SaveFormat.WEBP,
            base64: true,
          }
        );

        if (!manipulated.base64) throw new Error("No se pudo obtener la imagen");

        const binary = atob(manipulated.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const fileName = `${base}-${nextIndex}.webp`;

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(fileName, bytes.buffer, {
            contentType: "image/webp",
            upsert: true,
          });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
        newUrls.push(publicUrl);
        nextIndex++;
      }

      onChange(newUrls.join(","));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al subir imágenes";
      Alert.alert("Error", msg);
    } finally {
      setUploading(false);
    }
  }, [nombreSitio, urls, onChange]);

  const removeUrl = useCallback(
    (url: string) => {
      const next = urls.filter((u) => u !== url);
      onChange(next.join(","));
    },
    [urls, onChange]
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={pickAndUpload}
        disabled={disabled || uploading}
        style={[
          styles.addButton,
          {
            backgroundColor: colors.primary + "20",
            borderColor: colors.primary,
          },
        ]}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.addButtonText, { color: colors.primary }]}>
            + Añadir imágenes
          </Text>
        )}
      </TouchableOpacity>

      {urls.length > 0 && (
        <View style={styles.previewRow}>
          {urls.map((url) => (
            <View key={url} style={styles.previewWrap}>
              <Image
                source={{ uri: url }}
                style={[styles.preview, { backgroundColor: colors.border }]}
                resizeMode="cover"
              />
              {!disabled && (
                <TouchableOpacity
                  onPress={() => removeUrl(url)}
                  style={[styles.removeBtn, { backgroundColor: colors.background }]}
                >
                  <Text style={[styles.removeText, { color: colors.foreground }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {urls.length > 0 && (
        <Text style={[styles.hint, { color: colors.muted }]}>
          {urls.length} imagen{urls.length !== 1 ? "es" : ""} • Se guardan como
          WebP
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  previewWrap: {
    position: "relative",
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
  },
});
