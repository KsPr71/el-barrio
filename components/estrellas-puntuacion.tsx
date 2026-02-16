import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { View, Text, TouchableOpacity } from "react-native";

export interface EstrellasPuntuacionProps {
  promedio: number;
  total?: number;
  size?: number;
  showNumber?: boolean;
  showTotal?: boolean;
  editable?: boolean;
  calificacionSeleccionada?: number;
  onCalificacionChange?: (calificacion: number) => void;
}

export function EstrellasPuntuacion({
  promedio,
  total,
  size = 16,
  showNumber = false,
  showTotal = false,
  editable = false,
  calificacionSeleccionada,
  onCalificacionChange,
}: EstrellasPuntuacionProps) {
  const colors = useColors();

  const handlePress = (calificacion: number) => {
    if (editable && onCalificacionChange) {
      onCalificacionChange(calificacion);
    }
  };

  const renderEstrella = (index: number) => {
    const valorEstrella = index + 1;
    let estaSeleccionada = false;
    let estaParcial = false;

    if (editable) {
      // En modo editable, mostrar seleccionadas según calificacionSeleccionada
      // Si calificacionSeleccionada es 0 o undefined, todas las estrellas estarán vacías pero visibles
      estaSeleccionada = 
        calificacionSeleccionada !== undefined && 
        calificacionSeleccionada !== null &&
        calificacionSeleccionada > 0 && 
        valorEstrella <= calificacionSeleccionada;
    } else {
      // En modo visualización, mostrar según promedio
      estaSeleccionada = promedio > 0 && valorEstrella <= Math.round(promedio);
      estaParcial = !estaSeleccionada && promedio > 0 && valorEstrella - 1 < promedio && promedio < valorEstrella;
    }

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handlePress(valorEstrella)}
        disabled={!editable}
        activeOpacity={editable ? 0.7 : 1}
        style={{ marginRight: 2 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <IconSymbol
          name={estaSeleccionada ? "star.fill" : estaParcial ? "star.lefthalf.fill" : "star"}
          size={size}
          color={estaSeleccionada || estaParcial ? "#FFD700" : colors.muted}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {[0, 1, 2, 3, 4].map((index) => renderEstrella(index))}
      </View>
      {showNumber && (
        <Text
          style={{
            fontSize: size * 0.75,
            color: colors.foreground,
            fontWeight: "600",
            marginLeft: 4,
          }}
        >
          {promedio > 0 ? promedio.toFixed(1) : "0.0"}
        </Text>
      )}
      {showTotal && total !== undefined && total > 0 && (
        <Text
          style={{
            fontSize: size * 0.7,
            color: colors.muted,
            marginLeft: 4,
          }}
        >
          ({total})
        </Text>
      )}
    </View>
  );
}
