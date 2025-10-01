import Geolocation from 'react-native-geolocation-service';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import {databaseService} from './DatabaseService';
import DeviceInfo from 'react-native-device-info';

class LocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
    this.intervalId = null;
    this.lastLocation = null;
    this.batteryLevel = 100;
  }

  async initialize() {
    try {
      await this.requestLocationPermission();
      await this.startBatteryMonitoring();
      console.log('Location service initialized');
    } catch (error) {
      console.error('Location service initialization failed:', error);
    }
  }

  async requestLocationPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        ]);

        const fineLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted';
        const coarseLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === 'granted';

        if (!fineLocationGranted && !coarseLocationGranted) {
          throw new Error('Location permission denied');
        }

        return true;
      } catch (error) {
        console.error('Permission request failed:', error);
        Alert.alert(
          'Permission Required',
          'SafeGuard needs location permission to track your safety. Please enable it in settings.',
        );
        return false;
      }
    }
    return true;
  }

  async startBatteryMonitoring() {
    try {
      this.batteryLevel = await DeviceInfo.getBatteryLevel();
      this.batteryLevel = Math.round(this.batteryLevel * 100);

      // Check for low battery
      if (this.batteryLevel < 10) {
        await this.handleLowBattery();
      }
    } catch (error) {
      console.error('Battery monitoring failed:', error);
    }
  }

  async handleLowBattery() {
    try {
      // Log low battery event
      await databaseService.logActivity(
        'LOW_BATTERY_ALERT',
        `Low battery detected: ${this.batteryLevel}%`,
        this.lastLocation,
      );

      // Send SMS with last known location if available
      if (this.lastLocation) {
        await this.sendLowBatteryAlert();
      }

      // Reduce update frequency to conserve battery
      this.updateInterval = 15 * 60 * 1000; // 15 minutes
    } catch (error) {
      console.error('Low battery handling failed:', error);
    }
  }

  async sendLowBatteryAlert() {
    try {
      const primaryContact = await databaseService.getPrimaryEmergencyContact();
      if (primaryContact) {
        const message = this.buildLowBatteryMessage();
        // TODO: Implement SMS sending
        console.log('Low battery alert would be sent to:', primaryContact.phoneNumber);
        console.log('Message:', message);
      }
    } catch (error) {
      console.error('Failed to send low battery alert:', error);
    }
  }

  buildLowBatteryMessage() {
    const location = this.lastLocation;
    if (!location) {
      return '🚨 LOW BATTERY ALERT\n\nMy phone battery is critically low (${this.batteryLevel}%). Please check on me!\n\nSent via SafeGuard App';
    }

    return `🚨 LOW BATTERY ALERT

My phone battery is critically low (${this.batteryLevel}%).

Last Known Location:
Latitude: ${location.latitude}
Longitude: ${location.longitude}
Accuracy: ${location.accuracy}m
Time: ${new Date(location.timestamp).toLocaleString()}

Please check on me immediately!

Sent via SafeGuard App`;
  }

  async startLocationTracking() {
    if (this.isTracking) {
      console.log('Location tracking already active');
      return;
    }

    try {
      await this.requestLocationPermission();
      this.isTracking = true;

      // Get initial location
      await this.getCurrentLocation();

      // Start periodic updates
      this.intervalId = setInterval(async () => {
        await this.getCurrentLocation();
        await this.startBatteryMonitoring();
      }, this.updateInterval);

      console.log('Location tracking started');
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      this.isTracking = false;
    }
  }

  async stopLocationTracking() {
    if (!this.isTracking) {
      console.log('Location tracking not active');
      return;
    }

    try {
      this.isTracking = false;

      if (this.watchId !== null) {
        Geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
    }
  }

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        async position => {
          try {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            };

            this.lastLocation = location;

            // Store in database
            await databaseService.insertLocationUpdate({
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              batteryLevel: this.batteryLevel,
              isEmergency: false,
            });

            // Log activity
            await databaseService.logActivity(
              'LOCATION_UPDATE',
              `Location updated: ${location.latitude}, ${location.longitude}`,
              location,
            );

            resolve(location);
          } catch (error) {
            console.error('Failed to process location:', error);
            reject(error);
          }
        },
        error => {
          console.error('Location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          distanceFilter: 10,
        },
      );
    });
  }

  async getLastKnownLocation() {
    try {
      const recentUpdates = await databaseService.getRecentLocationUpdates(1);
      return recentUpdates.length > 0 ? recentUpdates[0] : null;
    } catch (error) {
      console.error('Failed to get last known location:', error);
      return null;
    }
  }

  async getRecentLocationHistory(limit = 10) {
    try {
      return await databaseService.getRecentLocationUpdates(limit);
    } catch (error) {
      console.error('Failed to get location history:', error);
      return [];
    }
  }

  async triggerEmergencyLocationUpdate() {
    try {
      const location = await this.getCurrentLocation();
      
      // Store as emergency location
      await databaseService.insertLocationUpdate({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        batteryLevel: this.batteryLevel,
        isEmergency: true,
      });

      // Log emergency activity
      await databaseService.logActivity(
        'EMERGENCY_LOCATION',
        'Emergency location update triggered',
        location,
      );

      return location;
    } catch (error) {
      console.error('Failed to trigger emergency location update:', error);
      throw error;
    }
  }

  // Calculate distance between two coordinates (in meters)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Check if location is within a certain radius of a destination
  isNearDestination(currentLocation, destination, radiusMeters = 100) {
    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      destination.latitude,
      destination.longitude,
    );
    return distance <= radiusMeters;
  }

  getCurrentBatteryLevel() {
    return this.batteryLevel;
  }

  isTrackingActive() {
    return this.isTracking;
  }

  setUpdateInterval(intervalMs) {
    this.updateInterval = intervalMs;
  }
}

// Export singleton instance
export const locationService = new LocationService();
export const initializeLocationService = () => locationService.initialize();
export default locationService;
