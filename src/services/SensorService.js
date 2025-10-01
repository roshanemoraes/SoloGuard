import {
  accelerometer,
  gyroscope,
  magnetometer,
  barometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import {databaseService} from './DatabaseService';
import {PermissionsAndroid, Platform, Alert} from 'react-native';

class SensorService {
  constructor() {
    this.isMonitoring = false;
    this.subscriptions = {};
    this.inactivityThreshold = 6 * 60 * 60 * 1000; // 6 hours
    this.lastActivityTime = Date.now();
    this.activityCheckInterval = null;
    this.inactivityWarningShown = false;
    this.safetyCheckTimeout = null;
    
    // Activity detection parameters
    this.movementThreshold = 0.5; // Minimum acceleration change to consider as movement
    this.lastAccelerometerData = {x: 0, y: 0, z: 0};
    this.stationaryCount = 0;
    this.stationaryThreshold = 10; // Number of consecutive readings to consider stationary
  }

  async initialize() {
    try {
      await this.requestSensorPermissions();
      this.setupSensorUpdateIntervals();
      console.log('Sensor service initialized');
    } catch (error) {
      console.error('Sensor service initialization failed:', error);
    }
  }

  async requestSensorPermissions() {
    if (Platform.OS === 'android') {
      try {
        // Most sensors don't require explicit permissions on Android
        // But we'll check for any that might
        console.log('Sensor permissions check completed');
        return true;
      } catch (error) {
        console.error('Sensor permission request failed:', error);
        return false;
      }
    }
    return true;
  }

  setupSensorUpdateIntervals() {
    // Set update intervals for different sensors
    setUpdateIntervalForType(SensorTypes.accelerometer, 1000); // 1 second
    setUpdateIntervalForType(SensorTypes.gyroscope, 1000); // 1 second
    setUpdateIntervalForType(SensorTypes.magnetometer, 2000); // 2 seconds
    setUpdateIntervalForType(SensorTypes.barometer, 5000); // 5 seconds
  }

  async startActivityMonitoring() {
    if (this.isMonitoring) {
      console.log('Activity monitoring already active');
      return;
    }

    try {
      this.isMonitoring = true;
      this.lastActivityTime = Date.now();
      this.inactivityWarningShown = false;

      // Start accelerometer monitoring for movement detection
      this.subscriptions.accelerometer = accelerometer.subscribe(({x, y, z}) => {
        this.handleAccelerometerData({x, y, z});
      });

      // Start gyroscope monitoring
      this.subscriptions.gyroscope = gyroscope.subscribe(({x, y, z}) => {
        this.handleGyroscopeData({x, y, z});
      });

      // Start magnetometer monitoring
      this.subscriptions.magnetometer = magnetometer.subscribe(({x, y, z}) => {
        this.handleMagnetometerData({x, y, z});
      });

      // Start barometer monitoring
      this.subscriptions.barometer = barometer.subscribe(({pressure}) => {
        this.handleBarometerData({pressure});
      });

      // Start periodic activity check
      this.activityCheckInterval = setInterval(() => {
        this.checkInactivity();
      }, 60000); // Check every minute

      // Log activity monitoring start
      await databaseService.logActivity(
        'ACTIVITY_MONITORING_STARTED',
        'Activity monitoring started for safety detection',
      );

      console.log('Activity monitoring started');
    } catch (error) {
      console.error('Failed to start activity monitoring:', error);
      this.isMonitoring = false;
    }
  }

  async stopActivityMonitoring() {
    if (!this.isMonitoring) {
      console.log('Activity monitoring not active');
      return;
    }

    try {
      this.isMonitoring = false;

      // Unsubscribe from all sensors
      Object.values(this.subscriptions).forEach(subscription => {
        subscription.unsubscribe();
      });
      this.subscriptions = {};

      // Clear intervals
      if (this.activityCheckInterval) {
        clearInterval(this.activityCheckInterval);
        this.activityCheckInterval = null;
      }

      if (this.safetyCheckTimeout) {
        clearTimeout(this.safetyCheckTimeout);
        this.safetyCheckTimeout = null;
      }

      // Log activity monitoring stop
      await databaseService.logActivity(
        'ACTIVITY_MONITORING_STOPPED',
        'Activity monitoring stopped',
      );

      console.log('Activity monitoring stopped');
    } catch (error) {
      console.error('Failed to stop activity monitoring:', error);
    }
  }

  handleAccelerometerData(data) {
    const {x, y, z} = data;
    
    // Calculate movement magnitude
    const movement = Math.sqrt(
      Math.pow(x - this.lastAccelerometerData.x, 2) +
      Math.pow(y - this.lastAccelerometerData.y, 2) +
      Math.pow(z - this.lastAccelerometerData.z, 2)
    );

    if (movement > this.movementThreshold) {
      // Movement detected
      this.lastActivityTime = Date.now();
      this.stationaryCount = 0;
      this.inactivityWarningShown = false;
      
      // Clear any pending safety check
      if (this.safetyCheckTimeout) {
        clearTimeout(this.safetyCheckTimeout);
        this.safetyCheckTimeout = null;
      }
    } else {
      this.stationaryCount++;
    }

    this.lastAccelerometerData = {x, y, z};

    // Store sensor data
    this.storeSensorData({
      accelerometer: data,
      timestamp: Date.now(),
    });
  }

  handleGyroscopeData(data) {
    // Store gyroscope data
    this.storeSensorData({
      gyroscope: data,
      timestamp: Date.now(),
    });
  }

  handleMagnetometerData(data) {
    // Store magnetometer data
    this.storeSensorData({
      magnetometer: data,
      timestamp: Date.now(),
    });
  }

  handleBarometerData(data) {
    // Store barometer data
    this.storeSensorData({
      barometer: data,
      timestamp: Date.now(),
    });
  }

  async storeSensorData(sensorData) {
    try {
      await databaseService.insertSensorData(sensorData);
    } catch (error) {
      console.error('Failed to store sensor data:', error);
    }
  }

  checkInactivity() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;

    if (timeSinceLastActivity > this.inactivityThreshold) {
      if (!this.inactivityWarningShown) {
        this.showInactivityWarning();
        this.inactivityWarningShown = true;
      }
    }
  }

  showInactivityWarning() {
    const {Alert} = require('react-native');
    
    Alert.alert(
      'Safety Check',
      'We haven\'t detected any movement for over 6 hours. Are you safe?',
      [
        {
          text: 'I\'m Safe',
          onPress: () => this.handleSafetyConfirmation(),
        },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => this.handleSOSRequest(),
        },
      ],
      {
        cancelable: false,
      },
    );

    // Set timeout for automatic SOS if no response
    this.safetyCheckTimeout = setTimeout(() => {
      this.handleAutomaticSOS();
    }, 5 * 60 * 1000); // 5 minutes timeout
  }

  async handleSafetyConfirmation() {
    try {
      this.lastActivityTime = Date.now();
      this.inactivityWarningShown = false;

      // Log safety confirmation
      await databaseService.logActivity(
        'SAFETY_CONFIRMED',
        'User confirmed safety after inactivity warning',
      );

      console.log('Safety confirmed by user');
    } catch (error) {
      console.error('Failed to handle safety confirmation:', error);
    }
  }

  async handleSOSRequest() {
    try {
      // Log manual SOS request
      await databaseService.logActivity(
        'MANUAL_SOS_REQUEST',
        'User requested SOS after inactivity warning',
      );

      // Trigger SOS alert
      const {locationService} = require('./LocationService');
      await locationService.triggerEmergencyLocationUpdate();

      console.log('SOS requested by user');
    } catch (error) {
      console.error('Failed to handle SOS request:', error);
    }
  }

  async handleAutomaticSOS() {
    try {
      // Log automatic SOS trigger
      await databaseService.logActivity(
        'AUTOMATIC_SOS_TRIGGERED',
        'Automatic SOS triggered due to no response to safety check',
      );

      // Trigger SOS alert
      const {locationService} = require('./LocationService');
      await locationService.triggerEmergencyLocationUpdate();

      console.log('Automatic SOS triggered');
    } catch (error) {
      console.error('Failed to handle automatic SOS:', error);
    }
  }

  // Get current activity status
  getActivityStatus() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;
    
    return {
      isActive: this.isMonitoring,
      lastActivityTime: this.lastActivityTime,
      timeSinceLastActivity: timeSinceLastActivity,
      isStationary: this.stationaryCount > this.stationaryThreshold,
      stationaryCount: this.stationaryCount,
      inactivityWarningShown: this.inactivityWarningShown,
    };
  }

  // Update inactivity threshold
  setInactivityThreshold(hours) {
    this.inactivityThreshold = hours * 60 * 60 * 1000;
  }

  // Update movement threshold
  setMovementThreshold(threshold) {
    this.movementThreshold = threshold;
  }

  // Force activity update (useful for manual confirmation)
  updateActivityTime() {
    this.lastActivityTime = Date.now();
    this.stationaryCount = 0;
    this.inactivityWarningShown = false;
  }

  isMonitoringActive() {
    return this.isMonitoring;
  }
}

// Export singleton instance
export const sensorService = new SensorService();
export const initializeSensorService = () => sensorService.initialize();
export default sensorService;
