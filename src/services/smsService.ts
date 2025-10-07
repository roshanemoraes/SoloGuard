import * as SMS from 'expo-sms';
import { LocationData, EmergencyContact, SOSAlert } from '../types';

export class SMSService {
  async isAvailable(): Promise<boolean> {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      return isAvailable;
    } catch (error) {
      console.error('Error checking SMS availability:', error);
      return false;
    }
  }

  async sendSOSAlert(
    location: LocationData,
    contacts: EmergencyContact[],
    batteryLevel: number,
    alertType: 'manual' | 'automatic' | 'battery_low' = 'manual'
  ): Promise<{ success: boolean; sentTo: string[]; failed: string[] }> {
    try {
      const isSMSAvailable = await this.isAvailable();
      if (!isSMSAvailable) {
        throw new Error('SMS is not available on this device');
      }

      const activeContacts = contacts.filter(contact => contact.isActive);
      if (activeContacts.length === 0) {
        throw new Error('No active emergency contacts found');
      }

      const message = this.createSOSMessage(location, batteryLevel, alertType);
      const phoneNumbers = activeContacts.map(contact => contact.phoneNumber);

      const result = await SMS.sendSMSAsync(phoneNumbers, message);
      
      const sentTo: string[] = [];
      const failed: string[] = [];

      // Parse result to determine which messages were sent successfully
      if (result.result === 'sent') {
        sentTo.push(...phoneNumbers);
      } else {
        failed.push(...phoneNumbers);
      }

      return {
        success: sentTo.length > 0,
        sentTo,
        failed,
      };
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      return {
        success: false,
        sentTo: [],
        failed: contacts.map(contact => contact.phoneNumber),
      };
    }
  }

  private createSOSMessage(
    location: LocationData,
    batteryLevel: number,
    alertType: string
  ): string {
    const timestamp = new Date(location.timestamp).toLocaleString();
    const alertTypeText = this.getAlertTypeText(alertType);
    
    let message = `🚨 SAFEGUARD EMERGENCY ALERT 🚨\n\n`;
    message += `Alert Type: ${alertTypeText}\n`;
    message += `Time: ${timestamp}\n`;
    message += `Battery: ${Math.round(batteryLevel)}%\n\n`;
    
    if (location.address) {
      message += `Location: ${location.address}\n`;
    }
    
    message += `Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n\n`;
    message += `Google Maps: https://maps.google.com/?q=${location.latitude},${location.longitude}\n\n`;
    message += `Please check on me immediately!`;

    return message;
  }

  private getAlertTypeText(alertType: string): string {
    switch (alertType) {
      case 'manual':
        return 'Manual SOS Alert';
      case 'automatic':
        return 'Automatic Inactivity Alert';
      case 'battery_low':
        return 'Low Battery Alert';
      default:
        return 'Emergency Alert';
    }
  }

  async sendTestMessage(phoneNumber: string): Promise<boolean> {
    try {
      const isSMSAvailable = await this.isAvailable();
      if (!isSMSAvailable) {
        throw new Error('SMS is not available on this device');
      }

      const message = '🚨 SafeGuard Test Message 🚨\n\nThis is a test message from SafeGuard to verify SMS functionality.';
      
      const result = await SMS.sendSMSAsync([phoneNumber], message);
      return result.result === 'sent';
    } catch (error) {
      console.error('Error sending test message:', error);
      return false;
    }
  }

  async sendBatteryLowAlert(
    location: LocationData,
    contacts: EmergencyContact[],
    batteryLevel: number
  ): Promise<{ success: boolean; sentTo: string[]; failed: string[] }> {
    try {
      const isSMSAvailable = await this.isAvailable();
      if (!isSMSAvailable) {
        throw new Error('SMS is not available on this device');
      }

      const activeContacts = contacts.filter(contact => contact.isActive);
      if (activeContacts.length === 0) {
        throw new Error('No active emergency contacts found');
      }

      const message = this.createBatteryLowMessage(location, batteryLevel);
      const phoneNumbers = activeContacts.map(contact => contact.phoneNumber);

      const result = await SMS.sendSMSAsync(phoneNumbers, message);
      
      const sentTo: string[] = [];
      const failed: string[] = [];

      if (result.result === 'sent') {
        sentTo.push(...phoneNumbers);
      } else {
        failed.push(...phoneNumbers);
      }

      return {
        success: sentTo.length > 0,
        sentTo,
        failed,
      };
    } catch (error) {
      console.error('Error sending battery low alert:', error);
      return {
        success: false,
        sentTo: [],
        failed: contacts.map(contact => contact.phoneNumber),
      };
    }
  }

  private createBatteryLowMessage(
    location: LocationData,
    batteryLevel: number
  ): string {
    const timestamp = new Date(location.timestamp).toLocaleString();
    
    let message = `🔋 SAFEGUARD BATTERY ALERT 🔋\n\n`;
    message += `My phone battery is critically low (${Math.round(batteryLevel)}%)\n`;
    message += `Time: ${timestamp}\n\n`;
    
    if (location.address) {
      message += `Last Known Location: ${location.address}\n`;
    }
    
    message += `Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n\n`;
    message += `Google Maps: https://maps.google.com/?q=${location.latitude},${location.longitude}\n\n`;
    message += `I may not be able to respond to messages soon.`;

    return message;
  }
}

export const smsService = new SMSService();
