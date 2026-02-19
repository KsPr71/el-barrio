import { FormularioSitio } from "@/components/formulario-sitio";
import { ScreenContainer } from "@/components/screen-container";
import { Separador } from "@/components/separador";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  useSitiosAdmin,
  type SitioRelevanteAdmin,
} from "@/hooks/use-sitios-admin";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useTiposSitio } from "@/hooks/use-tipos-sitio";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ESTADO_LABELS: Record<string, string> = {
  creado: "Creado",
  en_revision: "En revisión",
  aceptado: "Aceptado",
};
const WHATSAPP_NUMERO = "5352708602";
const URL_WHATSAPP = `https://wa.me/${WHATSAPP_NUMERO}`;

const handleEnviarWhatsAppObservaciones = () => {
  const mensaje =
    "Hola, me pongo en contacto para completar el registro de mi negocio llamado..."; // Tu mensaje aquí
  const mensajeCodificado = encodeURIComponent(mensaje);
  const urlWhatsApp = `${URL_WHATSAPP}?text=${mensajeCodificado}`;

  Linking.openURL(urlWhatsApp);
};

function formatTiempoSuscripcion(fechaAceptado: string | null): string | null {
  if (!fechaAceptado) return null;
  const fin = new Date(fechaAceptado);
  fin.setFullYear(fin.getFullYear() + 1);
  const ahora = new Date();
  if (ahora >= fin) return "Vencido";
  const ms = fin.getTime() - ahora.getTime();
  const meses = Math.ceil(ms / (30 * 24 * 60 * 60 * 1000));
  if (meses >= 12) return `${Math.floor(meses / 12)} año(s)`;
  return `${meses} mes(es)`;
}

