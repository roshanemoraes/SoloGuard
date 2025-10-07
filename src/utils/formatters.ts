import { LocationData, BatteryStatus, MonitoringLog } from '../types';

export const formatLocation = (location: LocationData) => {
  return {
    coordinates: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
    address: location.address || 'Address not available',
    timestamp: new Date(location.timestamp).toLocaleString(),
    googleMapsUrl: `https://maps.google.com/?q=${location.latitude},${location.longitude}`,
  };
};

export const formatBatteryStatus = (battery: BatteryStatus) => {
  return {
    level: `${Math.round(battery.batteryLevel)}%`,
    status: battery.isCharging ? 'Charging' : 'Not Charging',
    color: getBatteryColor(battery.batteryLevel),
    isLow: battery.batteryLevel <= 20,
    isCritical: battery.batteryLevel <= 5,
  };
};

export const getBatteryColor = (level: number) => {
  if (level > 50) return '#22c55e'; // Green
  if (level > 20) return '#f59e0b'; // Yellow
  if (level > 5) return '#f97316'; // Orange
  return '#ef4444'; // Red
};

export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString(),
    full: date.toLocaleString(),
    relative: getRelativeTime(timestamp),
  };
};

export const getRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

export const formatPhoneNumber = (phoneNumber: string) => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length and country code
  if (cleaned.length === 10) {
    // Sri Lankan local number
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (cleaned.length === 12 && cleaned.startsWith('94')) {
    // Sri Lankan international number
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // Sri Lankan number with leading 0
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
  
  return phoneNumber; // Return original if can't format
};

export const validatePhoneNumber = (phoneNumber: string) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(cleaned);
};

export const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

export const formatLogMessage = (log: MonitoringLog) => {
  const timestamp = formatTimestamp(log.timestamp);
  
  switch (log.type) {
    case 'location_update':
      return `Location updated at ${timestamp.time}`;
    case 'battery_check':
      return `Battery check: ${Math.round(log.batteryLevel)}%`;
    case 'motion_detected':
      return `Motion detected at ${timestamp.time}`;
    case 'inactivity_alert':
      return `Inactivity alert triggered at ${timestamp.time}`;
    case 'sos_sent':
      return `SOS alert sent at ${timestamp.time}`;
    default:
      return `Activity logged at ${timestamp.time}`;
  }
};

export const getLogIcon = (type: string) => {
  switch (type) {
    case 'location_update':
      return 'location';
    case 'battery_check':
      return 'battery-half';
    case 'motion_detected':
      return 'move';
    case 'inactivity_alert':
      return 'warning';
    case 'sos_sent':
      return 'alert-circle';
    default:
      return 'information-circle';
  }
};

export const getLogColor = (type: string) => {
  switch (type) {
    case 'location_update':
      return '#3b82f6';
    case 'battery_check':
      return '#f59e0b';
    case 'motion_detected':
      return '#8b5cf6';
    case 'inactivity_alert':
      return '#ef4444';
    case 'sos_sent':
      return '#dc2626';
    default:
      return '#6b7280';
  }
};

export const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const sanitizeInput = (input: string) => {
  return input.trim().replace(/[<>]/g, '');
};

export const formatEmergencyMessage = (
  type: 'manual' | 'automatic' | 'battery_low',
  location: LocationData,
  batteryLevel: number
) => {
  const timestamp = new Date(location.timestamp).toLocaleString();
  const alertTypeText = type === 'manual' ? 'Manual SOS Alert' : 
                       type === 'automatic' ? 'Automatic Inactivity Alert' : 
                       'Low Battery Alert';
  
  let message = `🚨 SAFEGUARD EMERGENCY ALERT 🚨\n\n`;
  message += `Alert Type: ${alertTypeText}\n`;
  message += `Time: ${timestamp}\n`;
  message += `Battery: ${Math.round(batteryLevel)}%\n\n`;
  
  if (location.address) {
    message += `Location: ${location.address}\n`;
  }
  
  message += `Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n\n`;
  message += `Google Maps: https://maps.google.com/?q=${location.latitude},${location.longitude}\n\n`;
  
  if (type === 'battery_low') {
    message += `I may not be able to respond to messages soon.`;
  } else {
    message += `Please check on me immediately!`;
  }

  return message;
};
