import type { TipoSitio } from "@/hooks/use-tipos-sitio";
import { useColors } from "@/hooks/use-colors";
import { Text, View } from "react-native";

export interface TipoSitioChipProps {
  tipo: TipoSitio;
  /** Si true, el chip se posiciona absoluto (para superponer sobre imagen). Por defecto false. */
  overlay?: boolean;
}

export function TipoSitioChip({ tipo, overlay = false }: TipoSitioChipProps) {
  const colors = useColors();

  return (
    <View
      style={[
        {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: colors.primary,
          alignSelf: "flex-start",
        },
        overlay && {
          position: "absolute" as const,
          top: 10,
          left: 10,
          maxWidth: "80%",
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: "#FFFFFF",
        }}
      >
        {tipo.tipo}
      </Text>
    </View>
  );
}
