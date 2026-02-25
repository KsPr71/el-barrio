import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FloatingTabBar } from "@/components/floating-tab-bar";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const TAB_BAR_MARGIN_BOTTOM = 0;
const TAB_BAR_HEIGHT = 64;

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding =
    Platform.OS === "web" ? 12 : Math.max(insets.bottom, 20);
  const tabBarBottom = TAB_BAR_MARGIN_BOTTOM + bottomPadding;

  return (
    <Tabs
      tabBar={(props: Parameters<typeof FloatingTabBar>[0]) => (
        <FloatingTabBar {...props} />
      )}
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: tabBarBottom,
          height: TAB_BAR_HEIGHT,
          paddingTop: 0,
          paddingBottom: 0,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          shadowColor: "transparent",
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="detalles"
        options={{
          title: "Detalles",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="document.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="aqui-hay"
        options={{
          title: "Aquí hay",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="magnifyingglass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
