// Mapbox will be initialized at runtime, not during build
let mapboxInitialized = false;

export const initializeMapbox = () => {
  if (mapboxInitialized) return;

  try {
    const Mapbox = require('@rnmapbox/maps').default;
    const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    if (!MAPBOX_ACCESS_TOKEN) {
      console.warn('Mapbox access token is not set. Please add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env file');
    }

    Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
    Mapbox.setTelemetryEnabled(false); // Disable telemetry for privacy

    mapboxInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Mapbox:', error);
  }
};

export const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';
export const MAPBOX_SATELLITE_STYLE_URL = 'mapbox://styles/mapbox/satellite-streets-v12';
export const MAPBOX_OUTDOORS_STYLE_URL = 'mapbox://styles/mapbox/outdoors-v12';

// Offline pack configuration
export const OFFLINE_PACK_CONFIG = {
  minZoom: 10,
  maxZoom: 16,
  styleURL: MAPBOX_STYLE_URL,
};

// Default map region bounds for Sri Lanka
export const SRI_LANKA_BOUNDS = {
  ne: [81.8811, 9.8353], // Northeast corner
  sw: [79.6951, 5.9169], // Southwest corner
};

// Export a getter function instead of the Mapbox object directly
export const getMapbox = () => {
  try {
    return require('@rnmapbox/maps').default;
  } catch (error) {
    console.error('Failed to load Mapbox:', error);
    return null;
  }
};
