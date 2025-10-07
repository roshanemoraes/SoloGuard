import { useAppStore } from '../stores/useAppStore';
import { locationService } from './locationService';
import { batteryService } from './batteryService';
import { motionService } from './motionService';
import { smsService } from './smsService';
import { LocationData, BatteryStatus, MonitoringLog } from '../types';

export class MonitoringService {
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  async startMonitoring(): Promise<boolean> {
    try {
      const store = useAppStore.getState();
      
      if (this.isRunning) {
        console.log('Monitoring is already running');
        return true;
      }

      if (!store.settings.monitoringEnabled) {
        console.log('Monitoring is disabled in settings');
        return false;
      }

      // Start location monitoring
      const locationStarted = await locationService.startWatchingLocation(
        (location) => this.handleLocationUpdate(location),
        store.settings.updateInterval * 1000
      );

      if (!locationStarted) {
        console.error('Failed to start location monitoring');
        return false;
      }

      // Start battery monitoring
      batteryService.startBatteryMonitoring(
        (battery) => this.handleBatteryUpdate(battery),
        store.settings.updateInterval * 1000
      );

      // Start motion monitoring
      const motionStarted = await motionService.startMotionMonitoring(
        () => this.handleInactivityDetected(),
        store.settings.inactivityThreshold
      );

      if (!motionStarted) {
        console.log('Motion monitoring not available, continuing without it');
      }

      // Start periodic monitoring checks
      this.startPeriodicChecks();

      this.isRunning = true;
      useAppStore.getState().setMonitoring(true);

      this.addMonitoringLog({
        id: this.generateId(),
        timestamp: Date.now(),
        type: 'location_update',
        data: { message: 'Monitoring started' },
        batteryLevel: store.batteryStatus?.batteryLevel || 0,
      });

      return true;
    } catch (error) {
      console.error('Error starting monitoring:', error);
      return false;
    }
  }

  stopMonitoring(): void {
    if (!this.isRunning) {
      return;
    }

    // Stop all services
    locationService.stopWatchingLocation();
    batteryService.stopBatteryMonitoring();
    motionService.stopMotionMonitoring();

    // Clear monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isRunning = false;
    useAppStore.getState().setMonitoring(false);

    this.addMonitoringLog({
      id: this.generateId(),
      timestamp: Date.now(),
      type: 'location_update',
      data: { message: 'Monitoring stopped' },
      batteryLevel: useAppStore.getState().batteryStatus?.batteryLevel || 0,
    });
  }

  private startPeriodicChecks(): void {
    const store = useAppStore.getState();
    
    this.monitoringInterval = setInterval(() => {
      this.performPeriodicChecks();
    }, store.settings.updateInterval * 1000);
  }

  private async performPeriodicChecks(): Promise<void> {
    const store = useAppStore.getState();
    
    // Check battery level
    if (store.batteryStatus) {
      if (batteryService.isBatteryLow(store.batteryStatus.batteryLevel, store.settings.batteryThreshold)) {
        await this.handleLowBattery(store.batteryStatus);
      }
    }

    // Check motion inactivity
    const inactivityStatus = motionService.getInactivityStatus();
    if (inactivityStatus.isInactive && store.settings.autoSOSEnabled) {
      await this.handleInactivityDetected();
    }

    // Add periodic log
    this.addMonitoringLog({
      id: this.generateId(),
      timestamp: Date.now(),
      type: 'battery_check',
      data: { 
        batteryLevel: store.batteryStatus?.batteryLevel || 0,
        isMonitoring: true 
      },
      batteryLevel: store.batteryStatus?.batteryLevel || 0,
      location: store.lastLocation,
    });
  }

  private handleLocationUpdate(location: LocationData): void {
    useAppStore.getState().updateLocation(location);
    
    this.addMonitoringLog({
      id: this.generateId(),
      timestamp: Date.now(),
      type: 'location_update',
      data: { location },
      batteryLevel: useAppStore.getState().batteryStatus?.batteryLevel || 0,
      location,
    });
  }

