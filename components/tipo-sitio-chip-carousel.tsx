import { useColors } from "@/hooks/use-colors";
import type { TipoSitio } from "@/hooks/use-tipos-sitio";
import { ScrollView, Text, TouchableOpacity } from "react-native";

export interface TipoSitioChipCarouselProps {
  tipos: TipoSitio[];
  selectedTipoId: number | null;
  onSelectTipo: (tipoId: number | null) => void;
}

export function TipoSitioChipCarousel({
  tipos,
  selectedTipoId,
  onSelectTipo,
}: TipoSitioChipCarouselProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 8,
          paddingRight: 24,
        }}
    >
      <TouchableOpacity
        onPress={() => onSelectTipo(null)}
        activeOpacity={0.8}
        className="rounded-full px-4 py-2.5"
        style={{
          backgroundColor: selectedTipoId === null ? colors.primary : colors.surface,
          borderWidth: 1,
          borderColor: selectedTipoId === null ? colors.primary : colors.border,
        }}
      >
        <Text
          className="text-sm font-medium"
          style={{
            color: selectedTipoId === null ? "#FFFFFF" : colors.foreground,
          }}
        >
          Todos
        </Text>
      </TouchableOpacity>
      {tipos.map((tipo) => {
        const isSelected = selectedTipoId === tipo.id;
        return (
          <TouchableOpacity
            key={tipo.id}
            onPress={() => onSelectTipo(tipo.id)}
            activeOpacity={0.8}
            className="rounded-full px-4 py-2.5"
            style={{
              backgroundColor: isSelected ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: isSelected ? colors.primary : colors.border,
            }}
          >
            <Text
              className="text-sm font-medium"
              style={{
                color: isSelected ? "#FFFFFF" : colors.foreground,
              }}
              numberOfLines={1}
            >
              {tipo.tipo}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
