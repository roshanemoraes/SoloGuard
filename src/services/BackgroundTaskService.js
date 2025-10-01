import BackgroundFetch from 'react-native-background-fetch';
import {databaseService} from './DatabaseService';
import {locationService} from './LocationService';
import {sensorService} from './SensorService';
import {smsService} from './SMSService';

class BackgroundTaskService {
  constructor() {
    this.isInitialized = false;
    this.isEnabled = false;
    this.taskInterval = null;
    this.locationUpdateInterval = 5 * 60 * 1000; // 5 minutes
    this.sensorDataInterval = 30 * 1000; // 30 seconds
    this.batteryCheckInterval = 10 * 60 * 1000; // 10 minutes
    this.lastLocationUpdate = 0;
    this.lastSensorData = 0;
    this.lastBatteryCheck = 0;
  }

  async initialize() {
    try {
      await this.configureBackgroundFetch();
      this.isInitialized = true;
      console.log('Background task service initialized with react-native-background-fetch');
    } catch (error) {
      console.error('Background task service initialization failed:', error);
    }
  }

  async configureBackgroundFetch() {
    // Configure background fetch
    BackgroundFetch.configure({
      minimumFetchInterval: 15, // Minimum interval in minutes (15 minutes)
      stopOnTerminate: false,   // Continue running when app is terminated
      startOnBoot: true,        // Start when device boots
      enableHeadless: true,      // Enable headless mode
    }, async (taskId) => {
      console.log('[BackgroundFetch] taskId:', taskId);
      
      try {
        await this.executeBackgroundTasks();
        BackgroundFetch.finish(taskId);
      } catch (error) {
        console.error('[BackgroundFetch] Error:', error);
        BackgroundFetch.finish(taskId);
      }
    }, (error) => {
      console.error('[BackgroundFetch] Failed to start:', error);
    });

    // Register headless task for when app is terminated
    BackgroundFetch.registerHeadlessTask(async (event) => {
      console.log('[BackgroundFetch HeadlessTask] start:', event.taskId);
      
      try {
        await this.executeBackgroundTasks();
        BackgroundFetch.finish(event.taskId);
      } catch (error) {
        console.error('[BackgroundFetch HeadlessTask] Error:', error);
        BackgroundFetch.finish(event.taskId);
      }
    });
  }

  async startBackgroundTasks() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Start background fetch
      const status = await BackgroundFetch.start();
      console.log('[BackgroundFetch] start status:', status);
      
      this.isEnabled = true;
      
      // Start foreground task interval as backup
      this.startForegroundTaskInterval();
      
