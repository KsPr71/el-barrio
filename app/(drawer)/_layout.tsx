import { IconImage } from "@/components/ui/icon-image";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function CustomDrawerContent(props: any) {
  const colors = useColors();
  const pathname = usePathname();

  const isDetallesActive = pathname.includes("/detalles");
  const isProfileActive = pathname.includes("/profile");
  const WHATSAPP_NUMERO = "5352708602";
  const URL_WHATSAPP = `https://wa.me/${WHATSAPP_NUMERO}`;

  const handleEnviarWhatsAppObservaciones = () => {
    const mensaje =
      "Hola, me gustaria hacer las siguientes observaciones acerca de la app"; // Tu mensaje aquí
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `${URL_WHATSAPP}?text=${mensajeCodificado}`;

    Linking.openURL(urlWhatsApp);
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.background }}
    >
      <View
        style={[
          styles.drawerHeader,
          {
            backgroundColor: colors.primary,
            borderBottomColor: colors.secondary,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <IconImage source={require("@/assets/images/icon.png")} />
          <View>
            <Text style={[styles.drawerTitle, { color: "#FFFFFF" }]}>
              Por el Barrio
            </Text>
            <Text style={[styles.drawerSubtitle, { color: "#FFFFFF" }]}>
              Menú Principal
            </Text>
          </View>
        </View>
      </View>
      {/* Páginas del drawer con navegación explícita */}
      <DrawerItem
        label="Inicio"
        icon={({ color, size }) => (
          <IconSymbol name="house.fill" size={size} color={color} />
        )}
        onPress={() => {
          // Cerrar el drawer primero
          props.navigation.closeDrawer();
          // Luego navegar usando requestAnimationFrame para asegurar que el drawer se cierre primero
          requestAnimationFrame(() => {
            router.push("/(drawer)/(tabs)" as any);
          });
        }}
        activeTintColor={colors.primary}
        inactiveTintColor={colors.foreground}
        activeBackgroundColor={colors.surface}
        focused={!isDetallesActive && !isProfileActive}
      />

      {/* Páginas adicionales con el mismo estilo que DrawerItemList */}

      <DrawerItem
        label="Perfil"
        icon={({ color, size }) => (
          <IconSymbol
            name="chevron.left.forwardslash.chevron.right"
            size={size}
            color={color}
          />
        )}
        onPress={() => {
          props.navigation.closeDrawer();
          requestAnimationFrame(() => {
            router.push("/(drawer)/(tabs)/profile");
          });
        }}
        activeTintColor={colors.primary}
        inactiveTintColor={colors.foreground}
        activeBackgroundColor={colors.surface}
        focused={isProfileActive}
      />

      {/* Feature Cards */}
      <View style={[styles.featureSection, { borderTopColor: colors.border }]}>
        <Text
          style={[styles.featureSectionTitle, { color: colors.foreground }]}
        >
          Tu comunidad
        </Text>
        <View
          style={[
            styles.featureCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.push("/(drawer)/(tabs)")}>
            <View
              style={[
                styles.featureIconWrap,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.featureEmoji}>🏘️</Text>
            </View>
            <Text style={[styles.featureTitle, { color: colors.primary }]}>
              Tu Comunidad
            </Text>
            <Text style={[styles.featureText, { color: colors.muted }]}>
              Descubre los sitios relevantes de tu barrio y comparte tu opinión.
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.featureCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.featureIconWrap,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Text style={styles.featureEmoji}>💬</Text>
          </View>
          <TouchableOpacity onPress={handleEnviarWhatsAppObservaciones}>
            <Text style={[styles.featureTitle, { color: colors.primary }]}>
              Comunicación
            </Text>
            <Text style={[styles.featureText, { color: colors.muted }]}>
              Envíanos tus ideas, sugerencias y comentarios
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(drawer)/(tabs)/colaboracion")}
        >
          <View
            style={[
              styles.featureCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.featureIconWrap,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.featureEmoji}>🤝</Text>
            </View>
            <Text style={[styles.featureTitle, { color: colors.primary }]}>
              Colaboración
            </Text>
            <Text style={[styles.featureText, { color: colors.muted }]}>
              ¿Deseas reflejar aquí tu negocio o emprendimiento destacado?
              ¡Ponte en contacto con nosotros!
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => {
          router.push("/modal");
          props.navigation.closeDrawer();
        }}
      >
        <View
          style={[
            styles.drawerFooter,
            {
              borderTopColor: colors.border,
              alignContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Image
            source={require("@/assets/images/novadev.png")}
            style={{ width: 150, height: 30 }}
          />
          <Text style={[styles.versionText, { color: colors.muted }]}>
            <Text style={styles.versionText}>Versión 1.0.0</Text>
          </Text>
        </View>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const colors = useColors();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.muted,
        drawerActiveBackgroundColor: colors.surface,
        drawerStyle: {
          backgroundColor: colors.background,
        },
        headerStyle: {
          backgroundColor: colors.primary,
          borderBottomColor: "#FBBF24",
          borderBottomWidth: 3,
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerRight: () => (
          <View style={styles.headerRight}>
            <IconImage
              source={require("@/assets/images/icon.png")}
              style={styles.headerIcon}
            />
          </View>
        ),
      }}
    >
      <IconImage
        source={require("@/assets/images/icon.png")}
        style={{ width: 100, height: 100 }}
      />
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Inicio",
          title: "Por el Barrio",
          headerTitle: "Por el Barrio",
          headerTitleStyle: {
            fontSize: 20,

            //fontWeight: "bold",
          },

          drawerIcon: ({ color, size }) => (
            <View>
              <Text>Inicio</Text>
            </View>
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 16,
    justifyContent: "center",
  },
  headerIcon: {
    width: 60,
    height: 60,
  },
  drawerHeader: {
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 3,
    marginBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomColor: "#FBBF24",
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  featureSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    paddingHorizontal: 12,
  },
  featureSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  featureCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featureEmoji: {
    fontSize: 18,
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
  drawerFooter: {
    padding: 16,
    marginTop: 20,
    borderTopWidth: 1,
  },
  versionText: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "bold",
  },
});
