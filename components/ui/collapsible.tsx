import type { IconSymbolName } from "@/components/ui/icon-symbol";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { PropsWithChildren, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function Collapsible({
  children,
  title,
  iconName,
  trailingElement,
}: PropsWithChildren<{
  title: string;
  iconName?: IconSymbolName;
  trailingElement?: React.ReactNode;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useColors();
  const chevronRotation = useSharedValue(0);

  const toggle = () => {
    chevronRotation.value = withTiming(isOpen ? 0 : 1, { duration: 200 });
    setIsOpen((value) => !value);
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value * 90}deg` }],
  }));

  return (
    <View className="bg-background" style={{ width: "100%" }}>
      <TouchableOpacity
        className="flex-row items-center gap-2"
        onPress={toggle}
        activeOpacity={0.8}
        style={{ width: "100%" }}
      >
        {iconName ? (
          <View
            style={{
              width: 40,
              height: 40,
              backgroundColor: colors.primary + "20",
              padding: 10,
              borderRadius: 30,
              marginLeft: 10,
            }}
          >
            <IconSymbol name={iconName} size={20} color={colors.primary} />
          </View>
        ) : null}
        <Animated.View style={chevronStyle}>
          <IconSymbol name="chevron.right" size={18} color={colors.icon} />
        </Animated.View>
        <Text className="text-base font-semibold text-foreground flex-1">
          {title}
        </Text>
        {trailingElement}
      </TouchableOpacity>
      {isOpen ? (
        <Animated.View
          entering={FadeInDown.duration(320).springify().damping(15)}
          exiting={FadeOut.duration(220)}
          className="mt-3 overflow-hidden"
        >
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}
