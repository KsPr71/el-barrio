import { IconImage } from "@/components/ui/icon-image";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useLocations } from "@/hooks/use-locations";
import { useProfile } from "@/hooks/use-profile";
import { useSitiosRelevantes } from "@/hooks/use-sitios-relevantes";
import { useTiposSitio } from "@/hooks/use-tipos-sitio";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function CustomDrawerContent(props: any) {
  const colors = useColors();
  const { sitios, loading: loadingSitios } = useSitiosRelevantes();
  const { tipos } = useTiposSitio();
  const { profile } = useProfile();
  const { provincias } = useLocations();

  // Obtener el ID de la provincia del usuario
  const provinciaUsuarioId = useMemo(() => {
    if (!profile.province || provincias.length === 0) return null;
    const provincia = provincias.find((p) => p.nombre === profile.province);
    return provincia?.id ?? null;
  }, [profile.province, provincias]);

  // Filtrar sitios por provincia del usuario
  const sitiosPorProvincia = useMemo(() => {
    if (!provinciaUsuarioId) return sitios;
    return sitios.filter((s) => s.provincia_id === provinciaUsuarioId);
  }, [sitios, provinciaUsuarioId]);

  // Obtener tipos disponibles basados en los sitios filtrados por provincia
  const tiposDisponibles = useMemo(() => {
    const idsPresentes = new Set(
      sitiosPorProvincia
        .map((s) => s.tipo_sitio_id)
        .filter((id): id is number => id != null),
    );
    return tipos.filter((t) => idsPresentes.has(t.id));
  }, [sitiosPorProvincia, tipos]);

  const handleSelectCategoria = (tipoId: number | null) => {
    props.navigation.closeDrawer();
    // Navegar a la pantalla de inicio con el filtro de categoría
    if (tipoId !== null) {
      router.push({
        pathname: "/(drawer)/(tabs)",
        params: { categoriaId: String(tipoId) },
      });
    } else {
      router.push("/(drawer)/(tabs)");
    }
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
      <DrawerItemList {...props} />
      
      {/* Sección de Categorías */}
      <View
        style={[
          styles.categoriasSection,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.categoriasHeader}>
          <IconSymbol
            name="square.grid.2x2.fill"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.categoriasTitle, { color: colors.foreground }]}>
            Categorías disponibles
            {profile.province ? ` en ${profile.province}` : ""}
          </Text>
        </View>
        {loadingSitios ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : tiposDisponibles.length > 0 ? (
          <ScrollView
            style={styles.categoriasScrollView}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => handleSelectCategoria(null)}
              style={[
                styles.categoriaItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoriaText, { color: colors.foreground }]}>
                Todas las categorías
              </Text>
              <IconSymbol
                name="chevron.right"
                size={16}
                color={colors.muted}
              />
            </TouchableOpacity>
            {tiposDisponibles.map((tipo) => (
              <TouchableOpacity
                key={tipo.id}
                onPress={() => handleSelectCategoria(tipo.id)}
                style={[
                  styles.categoriaItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoriaText, { color: colors.foreground }]}>
                  {tipo.tipo}
                </Text>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.muted}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            {profile.province
              ? `No hay categorías disponibles en ${profile.province}`
              : "No hay categorías disponibles"}
          </Text>
        )}
      </View>

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
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 3,
    marginBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  categoriasSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    maxHeight: 300,
  },
  categoriasHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoriasTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoriasScrollView: {
    maxHeight: 250,
  },
  categoriaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoriaText: {
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textAlign: "center",
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
