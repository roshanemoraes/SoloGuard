// Location types
export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  timestamp: number;
  address?: string;
}

// Battery status types
export interface BatteryStatus {
  batteryLevel: number;
  isCharging: boolean;
  isLowPowerMode: boolean;
  timestamp: number;
}

// Emergency contact types
export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  isPrimary: boolean;
  isActive: boolean;
}

// User profile
export interface UserProfile {
  fullName: string;
  username: string;
  phoneNumber: string;
  email?: string;
  medicalInfo?: string;
}

// Motion sensor data types
export interface MotionData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  timestamp: number;
}

// SOS alert types
export interface SOSAlert {
  id: string;
  type: 'manual' | 'automatic' | 'battery_low';
  timestamp: number;
  location: LocationData;
  batteryLevel: number;
  message: string;
  sentTo: string[];
  status: 'pending' | 'sent' | 'failed';
}

// Trip planning types
export interface TripDestination {
  id: string;
  name: string;
  location: LocationData;
  type:
    | 'hospital'
    | 'police'
    | 'safe_area'
    | 'custom'
    | 'outdoors'
    | 'food'
    | 'culture'
    | 'water';
  isPreloaded: boolean;
}

// App settings types
export interface AppSettings {
  inactivityThreshold: number; // minutes
  batteryThreshold: number; // percentage
  monitoringEnabled: boolean;
  autoSOSEnabled: boolean;
  notificationsEnabled: boolean;
  updateInterval: number; // seconds
  preferMMS?: boolean; // try MMS first, fallback to SMS
}

// Monitoring log types
export interface MonitoringLog {
  id: string;
  timestamp: number;
  type: 'location_update' | 'battery_check' | 'motion_detected' | 'inactivity_alert' | 'sos_sent';
  data: any;
  batteryLevel: number;
  location?: LocationData;
}

// App state types
export interface AppState {
  isMonitoring: boolean;
  lastLocation?: LocationData;
  batteryStatus?: BatteryStatus;
  emergencyContacts: EmergencyContact[];
  settings: AppSettings;
  monitoringLogs: MonitoringLog[];
  isEmergencyMode: boolean;
  userProfile: UserProfile;
}
