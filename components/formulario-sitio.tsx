import { URL_TERMINOS_CONDICIONES } from "@/constants/const";
import { useColors } from "@/hooks/use-colors";
import { useLocations } from "@/hooks/use-locations";
import type {
  InsertSitioRelevante,
  SitioRelevanteAdmin,
} from "@/hooks/use-sitios-admin";
import { useTiposSitio } from "@/hooks/use-tipos-sitio";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface FormularioSitioProps {
  mode?: "create" | "edit";
  sitioInicial?: SitioRelevanteAdmin;
  isAdmin?: boolean;
  embedded?: boolean;
  onSubmit?: (input: InsertSitioRelevante) => Promise<void>;
  onUpdate?: (
    id: number,
    input: InsertSitioRelevante,
    estado?: "creado" | "en_revision" | "aceptado",
  ) => Promise<void>;
  onSuccess?: () => void;
}

export function FormularioSitio({
  mode = "create",
  sitioInicial,
  isAdmin = false,
  embedded = false,
  onSubmit,
  onUpdate,
  onSuccess,
}: FormularioSitioProps) {
  const colors = useColors();
  const { tipos } = useTiposSitio();
  const { provincias, municipios, fetchMunicipios } = useLocations();
  const [nombre, setNombre] = useState(sitioInicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(
    sitioInicial?.descripcion ?? "",
  );
  const [localizacion, setLocalizacion] = useState(
    sitioInicial?.localizacion ?? "",
  );
  const [direccion, setDireccion] = useState(sitioInicial?.direccion ?? "");
  const [telefono, setTelefono] = useState(
    sitioInicial?.telefono?.toString() ?? "",
  );
  const [imagenes, setImagenes] = useState(sitioInicial?.imagenes ?? "");
  const [tipoSitioId, setTipoSitioId] = useState<number | null>(
    sitioInicial?.tipo_sitio_id ?? null,
  );
  const [provinciaId, setProvinciaId] = useState<string | null>(
    sitioInicial?.provincia_id ?? null,
  );
  const [municipioId, setMunicipioId] = useState<string | null>(
    sitioInicial?.municipio_id ?? null,
  );
  const [estadoSuscripcion, setEstadoSuscripcion] = useState<
    "creado" | "en_revision" | "aceptado"
  >(sitioInicial?.estado_suscripcion ?? "creado");
  const [loading, setLoading] = useState(false);
  const [showTipoPicker, setShowTipoPicker] = useState(false);
  const [showProvinciaPicker, setShowProvinciaPicker] = useState(false);
  const [showMunicipioPicker, setShowMunicipioPicker] = useState(false);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  useEffect(() => {
    if (sitioInicial) {
      setNombre(sitioInicial.nombre);
      setDescripcion(sitioInicial.descripcion ?? "");
      setLocalizacion(sitioInicial.localizacion ?? "");
      setDireccion(sitioInicial.direccion ?? "");
      setTelefono(sitioInicial.telefono?.toString() ?? "");
      setImagenes(sitioInicial.imagenes ?? "");
      setTipoSitioId(sitioInicial.tipo_sitio_id);
      setProvinciaId(sitioInicial.provincia_id);
      setMunicipioId(sitioInicial.municipio_id);
      setEstadoSuscripcion(sitioInicial.estado_suscripcion);
      // Cargar municipios si hay provincia seleccionada
      if (sitioInicial.provincia_id) {
        fetchMunicipios(sitioInicial.provincia_id);
      }
    }
  }, [sitioInicial, fetchMunicipios]);

  useEffect(() => {
    if (provinciaId) {
      fetchMunicipios(provinciaId);
    } else {
      setMunicipioId(null);
    }
  }, [provinciaId, fetchMunicipios]);

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }
    setLoading(true);
    try {
      if (mode === "create" && !aceptoTerminos) {
        Alert.alert(
          "Error",
          "Debes aceptar los términos y condiciones para registrar un sitio.",
        );
        setLoading(false);
        return;
      }
      const input: InsertSitioRelevante = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        localizacion: localizacion.trim() || null,
        direccion: direccion.trim() || null,
        telefono: telefono.trim()
          ? parseInt(telefono.replace(/\D/g, ""), 10) || null
          : null,
        imagenes: isAdmin
          ? imagenes.trim() || null
          : (sitioInicial?.imagenes ?? null),
        ofertas: null,
        tipo_sitio_id: tipoSitioId ?? null,
        provincia_id: provinciaId ?? null,
        municipio_id: municipioId ?? null,
        acepto_terminos: mode === "create" ? aceptoTerminos : undefined,
      };
      if (mode === "edit" && sitioInicial && onUpdate) {
        await onUpdate(
          sitioInicial.id,
          input,
          isAdmin ? estadoSuscripcion : undefined,
        );
        Alert.alert("Éxito", "Los cambios han sido guardados.");
      } else if (mode === "create" && onSubmit) {
        await onSubmit(input);
        setNombre("");
        setDescripcion("");
        setLocalizacion("");
        setDireccion("");
        setTelefono("");
        setImagenes("");
        setTipoSitioId(null);
        setProvinciaId(null);
        setMunicipioId(null);
        setAceptoTerminos(false);
        Alert.alert(
          "Éxito",
          "Tu sitio ha sido registrado. El administrador lo revisará.",
        );
      }
      onSuccess?.();
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "No se pudo guardar el sitio",
      );
    } finally {
      setLoading(false);
    }
  };

  const tipoSeleccionado = tipos.find((t) => t.id === tipoSitioId);
  const provinciaSeleccionada = provincias.find((p) => p.id === provinciaId);
  const municipioSeleccionado = municipios.find((m) => m.id === municipioId);

  const content = (
    <>
      {mode === "create" && (
        <View
          style={[
            styles.terminosBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => Linking.openURL(URL_TERMINOS_CONDICIONES)}
            style={styles.terminosLink}
          >
            <Text style={[styles.terminosLinkText, { color: colors.primary }]}>
              Leer Términos y Condiciones
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAceptoTerminos(!aceptoTerminos)}
            style={styles.terminosCheckRow}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: colors.border },
                aceptoTerminos && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              {aceptoTerminos && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <View style={{ flexDirection: "column" }}>
              <Text
                style={[
                  styles.terminosCheckLabel,
                  { color: colors.foreground },
                ]}
              >
                Acepto los términos y condiciones
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
      <Text style={[styles.label, { color: colors.muted }]}>Nombre *</Text>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre del negocio o sitio"
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.foreground,
            borderColor: colors.border,
          },
        ]}
      />
      <Text style={[styles.label, { color: colors.muted }]}>
        Ubicación (coordenadas o referencia)
      </Text>
      <TextInput
        value={localizacion}
        onChangeText={setLocalizacion}
        placeholder="Ej: 23.1136,-82.3666 o cerca del parque central"
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.foreground,
            borderColor: colors.border,
          },
        ]}
      />
      <Text style={[styles.label, { color: colors.muted }]}>Dirección</Text>
      <TextInput
        value={direccion}
        onChangeText={setDireccion}
        placeholder="Calle, número, etc."
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.foreground,
            borderColor: colors.border,
          },
        ]}
      />
      <Text style={[styles.label, { color: colors.muted }]}>Teléfono</Text>
      <TextInput
        value={telefono}
        onChangeText={setTelefono}
        placeholder="Ej: 52708602"
        placeholderTextColor={colors.muted}
        keyboardType="phone-pad"
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.foreground,
            borderColor: colors.border,
          },
        ]}
      />
      <Text style={[styles.label, { color: colors.muted }]}>Descripción</Text>
      <TextInput
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Breve descripción del sitio"
        placeholderTextColor={colors.muted}
        multiline
        numberOfLines={3}
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: colors.surface,
            color: colors.foreground,
            borderColor: colors.border,
          },
        ]}
      />
      <Text style={[styles.label, { color: colors.muted }]}>Tipo de sitio</Text>
      <TouchableOpacity
        onPress={() => setShowTipoPicker(true)}
        style={[
          styles.combobox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text
          style={[
            styles.comboboxText,
            { color: tipoSeleccionado ? colors.foreground : colors.muted },
          ]}
        >
          {tipoSeleccionado ? tipoSeleccionado.tipo : "Selecciona un tipo"}
        </Text>
        <Text style={[styles.comboboxArrow, { color: colors.muted }]}>▼</Text>
      </TouchableOpacity>
      <Modal
        visible={showTipoPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTipoPicker(false)}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowTipoPicker(false)}
        >
          <Pressable
            style={[
              styles.pickerContent,
              { backgroundColor: colors.background },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
                Seleccionar tipo
              </Text>
              <TouchableOpacity onPress={() => setShowTipoPicker(false)}>
                <Text style={[styles.pickerClose, { color: colors.primary }]}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                onPress={() => {
                  setTipoSitioId(null);
                  setShowTipoPicker(false);
                }}
                style={[
                  styles.pickerOption,
                  { borderBottomColor: colors.border },
                  tipoSitioId === null && { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    { color: colors.foreground },
                  ]}
                >
                  Ninguno
                </Text>
              </TouchableOpacity>
              {tipos.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => {
                    setTipoSitioId(t.id);
                    setShowTipoPicker(false);
                  }}
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: colors.border },
                    tipoSitioId === t.id && { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      {
                        color:
                          tipoSitioId === t.id
                            ? colors.primary
                            : colors.foreground,
                      },
                    ]}
                  >
                    {t.tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <Text style={[styles.label, { color: colors.muted }]}>Provincia</Text>
      <TouchableOpacity
        onPress={() => setShowProvinciaPicker(true)}
        style={[
          styles.combobox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text
          style={[
            styles.comboboxText,
            { color: provinciaSeleccionada ? colors.foreground : colors.muted },
          ]}
        >
          {provinciaSeleccionada
            ? provinciaSeleccionada.nombre
            : "Selecciona una provincia"}
        </Text>
        <Text style={[styles.comboboxArrow, { color: colors.muted }]}>▼</Text>
      </TouchableOpacity>
      <Modal
        visible={showProvinciaPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProvinciaPicker(false)}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowProvinciaPicker(false)}
        >
          <Pressable
            style={[
              styles.pickerContent,
              { backgroundColor: colors.background },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
                Seleccionar provincia
              </Text>
              <TouchableOpacity onPress={() => setShowProvinciaPicker(false)}>
                <Text style={[styles.pickerClose, { color: colors.primary }]}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                onPress={() => {
                  setProvinciaId(null);
                  setMunicipioId(null);
                  setShowProvinciaPicker(false);
                }}
                style={[
                  styles.pickerOption,
                  { borderBottomColor: colors.border },
                  provinciaId === null && { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    { color: colors.foreground },
                  ]}
                >
                  Ninguna
                </Text>
              </TouchableOpacity>
              {provincias.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    setProvinciaId(p.id);
                    setMunicipioId(null);
                    setShowProvinciaPicker(false);
                  }}
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: colors.border },
                    provinciaId === p.id && { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      {
                        color:
                          provinciaId === p.id
                            ? colors.primary
                            : colors.foreground,
                      },
                    ]}
                  >
                    {p.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Text style={[styles.label, { color: colors.muted }]}>Municipio</Text>
      <TouchableOpacity
        onPress={() => provinciaId && setShowMunicipioPicker(true)}
        disabled={!provinciaId}
        style={[
          styles.combobox,
          { backgroundColor: colors.surface, borderColor: colors.border },
          !provinciaId && { opacity: 0.6 },
        ]}
      >
        <Text
          style={[
            styles.comboboxText,
            { color: municipioSeleccionado ? colors.foreground : colors.muted },
          ]}
        >
          {municipioSeleccionado
            ? municipioSeleccionado.nombre
            : provinciaId
              ? "Selecciona un municipio"
              : "Primero selecciona una provincia"}
        </Text>
        <Text style={[styles.comboboxArrow, { color: colors.muted }]}>▼</Text>
      </TouchableOpacity>
      <Modal
        visible={showMunicipioPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMunicipioPicker(false)}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowMunicipioPicker(false)}
        >
          <Pressable
            style={[
              styles.pickerContent,
              { backgroundColor: colors.background },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
                Seleccionar municipio
              </Text>
              <TouchableOpacity onPress={() => setShowMunicipioPicker(false)}>
                <Text style={[styles.pickerClose, { color: colors.primary }]}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                onPress={() => {
                  setMunicipioId(null);
                  setShowMunicipioPicker(false);
                }}
                style={[
                  styles.pickerOption,
                  { borderBottomColor: colors.border },
                  municipioId === null && { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    { color: colors.foreground },
                  ]}
                >
                  Ninguno
                </Text>
              </TouchableOpacity>
              {municipios.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => {
                    setMunicipioId(m.id);
                    setShowMunicipioPicker(false);
                  }}
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: colors.border },
                    municipioId === m.id && { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      {
                        color:
                          municipioId === m.id
                            ? colors.primary
                            : colors.foreground,
                      },
                    ]}
                  >
                    {m.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      {isAdmin && (
        <>
          <Text style={[styles.label, { color: colors.muted }]}>
            Imágenes (URLs separadas por coma)
          </Text>
          <TextInput
            value={imagenes}
            onChangeText={setImagenes}
            placeholder="https://..."
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
          />
        </>
      )}
      {mode === "edit" && isAdmin && (
        <>
          <Text style={[styles.label, { color: colors.muted }]}>Estado</Text>
          <View style={styles.chipRow}>
            {(["creado", "en_revision", "aceptado"] as const).map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => setEstadoSuscripcion(e)}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  estadoSuscripcion === e && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        estadoSuscripcion === e ? "#FFF" : colors.foreground,
                    },
                  ]}
                >
                  {e === "creado"
                    ? "Creado"
                    : e === "en_revision"
                      ? "En revisión"
                      : "Aceptado"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={
          loading ||
          !nombre.trim() ||
          (mode === "create" && !aceptoTerminos)
        }
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          (loading ||
            !nombre.trim() ||
            (mode === "create" && !aceptoTerminos)) &&
            styles.buttonDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === "edit" ? "Guardar cambios" : "Registrar sitio"}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );

  if (embedded) {
    return <View style={styles.embeddedContainer}>{content}</View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  embeddedContainer: { padding: 16 },
  terminosBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  terminosLink: { marginBottom: 12 },
  terminosLinkText: {
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  terminosCheckRow: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxCheck: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  terminosCheckLabel: { fontSize: 15, flex: 1 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  combobox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  comboboxText: { fontSize: 16, flex: 1 },
  comboboxArrow: { fontSize: 12, marginLeft: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: "500" },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContent: {
    width: "80%",
    maxWidth: 400,
    maxHeight: "70%",
    borderRadius: 16,
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  pickerTitle: { fontSize: 18, fontWeight: "bold" },
  pickerClose: { fontSize: 16, fontWeight: "600" },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
  },
  pickerOptionText: { fontSize: 16 },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
