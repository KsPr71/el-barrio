import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Captura errores en el árbol de React y muestra una pantalla de fallo
 * en lugar de cerrar la app (útil en builds de release).
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error("[RootErrorBoundary]", error, errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>
            Reinicia la aplicación. Si el problema continúa, contacta al soporte.
          </Text>
          {__DEV__ && (
            <Text style={styles.devError} numberOfLines={10}>
              {this.state.error.message}
            </Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  devError: {
    marginTop: 24,
    fontSize: 12,
    color: "#c00",
    fontFamily: "monospace",
  },
});
