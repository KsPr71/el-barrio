import { PropsWithChildren, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import type { IconSymbolName } from "@/components/ui/icon-symbol";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function Collapsible({
  children,
  title,
  iconName,
}: PropsWithChildren<{ title: string; iconName?: IconSymbolName }>) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useColors();

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen((value) => !value);
  };

  return (
    <View className="bg-background">
      <TouchableOpacity
        className="flex-row items-center gap-2"
        onPress={toggle}
        activeOpacity={0.8}
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
        <IconSymbol
          name="chevron.right"
          size={18}
          color={colors.icon}
          style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
        />
        <Text className="text-base font-semibold text-foreground">{title}</Text>
      </TouchableOpacity>
      {isOpen ? <View className="mt-3">{children}</View> : null}
    </View>
  );
}