  private handleBatteryUpdate(battery: BatteryStatus): void {
    useAppStore.getState().updateBatteryStatus(battery);
    
    this.addMonitoringLog({
      id: this.generateId(),
      timestamp: Date.now(),
      type: 'battery_check',
      data: { battery },
      batteryLevel: battery.batteryLevel,
    });
  }

  private async handleInactivityDetected(): Promise<void> {
    const store = useAppStore.getState();
    
    this.addMonitoringLog({
      id: this.generateId(),
      timestamp: Date.now(),
      type: 'inactivity_alert',
      data: { 
        message: 'Inactivity detected',
        lastActivity: motionService.getLastActivityTime().toISOString()
      },
      batteryLevel: store.batteryStatus?.batteryLevel || 0,
      location: store.lastLocation,
    });

    // Send automatic SOS if enabled
    if (store.settings.autoSOSEnabled && store.lastLocation) {
      await this.sendSOSAlert('automatic');
    }
  }

  private async handleLowBattery(battery: BatteryStatus): Promise<void> {
    const store = useAppStore.getState();
    
    this.addMonitoringLog({
      id: this.generateId(),
      timestamp: Date.now(),
      type: 'battery_check',
      data: { 
        message: 'Low battery detected',
        batteryLevel: battery.batteryLevel 
      },
      batteryLevel: battery.batteryLevel,
      location: store.lastLocation,
    });

    // Send battery low alert
    if (store.lastLocation && store.emergencyContacts.length > 0) {
      const result = await smsService.sendBatteryLowAlert(
        store.lastLocation,
        store.emergencyContacts,
        battery.batteryLevel
      );

      if (result.success) {
        this.addMonitoringLog({
          id: this.generateId(),
          timestamp: Date.now(),
          type: 'sos_sent',
          data: { 
            message: 'Battery low alert sent',
            sentTo: result.sentTo 
          },
          batteryLevel: battery.batteryLevel,
          location: store.lastLocation,
        });
      }
    }
  }

  async sendSOSAlert(type: 'manual' | 'automatic' | 'battery_low' = 'manual'): Promise<boolean> {
    const store = useAppStore.getState();
    
    if (!store.lastLocation) {
      console.error('No location data available for SOS alert');
      return false;
    }

    if (store.emergencyContacts.length === 0) {
      console.error('No emergency contacts configured');
      return false;
    }

    try {
      const result = await smsService.sendSOSAlert(
        store.lastLocation,
        store.emergencyContacts,
        store.batteryStatus?.batteryLevel || 0,
        type
      );

      if (result.success) {
        this.addMonitoringLog({
          id: this.generateId(),
          timestamp: Date.now(),
          type: 'sos_sent',
          data: { 
            message: `${type} SOS alert sent`,
            sentTo: result.sentTo,
            type 
          },
          batteryLevel: store.batteryStatus?.batteryLevel || 0,
          location: store.lastLocation,
        });

        // Set emergency mode
        useAppStore.getState().setEmergencyMode(true);
        
        // Auto-disable emergency mode after 5 minutes
        setTimeout(() => {
          useAppStore.getState().setEmergencyMode(false);
        }, 5 * 60 * 1000);
      }

      return result.success;
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      return false;
    }
  }

  private addMonitoringLog(log: MonitoringLog): void {
    useAppStore.getState().addMonitoringLog(log);
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }

  getMonitoringStatus(): {
    isRunning: boolean;
    hasLocation: boolean;
    hasBattery: boolean;
    hasContacts: boolean;
    lastUpdate: Date | null;
  } {
    const store = useAppStore.getState();
    
    return {
      isRunning: this.isRunning,
      hasLocation: !!store.lastLocation,
      hasBattery: !!store.batteryStatus,
      hasContacts: store.emergencyContacts.length > 0,
      lastUpdate: store.lastLocation ? new Date(store.lastLocation.timestamp) : null,
    };
  }
}

export const monitoringService = new MonitoringService();
