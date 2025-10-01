import {PermissionsAndroid, Platform, Alert} from 'react-native';

class PermissionService {
  constructor() {
    this.permissions = {
      location: [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      ],
      sms: [
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      ],
      storage: [
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ],
      phone: [
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      ],
    };
  }

  async requestAllPermissions() {
    const results = {};
    
    try {
      // Request location permissions
      results.location = await this.requestLocationPermissions();
      
      // Request SMS permissions
      results.sms = await this.requestSMSPermissions();
      
      // Request storage permissions
      results.storage = await this.requestStoragePermissions();
      
      // Request phone permissions
      results.phone = await this.requestPhonePermissions();
      
      return results;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return results;
    }
  }

  async requestLocationPermissions() {
    if (Platform.OS !== 'android') {
      return {granted: true, permissions: []};
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple(this.permissions.location);
      
      const fineLocationGranted = 
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted';
      const coarseLocationGranted = 
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === 'granted';
      const backgroundLocationGranted = 
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION] === 'granted';

      const allGranted = fineLocationGranted && coarseLocationGranted;

      if (!allGranted) {
        this.showPermissionAlert(
          'Location Permission Required',
          'SafeGuard needs location permission to track your safety. Please enable location access in settings.',
        );
      }

      return {
        granted: allGranted,
        fineLocation: fineLocationGranted,
        coarseLocation: coarseLocationGranted,
        backgroundLocation: backgroundLocationGranted,
        permissions: granted,
      };
    } catch (error) {
      console.error('Location permission request failed:', error);
      return {granted: false, error: error.message};
    }
  }

  async requestSMSPermissions() {
    if (Platform.OS !== 'android') {
      return {granted: true, permissions: []};
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple(this.permissions.sms);
      
      const smsGranted = 
        granted[PermissionsAndroid.PERMISSIONS.SEND_SMS] === 'granted';
      const phoneStateGranted = 
        granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === 'granted';

      if (!smsGranted) {
        this.showPermissionAlert(
          'SMS Permission Required',
          'SafeGuard needs SMS permission to send emergency alerts. Please enable SMS access in settings.',
        );
      }

      return {
        granted: smsGranted,
        sms: smsGranted,
        phoneState: phoneStateGranted,
        permissions: granted,
      };
    } catch (error) {
      console.error('SMS permission request failed:', error);
      return {granted: false, error: error.message};
    }
  }

  async requestStoragePermissions() {
    if (Platform.OS !== 'android') {
      return {granted: true, permissions: []};
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple(this.permissions.storage);
      
      const writeGranted = 
        granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === 'granted';
      const readGranted = 
        granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === 'granted';

      return {
        granted: writeGranted && readGranted,
        write: writeGranted,
        read: readGranted,
        permissions: granted,
      };
    } catch (error) {
      console.error('Storage permission request failed:', error);
      return {granted: false, error: error.message};
    }
  }

  async requestPhonePermissions() {
    if (Platform.OS !== 'android') {
      return {granted: true, permissions: []};
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple(this.permissions.phone);
      
      const phoneStateGranted = 
        granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === 'granted';
      const callPhoneGranted = 
        granted[PermissionsAndroid.PERMISSIONS.CALL_PHONE] === 'granted';

      return {
        granted: phoneStateGranted,
        phoneState: phoneStateGranted,
        callPhone: callPhoneGranted,
        permissions: granted,
      };
    } catch (error) {
      console.error('Phone permission request failed:', error);
      return {granted: false, error: error.message};
    }
  }

  async checkPermissionStatus(permission) {
    if (Platform.OS !== 'android') {
      return 'granted';
    }

    try {
      return await PermissionsAndroid.check(permission);
    } catch (error) {
      console.error(`Failed to check permission ${permission}:`, error);
      return false;
    }
  }

  async checkAllPermissionStatus() {
    const status = {};
    
    try {
      // Check location permissions
      status.location = {
        fine: await this.checkPermissionStatus(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
        coarse: await this.checkPermissionStatus(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION),
        background: await this.checkPermissionStatus(PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION),
      };

      // Check SMS permissions
      status.sms = {
        send: await this.checkPermissionStatus(PermissionsAndroid.PERMISSIONS.SEND_SMS),
        phoneState: await this.checkPermissionStatus(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE),
      };

      // Check storage permissions
      status.storage = {
        write: await this.checkPermissionStatus(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE),
        read: await this.checkPermissionStatus(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE),
      };

      // Check phone permissions
      status.phone = {
        phoneState: await this.checkPermissionStatus(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE),
        call: await this.checkPermissionStatus(PermissionsAndroid.PERMISSIONS.CALL_PHONE),
      };

      return status;
    } catch (error) {
      console.error('Failed to check permission status:', error);
      return status;
    }
  }

  showPermissionAlert(title, message) {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => this.openAppSettings(),
        },
      ],
    );
  }

  openAppSettings() {
    // This would typically open the app's settings page
    // Implementation depends on the specific navigation library used
    console.log('Opening app settings...');
  }

  // Get permission rationale for showing to user
  getPermissionRationale(permissionType) {
    const rationales = {
      location: {
        title: 'Location Access Required',
        message: 'SafeGuard needs access to your location to track your safety and send accurate emergency alerts to your contacts.',
      },
      sms: {
        title: 'SMS Access Required',
        message: 'SafeGuard needs permission to send SMS messages to your emergency contacts when you need help.',
      },
      storage: {
        title: 'Storage Access Required',
        message: 'SafeGuard needs storage access to save your trip data and emergency information locally.',
      },
      phone: {
        title: 'Phone Access Required',
        message: 'SafeGuard needs phone access to read device information and make emergency calls if needed.',
      },
    };

    return rationales[permissionType] || {
      title: 'Permission Required',
      message: 'This permission is required for SafeGuard to function properly.',
    };
  }

  // Check if all critical permissions are granted
  async areCriticalPermissionsGranted() {
    try {
      const status = await this.checkAllPermissionStatus();
      
      return (
        status.location?.fine === true &&
        status.location?.coarse === true &&
        status.sms?.send === true &&
        status.sms?.phoneState === true
      );
    } catch (error) {
      console.error('Failed to check critical permissions:', error);
      return false;
    }
  }

  // Get missing critical permissions
  async getMissingCriticalPermissions() {
    try {
      const status = await this.checkAllPermissionStatus();
      const missing = [];

      if (status.location?.fine !== true) {
        missing.push('ACCESS_FINE_LOCATION');
      }
      if (status.location?.coarse !== true) {
        missing.push('ACCESS_COARSE_LOCATION');
      }
      if (status.sms?.send !== true) {
        missing.push('SEND_SMS');
      }
      if (status.sms?.phoneState !== true) {
        missing.push('READ_PHONE_STATE');
      }

      return missing;
    } catch (error) {
      console.error('Failed to get missing permissions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
export const requestPermissions = () => permissionService.requestAllPermissions();
export default permissionService;
