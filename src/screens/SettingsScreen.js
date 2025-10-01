import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {databaseService} from '../services/DatabaseService';
import {locationService} from '../services/LocationService';
import {sensorService} from '../services/SensorService';
import {backgroundTaskService} from '../services/BackgroundTaskService';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    locationTracking: true,
    activityMonitoring: true,
    batteryOptimization: true,
    emergencyAlerts: true,
    dataRetention: 7, // days
    updateInterval: 5, // minutes
    inactivityThreshold: 6, // hours
  });
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, []),
  );

  const loadSettings = async () => {
    try {
      // Load settings from AsyncStorage or database
      // For now, using default values
      console.log('Settings loaded');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      setSettings(prev => ({...prev, [key]: value}));
      
      // Apply setting changes
      switch (key) {
        case 'locationTracking':
          if (value) {
            await locationService.startLocationTracking();
          } else {
            await locationService.stopLocationTracking();
          }
          break;
        case 'activityMonitoring':
          if (value) {
            await sensorService.startActivityMonitoring();
          } else {
            await sensorService.stopActivityMonitoring();
          }
          break;
        case 'updateInterval':
          locationService.setUpdateInterval(value * 60 * 1000);
          break;
        case 'inactivityThreshold':
          sensorService.setInactivityThreshold(value);
          break;
      }
      
      // Save settings
      await saveSettings();
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert('Error', 'Failed to update setting.');
    }
  };

  const saveSettings = async () => {
    try {
      // Save settings to AsyncStorage or database
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all trip history, location data, and emergency contacts. This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await databaseService.cleanupOldData(0); // Delete all data
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('Error', 'Failed to clear data.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      // Export trip sessions
      const tripSessions = await databaseService.getAllTripSessions();
      
      // Export location updates
      const locationUpdates = await databaseService.getRecentLocationUpdates(1000);
      
      // Export emergency contacts
      const contacts = await databaseService.getActiveEmergencyContacts();
      
      // Export activity logs
      const activityLogs = await databaseService.getRecentActivityLogs(1000);
      
      const exportData = {
        tripSessions,
        locationUpdates,
        contacts,
        activityLogs,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
      };
      
      // In a real app, you would save this to a file or share it
      console.log('Data exported:', exportData);
      Alert.alert('Success', 'Data exported successfully.');
    } catch (error) {
      console.error('Failed to export data:', error);
      Alert.alert('Error', 'Failed to export data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSMS = async () => {
    try {
      const primaryContact = await databaseService.getPrimaryEmergencyContact();
      if (!primaryContact) {
        Alert.alert('Error', 'No primary emergency contact found.');
        return;
      }
      
      await smsService.testSMS(primaryContact.phoneNumber);
      Alert.alert('Success', 'Test SMS sent successfully.');
    } catch (error) {
      console.error('Failed to send test SMS:', error);
      Alert.alert('Error', 'Failed to send test SMS.');
    }
  };

  const handleBackgroundTaskStatus = async () => {
    try {
      const status = await backgroundTaskService.getBackgroundFetchStatus();
      
      const statusText = `
Background Task Status:
• Enabled: ${status.isEnabled ? 'Yes' : 'No'}
• Background Fetch Status: ${status.backgroundFetchStatus}
• Last Location Update: ${status.lastLocationUpdate ? new Date(status.lastLocationUpdate).toLocaleString() : 'Never'}
• Last Sensor Data: ${status.lastSensorData ? new Date(status.lastSensorData).toLocaleString() : 'Never'}
• Last Battery Check: ${status.lastBatteryCheck ? new Date(status.lastBatteryCheck).toLocaleString() : 'Never'}
      `;
      
      Alert.alert('Background Task Status', statusText);
    } catch (error) {
      console.error('Failed to get background task status:', error);
      Alert.alert('Error', 'Failed to get background task status.');
    }
  };

  const renderSettingItem = (title, description, value, onValueChange, type = 'switch') => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.settingControl}>
        {type === 'switch' ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{false: '#767577', true: '#81b0ff'}}
            thumbColor={value ? '#2196f3' : '#f4f3f4'}
          />
        ) : (
          <TouchableOpacity onPress={onValueChange}>
            <Text style={styles.settingValue}>{value}</Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderActionItem = (title, description, onPress, iconName, color = '#666') => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionInfo}>
        <Icon name={iconName} size={24} color={color} />
        <View style={styles.actionDetails}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionDescription}>{description}</Text>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Monitoring Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monitoring</Text>
        
        {renderSettingItem(
          'Location Tracking',
          'Track your location for safety monitoring',
          settings.locationTracking,
          (value) => handleSettingChange('locationTracking', value)
        )}
        
        {renderSettingItem(
          'Activity Monitoring',
          'Monitor movement and detect inactivity',
          settings.activityMonitoring,
          (value) => handleSettingChange('activityMonitoring', value)
        )}
        
        {renderSettingItem(
          'Battery Optimization',
          'Optimize battery usage during monitoring',
          settings.batteryOptimization,
          (value) => handleSettingChange('batteryOptimization', value)
        )}
      </View>

      {/* Alert Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerts</Text>
        
        {renderSettingItem(
          'Emergency Alerts',
          'Send emergency alerts to contacts',
          settings.emergencyAlerts,
          (value) => handleSettingChange('emergencyAlerts', value)
        )}
        
        {renderActionItem(
          'Test SMS',
          'Send a test SMS to your primary contact',
          handleTestSMS,
          'message',
          '#2196f3'
        )}
        
        {renderActionItem(
          'Background Task Status',
          'View background task status and logs',
          handleBackgroundTaskStatus,
          'sync',
          '#4caf50'
        )}
      </View>

      {/* Data Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        
        {renderActionItem(
          'Update Interval',
          `${settings.updateInterval} minutes`,
          () => {
            // In a real app, you would show a picker
            Alert.alert('Update Interval', 'Select update interval', [
              {text: '1 minute', onPress: () => handleSettingChange('updateInterval', 1)},
              {text: '5 minutes', onPress: () => handleSettingChange('updateInterval', 5)},
              {text: '10 minutes', onPress: () => handleSettingChange('updateInterval', 10)},
              {text: '15 minutes', onPress: () => handleSettingChange('updateInterval', 15)},
              {text: 'Cancel', style: 'cancel'},
            ]);
          },
          'schedule'
        )}
        
        {renderActionItem(
          'Inactivity Threshold',
          `${settings.inactivityThreshold} hours`,
          () => {
            Alert.alert('Inactivity Threshold', 'Select inactivity threshold', [
              {text: '3 hours', onPress: () => handleSettingChange('inactivityThreshold', 3)},
              {text: '6 hours', onPress: () => handleSettingChange('inactivityThreshold', 6)},
              {text: '12 hours', onPress: () => handleSettingChange('inactivityThreshold', 12)},
              {text: '24 hours', onPress: () => handleSettingChange('inactivityThreshold', 24)},
              {text: 'Cancel', style: 'cancel'},
            ]);
          },
          'timer'
        )}
        
        {renderActionItem(
          'Data Retention',
          `Keep data for ${settings.dataRetention} days`,
          () => {
            Alert.alert('Data Retention', 'Select data retention period', [
              {text: '3 days', onPress: () => handleSettingChange('dataRetention', 3)},
              {text: '7 days', onPress: () => handleSettingChange('dataRetention', 7)},
              {text: '30 days', onPress: () => handleSettingChange('dataRetention', 30)},
              {text: '90 days', onPress: () => handleSettingChange('dataRetention', 90)},
              {text: 'Cancel', style: 'cancel'},
            ]);
          },
          'storage'
        )}
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        {renderActionItem(
          'Export Data',
          'Export all your data for backup',
          handleExportData,
          'file-download',
          '#4caf50'
        )}
        
        {renderActionItem(
          'Clear All Data',
          'Delete all trip history and location data',
          handleClearData,
          'delete-forever',
          '#f44336'
        )}
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version:</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Build:</Text>
          <Text style={styles.infoValue}>1</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Last Updated:</Text>
          <Text style={styles.infoValue}>2024-01-01</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingControl: {
    marginLeft: 10,
  },
  settingValue: {
    fontSize: 16,
    color: '#2196f3',
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionDetails: {
    marginLeft: 15,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default SettingsScreen;
