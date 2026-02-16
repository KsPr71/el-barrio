import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import {
  useLocations,
  type Municipio,
  type Provincia,
} from "@/hooks/use-locations";
import { useProfile, type ProfileData } from "@/hooks/use-profile";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: windowHeight } = Dimensions.get("window");
const MODAL_HEIGHT = Math.min(windowHeight * 0.88, 640);

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { profile, loading, saving, error, saveProfile } = useProfile();
  const {
    provincias,
    municipios,
    loadingProvincias,
    loadingMunicipios,
    error: locationsError,
    fetchProvincias,
    fetchMunicipios,
  } = useLocations();

  const [form, setForm] = useState<ProfileData>(profile);
  const [touched, setTouched] = useState(false);
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [municipalityModalVisible, setMunicipalityModalVisible] =
    useState(false);

  const selectedProvinceId =
    provincias.find((p) => p.nombre === form.province)?.id ?? null;

  useEffect(() => {
    if (!loading) setForm(profile);
  }, [loading, profile]);

  useEffect(() => {
    if (selectedProvinceId) {
      fetchMunicipios(selectedProvinceId);
    } else {
      fetchMunicipios(null);
    }
  }, [selectedProvinceId, fetchMunicipios]);

  const updateForm = useCallback((field: keyof ProfileData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched(true);
  }, []);

  const handleSelectProvince = useCallback(
    (p: Provincia) => {
      updateForm("province", p.nombre);
      updateForm("municipality", "");
      setProvinceModalVisible(false);
    },
    [updateForm],
  );

  const handleSelectMunicipality = useCallback(
    (m: Municipio) => {
      updateForm("municipality", m.nombre);
      setMunicipalityModalVisible(false);
    },
    [updateForm],
  );

  const handleSave = useCallback(async () => {
    try {
      await saveProfile(form);
      setTouched(false);
      Alert.alert("Guardado", "Tu perfil se ha actualizado correctamente.");
    } catch {
      Alert.alert("Error", error ?? "No se pudo guardar el perfil.");
    }
  }, [form, saveProfile, error]);

  const handleLogout = useCallback(() => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: logout },
    ]);
  }, [logout]);

  const settingsOptions = [
    { id: 1, title: "Notificaciones", icon: "paperplane.fill" as const },
    { id: 2, title: "Configuración", icon: "chevron.right" as const },
    { id: 3, title: "Ayuda", icon: "house.fill" as const },
  ];

  const inputStyle = {
    backgroundColor: colors.background,
    borderColor: colors.border,
    color: colors.foreground,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  };

  const selectorStyle = {
    ...inputStyle,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-muted">Cargando perfil...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="p-6 gap-6">
            <View className="items-center gap-4 mb-2">
              <View
                className="w-24 h-24 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text
                  className="text-4xl font-bold"
                  style={{ color: "#FFFFFF" }}
                >
                  {(form.name || user?.name || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">
                  {form.name || user?.name || "Usuario"}
                </Text>
                <Text className="text-base text-muted">
                  {form.email || user?.email || "—"}
                </Text>
              </View>
            </View>

            <View className="bg-surface rounded-2xl p-5 shadow-sm border border-border">
              <Text className="text-lg font-semibold text-primary mb-4">
                Información personal
              </Text>
              <View className="gap-4">
                <View>
                  <Text className="text-xs text-muted mb-1.5">Nombre</Text>
                  <TextInput
                    value={form.name}
                    onChangeText={(v) => updateForm("name", v)}
                    placeholder="Tu nombre"
                    placeholderTextColor={colors.muted}
                    style={inputStyle}
                    autoCapitalize="words"
                  />
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1.5">
                    Correo electrónico
                  </Text>
                  <TextInput
                    value={form.email}
                    onChangeText={(v) => updateForm("email", v)}
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor={colors.muted}
                    style={inputStyle}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text className="text-xs text-muted mb-1.5">
                    Provincia de interés
                  </Text>
                  {locationsError && (
                    <View
                      className="mb-2 rounded-xl p-3 flex-row items-center justify-between"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <Text
                        className="flex-1 text-sm"
                        style={{ color: colors.foreground }}
                        numberOfLines={2}
                      >
                        {locationsError}
                      </Text>
                      <TouchableOpacity
                        onPress={() => fetchProvincias()}
                        className="ml-2 py-2 px-3 rounded-lg"
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
                  )}
                  {!locationsError &&
                    !loadingProvincias &&
                    provincias.length === 0 && (
                      <Text
                        className="text-xs mb-2"
                        style={{ color: colors.muted }}
                      >
                        No hay provincias. Ejecuta la migración en Supabase e
                        inserta datos en la tabla provincia.
                      </Text>
                    )}
                  <TouchableOpacity
                    onPress={() => {
                      setProvinceModalVisible(true);
                      if (provincias.length === 0 && !loadingProvincias) {
                        fetchProvincias();
                      }
                    }}
                    style={selectorStyle}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: form.province ? colors.foreground : colors.muted,
                        fontSize: 16,
                      }}
                    >
                      {form.province || "Seleccionar provincia"}
                    </Text>
                    {loadingProvincias ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <IconSymbol
                        name="chevron.down"
                        size={18}
                        color={colors.muted}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                <View>
                  <Text className="text-xs text-muted mb-1.5">
                    Municipio de interés
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      selectedProvinceId && setMunicipalityModalVisible(true)
                    }
                    disabled={!selectedProvinceId}
                    style={[
                      selectorStyle,
                      !selectedProvinceId && { opacity: 0.6 },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: form.municipality
                          ? colors.foreground
                          : colors.muted,
                        fontSize: 16,
                      }}
                    >
                      {form.municipality ||
                        (selectedProvinceId
                          ? "Seleccionar municipio"
                          : "Primero elige una provincia")}
                    </Text>
                    {loadingMunicipios && selectedProvinceId ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <IconSymbol
                        name="chevron.down"
                        size={18}
                        color={colors.muted}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              {touched && (
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="mt-4 rounded-xl py-3 items-center active:opacity-80"
                  style={{ backgroundColor: colors.primary }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      className="text-base font-semibold"
                      style={{ color: "#FFFFFF" }}
                    >
                      Guardar cambios
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {user && (
              <TouchableOpacity
                onPress={handleLogout}
                className="rounded-full py-4 items-center active:opacity-80"
                style={{ backgroundColor: colors.primary }}
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: "#FFFFFF" }}
                >
                  Cerrar sesión
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={provinceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProvinceModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onPress={() => setProvinceModalVisible(false)}
        >
          <View
            className="rounded-t-3xl overflow-hidden"
            style={{
              backgroundColor: colors.surface,
              height: MODAL_HEIGHT,
              paddingBottom: insets.bottom + 8,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View className="pt-3 pb-2">
              <View
                className="self-center w-10 h-1 rounded-full"
                style={{ backgroundColor: colors.border }}
              />
            </View>
            <View className="flex-row items-center justify-between px-5 pb-3">
              <Text
                className="text-xl font-semibold"
                style={{ color: colors.foreground }}
              >
                Elegir provincia
              </Text>
              <TouchableOpacity
                onPress={() => setProvinceModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="p-2 -mr-2 rounded-full active:opacity-70"
                style={{ backgroundColor: colors.surface }}
              >
                <IconSymbol name="xmark" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              className="flex-1 px-3"
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
            >
              {loadingProvincias ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    className="text-sm mt-3"
                    style={{ color: colors.muted }}
                  >
                    Cargando provincias...
                  </Text>
                </View>
              ) : provincias.length === 0 ? (
                <View className="py-12 items-center">
                  <Text
                    className="text-base text-center"
                    style={{ color: colors.muted }}
                  >
                    No hay provincias disponibles.
                  </Text>
                </View>
              ) : (
                provincias.map((p) => {
                  const isSelected = form.province === p.nombre;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => handleSelectProvince(p)}
                      activeOpacity={0.7}
                      className="flex-row items-center justify-between py-4 px-4 rounded-xl mb-1"
                    >
                      <Text
                        className="text-base flex-1"
                        style={{
                          color: isSelected
                            ? colors.primary
                            : colors.foreground,
                          fontWeight: isSelected ? "600" : "400",
                        }}
                      >
                        {p.nombre}
                      </Text>
                      {isSelected ? (
                        <IconSymbol
                          name="checkmark.circle.fill"
                          size={22}
                          color={colors.primary}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={municipalityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMunicipalityModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onPress={() => setMunicipalityModalVisible(false)}
        >
          <View
            className="rounded-t-3xl overflow-hidden"
            style={{
              backgroundColor: colors.surface,
              height: MODAL_HEIGHT,
              paddingBottom: insets.bottom + 8,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View className="pt-3 pb-2">
              <View
                className="self-center w-10 h-1 rounded-full"
                style={{ backgroundColor: colors.border }}
              />
            </View>
            <View className="flex-row items-center justify-between px-5 pb-3">
              <Text
                className="text-xl font-semibold"
                style={{ color: colors.foreground }}
              >
                Elegir municipio
              </Text>
              <TouchableOpacity
                onPress={() => setMunicipalityModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="p-2 -mr-2 rounded-full active:opacity-70"
                style={{ backgroundColor: colors.surface }}
              >
                <IconSymbol name="xmark" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              className="flex-1 px-3"
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
            >
              {loadingMunicipios ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    className="text-sm mt-3"
                    style={{ color: colors.muted }}
                  >
                    Cargando municipios...
                  </Text>
                </View>
              ) : municipios.length === 0 ? (
                <View className="py-12 items-center">
                  <Text
                    className="text-base text-center"
                    style={{ color: colors.muted }}
                  >
                    No hay municipios en esta provincia.
                  </Text>
                </View>
              ) : (
                municipios.map((m) => {
                  const isSelected = form.municipality === m.nombre;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => handleSelectMunicipality(m)}
                      activeOpacity={0.7}
                      className="flex-row items-center justify-between py-4 px-4 rounded-xl mb-1"
                    >
                      <Text
                        className="text-base flex-1"
                        style={{
                          color: isSelected
                            ? colors.primary
                            : colors.foreground,
                          fontWeight: isSelected ? "600" : "400",
                        }}
                      >
                        {m.nombre}
                      </Text>
                      {isSelected ? (
                        <IconSymbol
                          name="checkmark.circle.fill"
                          size={22}
                          color={colors.primary}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}
