import { IconImage } from "@/components/ui/icon-image";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StyleSheet, Text, View } from "react-native";

function CustomDrawerContent(props: any) {
  const colors = useColors();
  const pathname = usePathname();

  const isDetallesActive = pathname.includes("/detalles");
  const isProfileActive = pathname.includes("/profile");

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
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <Text style={[styles.drawerTitle, { color: "#FFFFFF" }]}>
              Por el Barrio
            </Text>
            <Text style={[styles.drawerSubtitle, { color: "#FFFFFF" }]}>
              Menú Principal
            </Text>
          </View>

          <IconImage source={require("@/assets/images/icon.png")} />
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
        label="Detalles"
        icon={({ color, size }) => (
          <IconSymbol name="paperplane.fill" size={size} color={color} />
        )}
        onPress={() => {
          props.navigation.closeDrawer();
          requestAnimationFrame(() => {
            router.push("/(drawer)/(tabs)/detalles");
          });
        }}
        activeTintColor={colors.primary}
        inactiveTintColor={colors.foreground}
        activeBackgroundColor={colors.surface}
        focused={isDetallesActive}
      />
      <DrawerItem
        label="Perfil"
        icon={({ color, size }) => (
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={size} color={color} />
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

      <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.versionText, { color: colors.muted }]}>
          Versión 1.0.0
        </Text>
      </View>
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
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Inicio",
          title: "Por el Barrio",
          drawerIcon: ({ color, size }) => (
            <IconSymbol name="house.fill" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
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
  drawerFooter: {
    padding: 16,
    marginTop: 20,
    borderTopWidth: 1,
  },
  versionText: {
    fontSize: 12,
    textAlign: "center",
  },
});
