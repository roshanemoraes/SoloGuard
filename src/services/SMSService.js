import {databaseService} from './DatabaseService';
import {locationService} from './LocationService';
import {Alert, Linking, Platform} from 'react-native';

class SMSService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Check if SMS is available on this device
      const canSendSMS = await this.checkSMSCapability();
      this.isInitialized = canSendSMS;
      
      if (!canSendSMS) {
        console.warn('SMS service not available on this device');
      } else {
        console.log('SMS service initialized');
      }
    } catch (error) {
      console.error('SMS service initialization failed:', error);
      this.isInitialized = false;
    }
  }

  async checkSMSCapability() {
    try {
      // Check if device can send SMS
      return await Linking.canOpenURL('sms:');
    } catch (error) {
      console.error('Failed to check SMS capability:', error);
      return false;
    }
  }

  async sendSOSAlert() {
    try {
      if (!this.isInitialized) {
        throw new Error('SMS service not initialized');
      }

      // Get emergency contacts
      const contacts = await databaseService.getActiveEmergencyContacts();
      if (contacts.length === 0) {
        throw new Error('No emergency contacts configured');
      }

      // Get current location and recent history
      const currentLocation = await locationService.getCurrentLocation();
      const recentLocations = await locationService.getRecentLocationHistory(5);

      // Build SOS message
      const message = this.buildSOSMessage(currentLocation, recentLocations);

      // Send to all active contacts
      const results = [];
      for (const contact of contacts) {
        try {
          const result = await this.sendSMS(contact.phoneNumber, message);
          results.push({
            contact: contact.name,
            phoneNumber: contact.phoneNumber,
            success: result.success,
            error: result.error,
          });

          // Log SMS sent
          await databaseService.logActivity(
            'SMS_SENT',
            `SOS SMS sent to ${contact.name} (${contact.phoneNumber})`,
            currentLocation,
          );
        } catch (error) {
          console.error(`Failed to send SMS to ${contact.name}:`, error);
          results.push({
            contact: contact.name,
            phoneNumber: contact.phoneNumber,
            success: false,
            error: error.message,
          });
        }
      }

      // Log overall SOS activity
      await databaseService.logActivity(
        'SOS_ALERT_SENT',
        `SOS alert sent to ${contacts.length} contacts`,
        currentLocation,
      );

      return results;
    } catch (error) {
      console.error('Failed to send SOS alert:', error);
      
      // Log error
      await databaseService.logActivity(
        'SOS_ALERT_FAILED',
        `SOS alert failed: ${error.message}`,
      );
      
      throw error;
    }
  }

  async sendLowBatteryAlert() {
    try {
      if (!this.isInitialized) {
        throw new Error('SMS service not initialized');
      }

      // Get primary emergency contact
      const primaryContact = await databaseService.getPrimaryEmergencyContact();
      if (!primaryContact) {
        throw new Error('No primary emergency contact configured');
      }

      // Get last known location
      const lastLocation = await locationService.getLastKnownLocation();
      const batteryLevel = locationService.getCurrentBatteryLevel();

      // Build low battery message
      const message = this.buildLowBatteryMessage(lastLocation, batteryLevel);

      // Send SMS
      const result = await this.sendSMS(primaryContact.phoneNumber, message);

      // Log SMS sent
      await databaseService.logActivity(
        'LOW_BATTERY_SMS_SENT',
        `Low battery SMS sent to ${primaryContact.name}`,
        lastLocation,
      );

      return result;
    } catch (error) {
      console.error('Failed to send low battery alert:', error);
      
      // Log error
      await databaseService.logActivity(
        'LOW_BATTERY_SMS_FAILED',
        `Low battery SMS failed: ${error.message}`,
      );
      
      throw error;
    }
  }

  async sendSMS(phoneNumber, message) {
    try {
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
      
      // Create SMS URL
      const smsUrl = `sms:${cleanPhoneNumber}?body=${encodeURIComponent(message)}`;
      
      // Open SMS app
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (!canOpen) {
        throw new Error('Cannot open SMS app');
      }

      await Linking.openURL(smsUrl);
      
      return {
        success: true,
        phoneNumber: cleanPhoneNumber,
        message: message,
      };
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return {
        success: false,
        phoneNumber: phoneNumber,
        error: error.message,
      };
    }
  }

  buildSOSMessage(currentLocation, recentLocations = []) {
    const timestamp = new Date().toLocaleString();
    
    let message = `🚨 SOS ALERT from SafeGuard\n\n`;
    message += `Emergency detected at ${timestamp}\n\n`;
    
    if (currentLocation) {
      message += `📍 CURRENT LOCATION:\n`;
      message += `Latitude: ${currentLocation.latitude}\n`;
      message += `Longitude: ${currentLocation.longitude}\n`;
      message += `Accuracy: ${currentLocation.accuracy}m\n\n`;
    }
    
    if (recentLocations.length > 0) {
      message += `📍 RECENT LOCATIONS:\n`;
      recentLocations.forEach((location, index) => {
        const time = new Date(location.timestamp).toLocaleString();
        message += `${index + 1}. ${time}\n`;
        message += `   Lat: ${location.latitude}, Lng: ${location.longitude}\n`;
        message += `   Battery: ${location.batteryLevel}%\n\n`;
      });
    }
    
    message += `⚠️ Please check on me immediately!\n`;
    message += `📱 Sent via SafeGuard App`;
    
    return message;
  }

  buildLowBatteryMessage(lastLocation, batteryLevel) {
    const timestamp = new Date().toLocaleString();
    
    let message = `🔋 LOW BATTERY ALERT from SafeGuard\n\n`;
    message += `Battery critically low: ${batteryLevel}%\n`;
    message += `Alert time: ${timestamp}\n\n`;
    
    if (lastLocation) {
      message += `📍 LAST KNOWN LOCATION:\n`;
      message += `Latitude: ${lastLocation.latitude}\n`;
      message += `Longitude: ${lastLocation.longitude}\n`;
      message += `Time: ${new Date(lastLocation.timestamp).toLocaleString()}\n\n`;
    }
    
    message += `⚠️ Please check on me!\n`;
    message += `📱 Sent via SafeGuard App`;
    
    return message;
  }

  async sendCustomMessage(phoneNumber, message) {
    try {
      if (!this.isInitialized) {
        throw new Error('SMS service not initialized');
      }

      const result = await this.sendSMS(phoneNumber, message);
      
      // Log custom message sent
      await databaseService.logActivity(
        'CUSTOM_SMS_SENT',
        `Custom SMS sent to ${phoneNumber}`,
      );
      
      return result;
    } catch (error) {
      console.error('Failed to send custom message:', error);
      throw error;
    }
  }

  // Test SMS functionality
  async testSMS(phoneNumber) {
    try {
      const testMessage = `🧪 SafeGuard Test Message\n\nThis is a test message to verify SMS functionality.\n\nTime: ${new Date().toLocaleString()}\n\nSent via SafeGuard App`;
      
      const result = await this.sendSMS(phoneNumber, testMessage);
      
      // Log test SMS
      await databaseService.logActivity(
        'TEST_SMS_SENT',
        `Test SMS sent to ${phoneNumber}`,
      );
      
      return result;
    } catch (error) {
      console.error('Failed to send test SMS:', error);
      throw error;
    }
  }

  // Get SMS service status
  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      canSendSMS: this.isInitialized,
    };
  }

  // Format phone number for SMS
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add country code if not present (assuming Sri Lanka +94)
    if (!formatted.startsWith('+') && !formatted.startsWith('94')) {
      if (formatted.startsWith('0')) {
        formatted = '+94' + formatted.substring(1);
      } else {
        formatted = '+94' + formatted;
      }
    }
    
    return formatted;
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+94|94|0)?[1-9][0-9]{8}$/;
    return phoneRegex.test(cleaned);
  }
}

// Export singleton instance
export const smsService = new SMSService();
export const initializeSMSService = () => smsService.initialize();
export default smsService;