      console.log('Background tasks started');
    } catch (error) {
      console.error('Failed to start background tasks:', error);
    }
  }

  async stopBackgroundTasks() {
    try {
      // Stop background fetch
      await BackgroundFetch.stop();
      
      // Stop foreground task interval
      if (this.taskInterval) {
        clearInterval(this.taskInterval);
        this.taskInterval = null;
      }
      
      this.isEnabled = false;
      console.log('Background tasks stopped');
    } catch (error) {
      console.error('Failed to stop background tasks:', error);
    }
  }

  startForegroundTaskInterval() {
    // Start a foreground interval as backup when background fetch is not available
    this.taskInterval = setInterval(async () => {
      try {
        await this.executeBackgroundTasks();
      } catch (error) {
        console.error('Foreground task interval error:', error);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  async executeBackgroundTasks() {
    const now = Date.now();
    
    try {
      // Check if trip is active
      const activeSession = await databaseService.getActiveTripSession();
      if (!activeSession) {
        console.log('No active trip session, skipping background tasks');
        return;
      }

      // Execute location update task
      if (now - this.lastLocationUpdate >= this.locationUpdateInterval) {
        await this.executeLocationUpdateTask();
        this.lastLocationUpdate = now;
      }

      // Execute sensor data collection task
      if (now - this.lastSensorData >= this.sensorDataInterval) {
        await this.executeSensorDataTask();
        this.lastSensorData = now;
      }

      // Execute battery check task
      if (now - this.lastBatteryCheck >= this.batteryCheckInterval) {
        await this.executeBatteryCheckTask();
        this.lastBatteryCheck = now;
      }

      // Execute data cleanup task (once per day)
      await this.executeDataCleanupTask();

    } catch (error) {
      console.error('Background tasks execution failed:', error);
    }
  }

  async executeLocationUpdateTask() {
    try {
      console.log('[BackgroundTask] Executing location update task');
      
      // Get current location
      const location = await locationService.getCurrentLocation();
      if (location) {
        // Store location update
        await databaseService.insertLocationUpdate({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          batteryLevel: locationService.getCurrentBatteryLevel(),
          isEmergency: false,
        });

        // Log activity
        await databaseService.logActivity(
          'BACKGROUND_LOCATION_UPDATE',
          'Background location update completed',
          location,
        );

        console.log('[BackgroundTask] Location update completed');
      }
    } catch (error) {
      console.error('[BackgroundTask] Location update task failed:', error);
    }
  }

  async executeSensorDataTask() {
    try {
      console.log('[BackgroundTask] Executing sensor data task');
      
      // Collect sensor data (simplified for background execution)
      const sensorData = {
        accelerometer: {x: 0, y: 0, z: 0}, // Placeholder - would get from actual sensors
        gyroscope: {x: 0, y: 0, z: 0},
        magnetometer: {x: 0, y: 0, z: 0},
        barometer: {pressure: 1013.25},
        lightSensor: {lux: 100},
        timestamp: Date.now(),
      };

      // Store sensor data
      await databaseService.insertSensorData(sensorData);

      console.log('[BackgroundTask] Sensor data collection completed');
    } catch (error) {
      console.error('[BackgroundTask] Sensor data task failed:', error);
    }
  }

  async executeBatteryCheckTask() {
    try {
      console.log('[BackgroundTask] Executing battery check task');
      
      // Check battery level
      const batteryLevel = locationService.getCurrentBatteryLevel();
      
      if (batteryLevel < 10) {
        // Handle low battery
        await locationService.handleLowBattery();
        
        // Log low battery event
        await databaseService.logActivity(
          'LOW_BATTERY_DETECTED',
          `Low battery detected: ${batteryLevel}%`,
        );

        console.log('[BackgroundTask] Low battery alert triggered');
      }

      console.log('[BackgroundTask] Battery check completed');
    } catch (error) {
      console.error('[BackgroundTask] Battery check task failed:', error);
    }
  }

  async executeDataCleanupTask() {
    try {
      // Only run cleanup once per day
      const lastCleanup = await this.getLastCleanupTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (now - lastCleanup < oneDay) {
        return; // Skip cleanup if done within last 24 hours
      }

      console.log('[BackgroundTask] Executing data cleanup task');
      
      // Clean up old data (7 days retention)
      await databaseService.cleanupOldData(7);
      
      // Log cleanup activity
      await databaseService.logActivity(
        'DATA_CLEANUP',
        'Data cleanup completed for 7 days retention',
      );

      // Update last cleanup time
      await this.setLastCleanupTime(now);

      console.log('[BackgroundTask] Data cleanup completed');
    } catch (error) {
      console.error('[BackgroundTask] Data cleanup task failed:', error);
    }
  }

  async getLastCleanupTime() {
    try {
      // Store last cleanup time in AsyncStorage or database
      // For simplicity, using a default value
      return 0;
    } catch (error) {
      console.error('Failed to get last cleanup time:', error);
      return 0;
    }
  }

  async setLastCleanupTime(timestamp) {
    try {
      // Store last cleanup time in AsyncStorage or database
      console.log('Last cleanup time set to:', new Date(timestamp));
    } catch (error) {
      console.error('Failed to set last cleanup time:', error);
    }
  }

  async getBackgroundFetchStatus() {
    try {
      const status = await BackgroundFetch.status();
      return {
        isEnabled: this.isEnabled,
        backgroundFetchStatus: status,
        lastLocationUpdate: this.lastLocationUpdate,
        lastSensorData: this.lastSensorData,
        lastBatteryCheck: this.lastBatteryCheck,
      };
    } catch (error) {
      console.error('Failed to get background fetch status:', error);
      return {
        isEnabled: this.isEnabled,
        backgroundFetchStatus: 'unknown',
        lastLocationUpdate: this.lastLocationUpdate,
        lastSensorData: this.lastSensorData,
        lastBatteryCheck: this.lastBatteryCheck,
      };
    }
  }

  async scheduleImmediateTask() {
    try {
      // Schedule an immediate background task
      await BackgroundFetch.scheduleTask({
        taskId: 'immediate_task',
        delay: 0,
        periodic: false,
      });
      console.log('Immediate task scheduled');
    } catch (error) {
      console.error('Failed to schedule immediate task:', error);
    }
  }

  async cancelAllTasks() {
    try {
      await BackgroundFetch.stop();
      if (this.taskInterval) {
        clearInterval(this.taskInterval);
        this.taskInterval = null;
      }
      this.isEnabled = false;
      console.log('All background tasks cancelled');
    } catch (error) {
      console.error('Failed to cancel all tasks:', error);
    }
  }

  // Update intervals
  setLocationUpdateInterval(intervalMs) {
    this.locationUpdateInterval = intervalMs;
  }

  setSensorDataInterval(intervalMs) {
    this.sensorDataInterval = intervalMs;
  }

  setBatteryCheckInterval(intervalMs) {
    this.batteryCheckInterval = intervalMs;
  }

  // Check if background tasks are running
  isBackgroundTasksActive() {
    return this.isEnabled;
  }
}

// Export singleton instance
export const backgroundTaskService = new BackgroundTaskService();
export const initializeBackgroundTaskService = () => backgroundTaskService.initialize();
export default backgroundTaskService;