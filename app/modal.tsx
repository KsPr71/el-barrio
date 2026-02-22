import { ScreenContainer } from "@/components/screen-container";
import { IconImage } from "@/components/ui/icon-image";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useTeam } from "@/hooks/use-team";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ROLE_ORDER = ["Desarrollador", "Diseño", "Beta tester", "Colaborador"];

function groupByRole(
  members: { nombre: string; role: string }[],
): { role: string; members: string[] }[] {
  const map = new Map<string, string[]>();
  for (const m of members) {
    const key = m.role.trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m.nombre);
  }
  const result: { role: string; members: string[] }[] = [];
  for (const role of ROLE_ORDER) {
    const found = Array.from(map.entries()).find(([r]) =>
      r.toLowerCase().includes(role.toLowerCase()),
    );
    if (found) {
      result.push({ role: found[0], members: found[1] });
      map.delete(found[0]);
    }
  }
  map.forEach((members, role) => result.push({ role, members }));
  return result;
}

export default function ModalScreen() {
  const colors = useColors();
  const { members, loading, error } = useTeam();

  const groupedRoles = useMemo(() => groupByRole(members), [members]);

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
        <Text style={[styles.version, { color: colors.muted }]}>
          Versión {Constants.expoConfig?.version ?? "1.0.0"}
        </Text>

        <Text style={[styles.purpose, { color: colors.muted }]}>
          Por el Barrio te permite descubrir y conectar con los negocios y
          lugares destacados de tu comunidad. Encuentra sitios de interés,
          opiniones y toda la información que necesitas cerca de ti.
        </Text>

        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface + "10",
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignContent: "center",
              justifyContent: "center",
              gap: 10,
              paddingBottom: 10,
            }}
          >
            <IconSymbol
              name="person.crop.rectangle.badge.plus.fill"
              size={30}
              color={colors.primary}
            />

            <Text style={styles.headerTitle}>Equipo de Trabajo</Text>
          </View>
          <View
            style={{
              width: "100%",
              height: 1,
              backgroundColor: colors.border,
              marginBottom: 10,
            }}
          ></View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : error ? (
            <Text style={[styles.devLine, { color: colors.muted }]}>
              {error}
            </Text>
          ) : groupedRoles.length > 0 ? (
            <View style={styles.rolesContainer}>
              {groupedRoles.map((group, i) => (
                <View
                  key={group.role}
                  style={[
                    styles.roleGroup,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      marginBottom: i < groupedRoles.length - 1 ? 14 : 0,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: colors.surface + "40" },
                    ]}
                  >
                    <Text
                      style={[styles.roleLabel, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {group.role}
                    </Text>
                  </View>
                  <View style={styles.membersList}>
                    {group.members.map((nombre) => (
                      <Text
                        key={nombre}
                        style={[
                          styles.memberName,
                          { color: colors.foreground },
                        ]}
                      >
                        {nombre}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.devLine, { color: colors.muted }]}>
              No hay miembros del equipo cargados
            </Text>
          )}
        </View>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.secondary, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            Desarrollada por
          </Text>

          <Image
            source={require("@/assets/images/novadev1.png")}
            style={styles.novaDevImage}
            resizeMode="cover"
          />
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
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
    marginBottom: 5,
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
    marginBottom: 4,
    textAlign: "center",
  },
  version: {
    fontSize: 14,
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
    color: "red",
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
  rolesContainer: {
    width: "100%",
    marginTop: 4,
  },
  roleGroup: {
    width: "100%",
    borderRadius: 12,
    //borderWidth: 1,
    overflow: "hidden",
    padding: 0,
  },
  roleBadge: {
    //paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "stretch",
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  membersList: {
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
});
