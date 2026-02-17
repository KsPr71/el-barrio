import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const URL_SOLICITUD =
  "https://djxvosobflwtryenqoou.supabase.co/storage/v1/object/public/descargas/Solicitud.xlsx";
const WHATSAPP_NUMERO = "5352708602";
const URL_WHATSAPP = `https://wa.me/${WHATSAPP_NUMERO}`;

export default function ColaboracionScreen() {
  const colors = useColors();

  const handleDescargarSolicitud = () => {
    Linking.openURL(URL_SOLICITUD);
  };

  const handleEnviarWhatsApp = () => {
    const mensaje =
      "Hola, me gustaria que mi negocio o emprendimiento aparezca en la aplicación. Aqui envio el formulario"; // Tu mensaje aquí
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `${URL_WHATSAPP}?text=${mensajeCodificado}`;

    Linking.openURL(urlWhatsApp);
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Incluye tu negocio
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            ¿Tienes un negocio o emprendimiento y quieres aparecer en Por el
            Barrio? Solicita aquí la inclusión de tu negocio en la aplicación.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.stepLabel, { color: colors.primary }]}>
            Paso 1
          </Text>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            Descarga la solicitud
          </Text>
          <Text style={[styles.stepText, { color: colors.muted }]}>
            Descarga el archivo de solicitud en formato Excel, complétalo con
            los datos de tu negocio y guárdalo en tu dispositivo.
          </Text>
          <TouchableOpacity
            onPress={handleDescargarSolicitud}
            style={[styles.button, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Descargar Solicitud.xlsx</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.stepLabel, { color: colors.primary }]}>
            Paso 2
          </Text>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            Envíala por WhatsApp
          </Text>
          <Text style={[styles.stepText, { color: colors.muted }]}>
            Una vez completada la solicitud, envíala al desarrollador por
            WhatsApp. Te atenderemos lo antes posible.
          </Text>
          <TouchableOpacity
            onPress={handleEnviarWhatsApp}
            style={[styles.button, { backgroundColor: "#25D366" }]}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Abrir WhatsApp</Text>
          </TouchableOpacity>
          <Text style={[styles.hint, { color: colors.muted }]}>
            Número: +53 527 086 02
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
});
