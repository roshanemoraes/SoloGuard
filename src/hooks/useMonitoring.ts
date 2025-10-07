import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { monitoringService } from '../services/monitoringService';
import { Alert } from 'react-native';

export const useMonitoring = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    isMonitoring,
    lastLocation,
    batteryStatus,
    emergencyContacts,
    settings,
    setMonitoring,
  } = useAppStore();

  useEffect(() => {
    initializeMonitoring();
    return () => {
      // Cleanup on unmount
      monitoringService.stopMonitoring();
    };
  }, []);

  const initializeMonitoring = async () => {
    try {
      if (settings.monitoringEnabled) {
        await monitoringService.startMonitoring();
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
      Alert.alert('Monitoring Error', 'Failed to start monitoring. Please check your permissions.');
      setIsInitialized(true);
    }
  };

  const startMonitoring = async () => {
    try {
      const success = await monitoringService.startMonitoring();
      if (!success) {
        Alert.alert('Error', 'Failed to start monitoring. Please check your settings.');
      }
      return success;
    } catch (error) {
      console.error('Error starting monitoring:', error);
      Alert.alert('Error', 'Failed to start monitoring.');
      return false;
    }
  };

  const stopMonitoring = () => {
    try {
      monitoringService.stopMonitoring();
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    }
  };

  const toggleMonitoring = async () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      await startMonitoring();
    }
  };

  const sendSOSAlert = async (type: 'manual' | 'automatic' | 'battery_low' = 'manual') => {
    try {
      if (emergencyContacts.length === 0) {
        Alert.alert('No Emergency Contacts', 'Please add emergency contacts in Settings first.');
        return false;
      }

      if (!lastLocation) {
        Alert.alert('No Location', 'Location not available. Please check your location permissions.');
        return false;
      }

      const success = await monitoringService.sendSOSAlert(type);
      return success;
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      Alert.alert('Error', 'Failed to send SOS alert.');
      return false;
    }
  };

  const getMonitoringStatus = () => {
    return monitoringService.getMonitoringStatus();
  };

  return {
    isInitialized,
    isMonitoring,
    lastLocation,
    batteryStatus,
    emergencyContacts,
    settings,
    startMonitoring,
    stopMonitoring,
    toggleMonitoring,
    sendSOSAlert,
    getMonitoringStatus,
  };
};
