import { EstrellasPuntuacion } from "@/components/estrellas-puntuacion";
import { useProfile } from "@/hooks/use-profile";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";

export interface FormularioOpinionProps {
  sitioId: number;
  onCreateOpinion: (
    sitioId: number,
    calificacion: number,
    comentario: string | null,
    autorTexto: string | null
  ) => Promise<void>;
  onSuccess?: () => void;
}

export function FormularioOpinion({
  sitioId,
  onCreateOpinion,
  onSuccess,
}: FormularioOpinionProps) {
  const colors = useColors();
  const { profile, loading: loadingProfile } = useProfile();
  const [calificacion, setCalificacion] = useState<number>(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const autorDesdePerfil = (profile.name && profile.name.trim()) || (profile.email && profile.email.trim()) || null;
  const puedePublicar = calificacion > 0 && calificacion <= 5 && !!autorDesdePerfil && !loading;

  const handleSubmit = async () => {
    if (calificacion === 0) {
      Alert.alert("Error", "Por favor selecciona una calificación");
      return;
    }

    if (!autorDesdePerfil) {
      Alert.alert(
        "Perfil incompleto",
        "Por favor configura tu nombre en el perfil para poder opinar."
      );
      return;
    }

    setLoading(true);
    try {
      await onCreateOpinion(
        sitioId,
        calificacion,
        comentario.trim() || null,
        autorDesdePerfil
      );
      // Limpiar formulario
      setCalificacion(0);
      setComentario("");
      Alert.alert("Éxito", "Tu opinión ha sido publicada");
      onSuccess?.();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo publicar tu opinión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>
        Escribe tu opinión
      </Text>

      {autorDesdePerfil && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Opinando como
          </Text>
          <Text style={[styles.currentUser, { color: colors.foreground }]}>
            {autorDesdePerfil}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Calificación *
        </Text>
        <View style={{ marginTop: 8 }}>
          <EstrellasPuntuacion
            promedio={calificacion}
            editable
            calificacionSeleccionada={calificacion}
            onCalificacionChange={setCalificacion}
            size={32}
          />
        </View>
        {calificacion === 0 && (
          <Text style={[styles.helperText, { color: colors.muted }]}>
            Selecciona de 1 a 5 estrellas
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Comentario (opcional)
        </Text>
        <TextInput
          value={comentario}
          onChangeText={setComentario}
          placeholder="Escribe tu opinión sobre este sitio..."
          placeholderTextColor={colors.muted}
          style={[
            styles.textArea,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.muted }]}>
          {comentario.length}/500
        </Text>
      </View>

      {!autorDesdePerfil && (
        <View style={[styles.warningBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.warningText, { color: colors.foreground }]}>
            ⚠️ Para publicar una opinión, configura tu nombre en el perfil.
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!puedePublicar}
        style={[
          styles.submitButton,
          {
            backgroundColor: puedePublicar ? colors.primary : colors.muted,
            opacity: puedePublicar ? 1 : 0.6,
          },
        ]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>
            {autorDesdePerfil 
              ? calificacion === 0 
                ? "Selecciona una calificación" 
                : "Publicar opinión"
              : "Configura tu perfil para opinar"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  helper: {
    fontSize: 12,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  warningBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  currentUser: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
