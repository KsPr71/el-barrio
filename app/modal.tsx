import { ScreenContainer } from "@/components/screen-container";
import { IconImage } from "@/components/ui/icon-image";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { router } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ModalScreen() {
  const colors = useColors();

  return (
    <ScreenContainer
      edges={["top", "left", "right", "bottom"]}
      className="flex-1"
    >
      <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Acerca de
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.closeButton}
        >
          <IconSymbol name="xmark" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <IconImage
            source={require("@/assets/images/icon.png")}
            style={styles.appIcon}
          />
        </View>
        <Text style={[styles.appName, { color: colors.foreground }]}>
          Por el Barrio
        </Text>

        <Text style={[styles.purpose, { color: colors.muted }]}>
          Por el Barrio te permite descubrir y conectar con los negocios y
          lugares destacados de tu comunidad. Encuentra sitios de interés,
          opiniones y toda la información que necesitas cerca de ti.
        </Text>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            Desarrollada por
          </Text>

          <Image
            source={require("@/assets/images/novadev.png")}
            style={styles.novaDevImage}
            resizeMode="cover"
          />
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.devLine, { color: colors.foreground }]}>
            <Text style={{ color: colors.muted }}>Desarrollador</Text>
            {" > "}
            Jorge A. Casares Delgado
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  iconWrap: {
    marginBottom: 12,
  },
  appIcon: {
    width: 88,
    height: 88,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  purpose: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  section: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  novaDevText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  novaDevImage: {
    width: 160,
    height: 36,
  },
  devLine: {
    fontSize: 15,
    fontWeight: "500",
  },
});
