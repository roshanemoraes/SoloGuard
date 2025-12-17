import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { MAPBOX_STYLE_URL, initializeMapbox } from '../config/mapbox';

interface MapboxMapProps {
  initialLatitude?: number;
  initialLongitude?: number;
  initialZoom?: number;
  onMapPress?: (coordinates: { latitude: number; longitude: number }) => void;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    color?: string;
    title?: string;
  }>;
  style?: any;
  showUserLocation?: boolean;
}

export default function MapboxMap({
  initialLatitude = 7.8731,
  initialLongitude = 80.7718,
  initialZoom = 8,
  onMapPress,
  markers = [],
  style,
  showUserLocation = false,
}: MapboxMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  useEffect(() => {
    initializeMapbox();
  }, []);

  const handleMapPress = (feature: any) => {
    if (onMapPress && feature.geometry?.coordinates) {
      const [longitude, latitude] = feature.geometry.coordinates;
      onMapPress({ latitude, longitude });
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={MAPBOX_STYLE_URL}
        onPress={handleMapPress}
        compassEnabled={true}
        scaleBarEnabled={false}
        attributionEnabled={true}
        logoEnabled={true}
      >
        <Mapbox.Camera
          zoomLevel={initialZoom}
          centerCoordinate={[initialLongitude, initialLatitude]}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {showUserLocation && (
          <Mapbox.UserLocation
            visible={true}
            showsUserHeadingIndicator={true}
          />
        )}

        {markers.map((marker) => (
          <Mapbox.PointAnnotation
            key={marker.id}
            id={marker.id}
            coordinate={[marker.longitude, marker.latitude]}
            onSelected={() => setSelectedMarker(marker.id)}
            onDeselected={() => setSelectedMarker(null)}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  { backgroundColor: marker.color || '#ef4444' },
                ]}
              />
            </View>
            {marker.title && selectedMarker === marker.id && (
              <Mapbox.Callout title={marker.title} />
            )}
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
