import { Accelerometer, Gyroscope } from 'expo-sensors';
import { MotionData } from '../types';

export class MotionService {
  private accelerometerSubscription: any = null;
  private gyroscopeSubscription: any = null;
  private isMonitoring = false;
  private lastActivityTime = Date.now();
  private inactivityThreshold = 30 * 60 * 1000; // 30 minutes in milliseconds
  private motionThreshold = 0.1; // Threshold for detecting motion
  private onInactivityDetected?: () => void;

  async isAvailable(): Promise<boolean> {
    try {
      const accelerometerAvailable = await Accelerometer.isAvailableAsync();
      const gyroscopeAvailable = await Gyroscope.isAvailableAsync();
      return accelerometerAvailable && gyroscopeAvailable;
    } catch (error) {
      console.error('Error checking motion sensor availability:', error);
      return false;
    }
  }

  async startMotionMonitoring(
    onInactivityDetected: () => void,
    inactivityThresholdMinutes = 30
  ): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        throw new Error('Motion sensors are not available');
      }

      this.onInactivityDetected = onInactivityDetected;
      this.inactivityThreshold = inactivityThresholdMinutes * 60 * 1000;
      this.lastActivityTime = Date.now();

      // Set update intervals
      Accelerometer.setUpdateInterval(1000); // 1 second
      Gyroscope.setUpdateInterval(1000); // 1 second

      // Start accelerometer monitoring
      this.accelerometerSubscription = Accelerometer.addListener((accelerometerData) => {
        this.handleMotionData(accelerometerData);
      });

      // Start gyroscope monitoring
      this.gyroscopeSubscription = Gyroscope.addListener((gyroscopeData) => {
        this.handleMotionData(gyroscopeData);
      });

      this.isMonitoring = true;

      // Start inactivity check interval
      this.startInactivityCheck();

      return true;
    } catch (error) {
      console.error('Error starting motion monitoring:', error);
      return false;
    }
  }

  stopMotionMonitoring(): void {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }

    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.remove();
      this.gyroscopeSubscription = null;
    }

    this.isMonitoring = false;
    this.onInactivityDetected = undefined;
  }

  private handleMotionData(sensorData: any): void {
    if (!this.isMonitoring) return;

    const motionMagnitude = this.calculateMotionMagnitude(sensorData);
    
    if (motionMagnitude > this.motionThreshold) {
      this.lastActivityTime = Date.now();
    }
  }

  private calculateMotionMagnitude(data: any): number {
    // Calculate the magnitude of motion from accelerometer or gyroscope data
    if (data.x !== undefined && data.y !== undefined && data.z !== undefined) {
      return Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
    }
    return 0;
  }

  private startInactivityCheck(): void {
    const checkInterval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(checkInterval);
        return;
      }

      const timeSinceLastActivity = Date.now() - this.lastActivityTime;
      
      if (timeSinceLastActivity >= this.inactivityThreshold) {
        if (this.onInactivityDetected) {
          this.onInactivityDetected();
        }
        // Reset the timer to avoid multiple triggers
        this.lastActivityTime = Date.now();
      }
    }, 60000); // Check every minute
  }

  getLastActivityTime(): Date {
    return new Date(this.lastActivityTime);
  }

  getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivityTime;
  }

  getMotionData(): MotionData | null {
    if (!this.isMonitoring) return null;

    return {
      acceleration: { x: 0, y: 0, z: 0 }, // Would be populated from actual sensor data
      gyroscope: { x: 0, y: 0, z: 0 }, // Would be populated from actual sensor data
      timestamp: Date.now(),
    };
  }

  setInactivityThreshold(minutes: number): void {
    this.inactivityThreshold = minutes * 60 * 1000;
  }

  setMotionThreshold(threshold: number): void {
    this.motionThreshold = threshold;
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  getInactivityStatus(): {
    isInactive: boolean;
    timeSinceLastActivity: number;
    timeUntilInactivityAlert: number;
  } {
    const timeSinceLastActivity = this.getTimeSinceLastActivity();
    const isInactive = timeSinceLastActivity >= this.inactivityThreshold;
    const timeUntilInactivityAlert = Math.max(0, this.inactivityThreshold - timeSinceLastActivity);

    return {
      isInactive,
      timeSinceLastActivity,
      timeUntilInactivityAlert,
    };
  }
}

export const motionService = new MotionService();
