import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Region } from "react-native-maps";

interface MapViewScreenProps {
  // Define any props your component might receive
}

const MapViewScreen: React.FC<MapViewScreenProps> = () => {
  const initialRegion: Region = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapViewScreen;
