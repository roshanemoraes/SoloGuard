import * as Location from 'expo-location';
import { LocationData } from '../types';

export class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private isWatching = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });

      const address = await this.getAddressFromCoordinates(
        location.coords.latitude,
        location.coords.longitude
      );

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        address,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startWatchingLocation(
    onLocationUpdate: (location: LocationData) => void,
    updateInterval = 60000
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      if (this.isWatching) {
        this.stopWatchingLocation();
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: updateInterval,
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          const address = await this.getAddressFromCoordinates(
            location.coords.latitude,
            location.coords.longitude
          );

          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
            address,
          };

          onLocationUpdate(locationData);
        }
      );

      this.isWatching = true;
      return true;
    } catch (error) {
      console.error('Error starting location watch:', error);
      return false;
    }
  }

  stopWatchingLocation(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
      this.isWatching = false;
    }
  }

  private async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | undefined> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        return `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim();
      }
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
    }
    return undefined;
  }

  async calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): Promise<number> {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance * 1000; // Convert to meters
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  isLocationEnabled(): boolean {
    return this.isWatching;
  }
}

export const locationService = new LocationService();
