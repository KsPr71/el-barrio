import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const MAP_URL =
  "https://www.google.com/maps/place/La+Foteria/@21.383216,-77.9136503,17z/data=!4m14!1m7!3m6!1s0x8ed3816d0e8d6577:0x40af5712486a3192!2sLa+Foteria!8m2!3d21.383216!4d-77.9110754!16s%2Fg%2F11r9q14_k8!3m5!1s0x8ed3816d0e8d6577:0x40af5712486a3192!8m2!3d21.383216!4d-77.9110754!16s%2Fg%2F11r9q14_k8?entry=ttu&g_ep=EgoyMDI2MDIxMS4wIKXMDSoASAFQAw%3D%3D";

export type MapsProps = {
  uri?: string;
  height?: number;
};

export default function Maps({ uri, height = 280 }: MapsProps) {
  return (
    <WebView
      originWhitelist={["*"]}
      startInLoadingState
      style={[styles.container, { height }]}
      source={{ uri: uri ?? MAP_URL }}
      onShouldStartLoadWithRequest={(req) => !req.url.startsWith("intent://")}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
  },
});
