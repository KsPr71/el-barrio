import { useColors } from "@/hooks/use-colors";
import type { TipoSitio } from "@/hooks/use-tipos-sitio";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export interface TipoSitioChipCarouselProps {
  tipos: TipoSitio[];
  selectedTipoId: number | null;
  onSelectTipo: (tipoId: number | null) => void;
  /**
   * Cantidad de sitios por id de tipo de sitio.
   */
  countsByTipoId?: Record<number, number>;
  /**
   * Cantidad total de sitios (para el chip \"Todos\").
   */
  totalCount?: number;
}

export function TipoSitioChipCarousel({
  tipos,
  selectedTipoId,
  onSelectTipo,
  countsByTipoId,
  totalCount,
}: TipoSitioChipCarouselProps) {
  const colors = useColors();

  const totalBadge = totalCount ?? 0;
  const showTotalBadge = selectedTipoId === null && totalBadge > 0;

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
      {/* Chip Todos con badge de total */}
      <TouchableOpacity
        onPress={() => onSelectTipo(null)}
        activeOpacity={0.8}
        className="rounded-full px-4 py-2.5"
        style={{
          backgroundColor:
            selectedTipoId === null ? colors.primary : colors.surface,
          borderWidth: 1,
          borderColor:
            selectedTipoId === null ? colors.primary : colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            className="text-sm font-medium"
            style={{
              color: selectedTipoId === null ? "#FFFFFF" : colors.foreground,
            }}
          >
            Todos
          </Text>
          {showTotalBadge && (
            <View
              style={{
                minWidth: 18,
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 999,
                backgroundColor:
                  selectedTipoId === null ? "#FFFFFF" : colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color:
                    selectedTipoId === null ? colors.primary : colors.muted,
                }}
              >
                {totalBadge}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Chips por tipo con badge de cantidad */}
      {tipos.map((tipo) => {
        const isSelected = selectedTipoId === tipo.id;
        const count = countsByTipoId?.[tipo.id] ?? 0;
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text
                className="text-sm font-medium"
                style={{
                  color: isSelected ? "#FFFFFF" : colors.foreground,
                }}
                numberOfLines={1}
              >
                {tipo.tipo}
              </Text>
              {isSelected && count > 0 && (
                <View
                  style={{
                    minWidth: 18,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 999,
                    backgroundColor: isSelected ? "#FFFFFF" : colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: isSelected ? colors.primary : colors.muted,
                    }}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
