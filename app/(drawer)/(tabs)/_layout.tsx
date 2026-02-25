import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FloatingTabBar } from "@/components/floating-tab-bar";
import { HapticTab } from "@/components/haptic-tab";
import { useColors } from "@/hooks/use-colors";
import {
  FileValidationIcon,
  SearchVisualFreeIcons,
  StoreLocation02Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";

import { HugeiconsIcon } from "@hugeicons/react-native";

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
            <HugeiconsIcon
              icon={StoreLocation02Icon}
              color={color}
              size={28}
              strokeWidth={2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="detalles"
        options={{
          title: "Detalles",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon
              icon={FileValidationIcon}
              color={color}
              size={28}
              strokeWidth={2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="aqui-hay"
        options={{
          title: "Aquí hay",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon
              icon={SearchVisualFreeIcons}
              color={color}
              size={28}
              strokeWidth={2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon
              icon={UserCheck01Icon}
              color={color}
              size={28}
              strokeWidth={2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