function SitioAdminRow({
  sitio,
  onPress,
  isAdmin,
}: {
  sitio: SitioRelevanteAdmin;
  onPress: () => void;
  isAdmin: boolean;
}) {
  const colors = useColors();
  const { tipos } = useTiposSitio();
  const tipo = tipos.find((t) => t.id === sitio.tipo_sitio_id);
  const tiempoSuscripcion =
    !isAdmin && sitio.estado_suscripcion === "aceptado"
      ? formatTiempoSuscripcion(sitio.fecha_aceptado)
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.rowMain}>
        <Text
          style={[styles.rowNombre, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {sitio.nombre}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.muted }]}>
          {tipo?.tipo ?? "—"} ·{" "}
          {ESTADO_LABELS[sitio.estado_suscripcion] ?? sitio.estado_suscripcion}
        </Text>
      </View>
      {tiempoSuscripcion && (
        <View
          style={[
            styles.chipSuscripcion,
            {
              backgroundColor:
                tiempoSuscripcion === "Vencido" ? "#dc2626" : colors.primary,
            },
          ]}
        >
          <Text style={styles.chipSuscripcionText}>
            {tiempoSuscripcion === "Vencido"
              ? "Suscripción vencida"
              : `Vence en ${tiempoSuscripcion}`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function AdministracionScreen() {
  const colors = useColors();
  const {
    user,
    loading: authLoading,
    error: authError,
    isAdmin,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  } = useSupabaseAuth();
  const {
    sitios,
    loading: sitiosLoading,
    error: sitiosError,
    crearSitio,
    actualizarSitio,
  } = useSitiosAdmin();
  const [authMode, setAuthMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [sitioEditar, setSitioEditar] = useState<SitioRelevanteAdmin | null>(
    null,
  );
  const [busqueda, setBusqueda] = useState("");

  const { tipos } = useTiposSitio();

  const sitiosFiltrados = useMemo(() => {
    if (!isAdmin || !busqueda.trim()) return sitios;
    const q = busqueda.trim().toLowerCase();
    return sitios.filter(
      (s) =>
        s.nombre.toLowerCase().includes(q) ||
        (s.direccion?.toLowerCase().includes(q) ?? false) ||
        (s.descripcion?.toLowerCase().includes(q) ?? false),
    );
  }, [sitios, busqueda, isAdmin]);

  const sitiosAgrupados = useMemo(() => {
    if (!isAdmin) return null;
    const grupos: Record<number | "sin_tipo", SitioRelevanteAdmin[]> = {
      sin_tipo: [],
    };
    for (const s of sitiosFiltrados) {
      const key = s.tipo_sitio_id ?? "sin_tipo";
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(s);
    }
    return grupos;
  }, [sitiosFiltrados, isAdmin]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Ingresa email y contraseña");
      return;
    }
    setAuthSubmitting(true);
    try {
      if (authMode === "in") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch {
      // error ya en authError
    } finally {
      setAuthSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Cargando...
        </Text>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="flex-1">
        <ScrollView
          contentContainerStyle={styles.authContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.authTitle, { color: colors.foreground }]}>
            Administración
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.muted }]}>
            Inicia sesión o regístrate para gestionar sitios relevantes.
          </Text>
          <View
            style={[
              styles.authCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Correo electrónico"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
            />
            {authError ? (
              <Text style={[styles.errorText, { color: "#dc2626" }]}>
                {authError}
              </Text>
            ) : null}
            <TouchableOpacity
              onPress={handleAuth}
              disabled={authSubmitting}
              style={[
                styles.authButton,
                { backgroundColor: colors.primary },
                authSubmitting && styles.buttonDisabled,
              ]}
            >
              {authSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {authMode === "in" ? "Iniciar sesión" : "Registrarse"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAuthMode(authMode === "in" ? "up" : "in")}
            >
              <Text style={[styles.switchAuth, { color: colors.primary }]}>
                {authMode === "in"
                  ? "¿No tienes cuenta? Regístrate"
                  : "¿Ya tienes cuenta? Inicia sesión"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.mainContainer}>
        <View style={styles.header}>
          <View
            style={{ flexDirection: "row", gap: 20, alignItems: "flex-start" }}
          >
            <View>
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.foreground,
                    alignSelf: "flex-start",
                    marginBottom: 10,
                  },
                ]}
              >
                Administración
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              padding: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontWeight: "bold",
                marginBottom: 5,
              }}
            >
              {" "}
              Usuario
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {user?.email} {isAdmin ? "(Admin)" : "(Usuario)"}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 8,
                marginBottom: 5,
              }}
            >
              <TouchableOpacity
                onPress={signOut}
                style={[
                  styles.logoutBtn,
                  {
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 10,
                    alignSelf: "flex-end",
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <View
                  style={{
                    padding: 2,
                    borderRadius: 30,
                    backgroundColor: colors.secondary,
                  }}
                >
                  <IconSymbol name="xmark" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.logoutBtnText, { color: "#FFF" }]}>
                  Cerrar sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <Separador />
        </View>

        {isAdmin && (
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.searchIcon, { color: colors.muted }]}>🔍</Text>
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar por nombre, dirección o descripción..."
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.foreground }]}
            />
          </View>
        )}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {isAdmin ? "Todos los sitios" : "Mis sitios"}
        </Text>
        {sitiosError && (
          <Text style={[styles.errorText, { color: "#dc2626" }]}>
            {sitiosError}
          </Text>
        )}
        {sitiosLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : sitios.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            {isAdmin
              ? "No hay sitios registrados."
              : "Aún no has añadido ningún sitio."}
          </Text>
        ) : sitiosFiltrados.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No hay resultados para la búsqueda.
          </Text>
        ) : isAdmin && sitiosAgrupados ? (
          Object.entries(sitiosAgrupados).map(([key, items]) => {
            if (items.length === 0) return null;
            const tipoId = key === "sin_tipo" ? null : Number(key);
            const tipo =
              tipoId != null ? tipos.find((t) => t.id === tipoId) : null;
            const label = tipo?.tipo ?? "Sin categoría";
            return (
              <View key={key} style={styles.categoryGroup}>
                <Text style={[styles.categoryLabel, { color: colors.primary }]}>
                  {label}
                </Text>
                {items.map((s) => (
                  <SitioAdminRow
                    key={s.id}
                    sitio={s}
                    isAdmin={isAdmin}
                    onPress={() => {
                      setSitioEditar(s);
                      setModalMode("edit");
                    }}
                  />
                ))}
              </View>
            );
          })
        ) : (
          sitiosFiltrados.map((s) => (
            <SitioAdminRow
              key={s.id}
              sitio={s}
              isAdmin={isAdmin}
              onPress={() => {
                setSitioEditar(s);
                setModalMode("edit");
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Botón flotante para añadir sitio */}
      <TouchableOpacity
        onPress={() => {
          setSitioEditar(null);
          setModalMode("create");
        }}
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Boton de whatssapp */}
      <TouchableOpacity
        onPress={handleEnviarWhatsAppObservaciones}
        style={[
          styles.fabws,
          { backgroundColor: "#25d366", padding: 10, marginTop: 15 },
        ]}
      >
        <Image
          source={require("@/assets/images/ws.png")}
          style={{ width: 40, height: 40 }}
        ></Image>
      </TouchableOpacity>

      {/* Modal: crear o editar sitio */}
      <Modal
        visible={modalMode !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setModalMode(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {modalMode === "create" ? "Nuevo sitio" : "Editar sitio"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalMode(null)}
                style={[styles.modalClose, { borderColor: colors.border }]}
              >
                <Text
                  style={[styles.modalCloseText, { color: colors.foreground }]}
                >
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalForm}
              contentContainerStyle={styles.modalFormContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              <FormularioSitio
                mode={modalMode ?? "create"}
                sitioInicial={
                  modalMode === "edit" ? (sitioEditar ?? undefined) : undefined
                }
                isAdmin={isAdmin}
                embedded={true}
                onSubmit={
                  modalMode === "create"
                    ? async (input) => {
                        await crearSitio(input);
                        setModalMode(null);
                      }
                    : undefined
                }
                onUpdate={
                  modalMode === "edit" && sitioEditar
                    ? async (id, input, estado) => {
                        await actualizarSitio(id, input, estado);
                        setModalMode(null);
                        setSitioEditar(null);
                      }
                    : undefined
                }
                onSuccess={() => setModalMode(null)}
              />
              <View
                style={{
                  paddingHorizontal: 5,
                  paddingBottom: 10,
                  backgroundColor: colors.surface,
                  marginLeft: 20,
                  marginRight: 20,
                  borderRadius: 20,
                  elevation: 5,
                  //flexDirection: "row",
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.surface,
                    padding: 10,
                    borderRadius: 20,
                    //marginRight: 10,
                    flexDirection: "row",
                    gap: 10,
                  }}
                >
                  <IconSymbol
                    name="info"
                    color={colors.primary}
                    style={{ fontWeight: "bold" }}
                  />

                  <Text style={{ color: colors.primary }}>INFORMACION</Text>
                </View>

                <View
                  style={{
                    flexDirection: "column",
                    marginHorizontal: 10,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text>
                    Al terminar debe contactar al Administrador por Whatssap
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  authContainer: { padding: 20, paddingBottom: 40 },
  authTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  authSubtitle: { fontSize: 15, marginBottom: 24 },
  authCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  authButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  switchAuth: { marginTop: 16, textAlign: "center", fontSize: 14 },
  errorText: { fontSize: 13, marginBottom: 12 },
  loadingText: { marginTop: 12 },
  mainContainer: { padding: 20, paddingBottom: 100 },
  header: {
    flexDirection: "column",
    justifyContent: "space-between",
    //alignItems: "flex-start",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  subtitle: { fontSize: 14, marginTop: 4 },
  logoutBtn: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  logoutBtnText: { fontSize: 14, fontWeight: "500" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  categoryGroup: { marginBottom: 20 },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  fab: {
    position: "absolute",
    bottom: 50,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabws: {
    position: "absolute",
    bottom: 50,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { color: "#FFF", fontSize: 28, fontWeight: "300", lineHeight: 32 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  modalClose: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalCloseText: { fontSize: 14 },
  modalForm: { flex: 1 },
  modalFormContent: { paddingBottom: 32 },
  center: { paddingVertical: 24, alignItems: "center" },
  emptyText: { fontSize: 14 },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowMain: { marginBottom: 8 },
  rowNombre: { fontSize: 16, fontWeight: "600" },
  rowMeta: { fontSize: 13 },
  chipSuscripcion: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  chipSuscripcionText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  estadoActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  estadoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    lineHeight: 18,
  },
  estadoBtnText: { fontSize: 12, fontWeight: "500" },
});
