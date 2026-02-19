// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.down": "keyboard-arrow-down",
  xmark: "close",
  "checkmark.circle.fill": "check-circle",
  star: "star-border",
  "star.fill": "star",
  "star.lefthalf.fill": "star-half",
  "person.fill": "person",
  "hand.wave.fill": "handshake",
  "phone.fill": "phone",
  "phone.bubble": "contact-phone",
  "phone.circle": "contact-phone",
  "phone.down.circle.fill": "contact-phone",
  "location.fill": "location-on",
  "location.circle.fill": "location-on",
  "message.fill": "message",
  "bubble.left.fill": "message",
  "document.fill": "description",
  "exclamationmark.triangle.fill": "warning",
  "person.crop.rectangle.badge.plus.fill": "person-add",
  "map.fill": "map",
  "cross.case.circle.fill": "gavel",
  info: "info-outline",
  map: "map",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name];
  if (!iconName) {
    console.warn(`Icon "${name}" not found in mapping`);
    return null;
  }
  return (
    <MaterialIcons color={color} size={size} name={iconName} style={style} />
  );
}
