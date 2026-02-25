import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  type LayoutChangeEvent,
  type ViewStyle,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/use-colors";

type TabLayout = { x: number; width: number };

function useBlurView(): React.ComponentType<{
  intensity?: number;
  tint?: "light" | "dark" | "default";
  style?: unknown;
}> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional dependency
    return require("expo-blur").BlurView;
  } catch {
    return null;
  }
}

const TAB_BAR_MARGIN_H = 48;
const ICON_SIZE = 24;
const BLUR_INTENSITY = 100;
const PILL_ALPHA = "99";
const ROW_PADDING_H = 5;

export function FloatingTabBar(props: BottomTabBarProps) {
  const colors = useColors();
  const { state, descriptors, navigation } = props;
  const focusedRouteKey = state.routes[state.index]?.key;
  const focusedOptions = focusedRouteKey
    ? descriptors[focusedRouteKey]?.options
    : undefined;
  const tabBarStyle = (focusedOptions?.tabBarStyle ?? {}) as Record<
    string,
    unknown
  >;
  const activeColor =
    (focusedOptions?.tabBarActiveTintColor as string) ?? colors.tint;
  const inactiveColor =
    (focusedOptions?.tabBarInactiveTintColor as string) ?? colors.muted;

  const outerPositionStyle: ViewStyle = {
    position: (tabBarStyle.position as ViewStyle["position"]) ?? "absolute",
    bottom: typeof tabBarStyle.bottom === "number" ? tabBarStyle.bottom : 0,
    left: typeof tabBarStyle.left === "number" ? tabBarStyle.left : 0,
    right: typeof tabBarStyle.right === "number" ? tabBarStyle.right : 0,
    height: typeof tabBarStyle.height === "number" ? tabBarStyle.height : 56,
  };

  const [rowLayout, setRowLayout] = useState<{
    x: number;
    width: number;
  } | null>(null);
  const [tabLayouts, setTabLayouts] = useState<TabLayout[]>([]);

  const pillLeft = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  const onRowLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    if (width > 0) setRowLayout({ x, width });
  }, []);

  const onTabLayout = useCallback(
    (index: number) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      setTabLayouts((prev) => {
        const next = [...prev];
        next[index] = { x, width };
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const layout = tabLayouts[state.index];
    if (rowLayout && layout && layout.width > 0) {
      const left = rowLayout.x + layout.x;
      pillLeft.value = withSpring(left, { damping: 22, stiffness: 200 });
      pillWidth.value = withSpring(layout.width, {
        damping: 22,
        stiffness: 200,
      });
    }
  }, [state.index, rowLayout, tabLayouts, pillLeft, pillWidth]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    left: pillLeft.value,
    width: pillWidth.value,
  }));

  const isWeb = Platform.OS === "web";
  const BlurView = useBlurView();

  return (
    <View
      style={[
        outerPositionStyle,
        styles.outer,
        { left: TAB_BAR_MARGIN_H, right: TAB_BAR_MARGIN_H },
      ]}
    >
      <View
        style={[
          styles.container,
          { borderColor: colors.primary, borderWidth: 0.5 },
        ]}
      >
        {/* Fondo tipo vidrio */}
        {!BlurView || isWeb ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              styles.glassFallback,
              {
                backgroundColor: colors.surface + "E6",
              },
            ]}
          />
        ) : (
          <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
            <BlurView
              intensity={BLUR_INTENSITY}
              tint="light"
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        )}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.tint,
            { backgroundColor: "rgba(255,255,255,0.25)" },
          ]}
        />
        {/* Resaltado tab activa */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            animatedPillStyle,
            { backgroundColor: activeColor },
          ]}
        />
        {/* Tabs: icono + etiqueta por ruta (onLayout para alinear el pill) */}
        <View style={styles.tabRow} onLayout={onRowLayout}>
          {state.routes.map((route, index) => {
            const focused = index === state.index;
            const options = descriptors[route.key]?.options ?? {};
            const label =
              (options.tabBarLabel as string) ??
              (options.title as string) ??
              route.name;
            const color = focused ? colors.secondary : inactiveColor;
            const iconElement =
              typeof options.tabBarIcon === "function"
                ? options.tabBarIcon({
                    focused,
                    color,
                    size: ICON_SIZE,
                  })
                : null;

            const onPress = () => {
              if (Platform.OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            };

            return (
              <View
                key={route.key}
                style={styles.tabItem}
                onLayout={onTabLayout(index)}
              >
                <Pressable
                  onPress={onPress}
                  style={[StyleSheet.absoluteFill, styles.tabItemInner]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={
                    typeof label === "string" ? label : route.name
                  }
                >
                  {iconElement != null ? (
                    <View style={styles.iconWrap}>{iconElement}</View>
                  ) : null}
                  <Text style={[styles.label, { color }]} numberOfLines={1}>
                    {typeof label === "string" ? label : route.name}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    height: 56,
    minWidth: 280,
    maxWidth: 320,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  glassFallback: {
    borderRadius: 28,
  },
  tint: {
    borderRadius: 28,
  },
  pill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: 22,
  },
  tabRow: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 6,
    paddingHorizontal: ROW_PADDING_H,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    minWidth: 0,
    minHeight: 44,
    position: "relative",
  },
  tabItemInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
  },
});
