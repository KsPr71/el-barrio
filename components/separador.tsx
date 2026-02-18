import { useColors } from "@/hooks/use-colors";
import { View } from "react-native";

export function Separador() {
  const colors = useColors();
  return (
    <View
      className="px-5 pt-2 flex-col items-start justify-start"
      style={{
        borderBottomWidth: 1,
        height: 3,
        borderBottomColor: colors.secondary,
      }}
    ></View>
  );
}
