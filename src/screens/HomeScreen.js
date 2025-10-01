import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Services
import {locationService} from '../services/LocationService';
import {sensorService} from '../services/SensorService';
import {smsService} from '../services/SMSService';
import {databaseService} from '../services/DatabaseService';
import {backgroundTaskService} from '../services/BackgroundTaskService';

const {width, height} = Dimensions.get('window');

const HomeScreen = ({navigation}) => {
  const [isTripActive, setIsTripActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [emergencyContactsCount, setEmergencyContactsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
      return () => {
        // Cleanup if needed
      };
    }, []),
  );

  useEffect(() => {
    if (isTripActive) {
      startLocationUpdates();
    } else {
      stopLocationUpdates();
    }
  }, [isTripActive]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Check if trip is active
      const activeSession = await databaseService.getActiveTripSession();
      setIsTripActive(!!activeSession);

      // Get emergency contacts count
      const contacts = await databaseService.getActiveEmergencyContacts();
      setEmergencyContactsCount(contacts.length);

      // Get current location if trip is active
      if (activeSession) {
        await updateLocation();
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationUpdates = async () => {
    try {
      await locationService.startLocationTracking();
      await sensorService.startActivityMonitoring();
      await backgroundTaskService.startBackgroundTasks();
      await updateLocation();
    } catch (error) {
      console.error('Failed to start location updates:', error);
      Alert.alert('Error', 'Failed to start location tracking. Please check permissions.');
    }
  };

  const stopLocationUpdates = async () => {
    try {
      await locationService.stopLocationTracking();
      await sensorService.stopActivityMonitoring();
      await backgroundTaskService.stopBackgroundTasks();
    } catch (error) {
      console.error('Failed to stop location updates:', error);
    }
  };

  const updateLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setBatteryLevel(locationService.getCurrentBatteryLevel());
        setLastUpdateTime(new Date());
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const handleStartTrip = async () => {
    try {
      if (emergencyContactsCount === 0) {
        Alert.alert(
          'No Emergency Contacts',
          'Please add at least one emergency contact before starting a trip.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Add Contacts', onPress: () => navigation.navigate('Contacts')},
          ],
        );
        return;
      }

      setIsLoading(true);
      await databaseService.startTripSession();
      setIsTripActive(true);
      
      Alert.alert('Trip Started', 'SafeGuard is now monitoring your safety.');
    } catch (error) {
      console.error('Failed to start trip:', error);
      Alert.alert('Error', 'Failed to start trip monitoring.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTrip = async () => {
    Alert.alert(
      'Stop Trip Monitoring',
      'Are you sure you want to stop trip monitoring?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await databaseService.stopTripSession();
              setIsTripActive(false);
              setCurrentLocation(null);
              setLastUpdateTime(null);
            } catch (error) {
              console.error('Failed to stop trip:', error);
              Alert.alert('Error', 'Failed to stop trip monitoring.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleSOSAlert = async () => {
    Alert.alert(
      '🚨 EMERGENCY SOS',
      'This will send your location to all emergency contacts. Are you in immediate danger?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'SEND SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Trigger emergency location update
              await locationService.triggerEmergencyLocationUpdate();
              
              // Send SOS alert
              const results = await smsService.sendSOSAlert();
              
              // Show results
              const successCount = results.filter(r => r.success).length;
              const totalCount = results.length;
              
              Alert.alert(
                'SOS Alert Sent',
                `Emergency alert sent to ${successCount}/${totalCount} contacts.`,
              );
            } catch (error) {
              console.error('Failed to send SOS alert:', error);
              Alert.alert('Error', 'Failed to send SOS alert. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const formatLocation = (location) => {
    if (!location) return 'Not available';
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    return timestamp.toLocaleTimeString();
  };

  const getBatteryColor = (level) => {
    if (level < 10) return '#f44336';
    if (level < 20) return '#ff9800';
    return '#4caf50';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1976d2" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1976d2', '#1565c0']}
        style={styles.header}>
        <Text style={styles.headerTitle}>SafeGuard</Text>
        <Text style={styles.headerSubtitle}>Solo Traveler Protection</Text>
      </LinearGradient>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Icon name="location-on" size={20} color="#666" />
          <Text style={styles.statusLabel}>Location:</Text>
          <Text style={styles.statusValue}>{formatLocation(currentLocation)}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Icon name="battery-std" size={20} color={getBatteryColor(batteryLevel)} />
          <Text style={styles.statusLabel}>Battery:</Text>
          <Text style={[styles.statusValue, {color: getBatteryColor(batteryLevel)}]}>
            {batteryLevel}%
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Icon name="access-time" size={20} color="#666" />
          <Text style={styles.statusLabel}>Last Update:</Text>
          <Text style={styles.statusValue}>{formatTime(lastUpdateTime)}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Icon name="contacts" size={20} color="#666" />
          <Text style={styles.statusLabel}>Emergency Contacts:</Text>
          <Text style={styles.statusValue}>{emergencyContactsCount}</Text>
        </View>
      </View>

      {/* Trip Control */}
      <TouchableOpacity
        style={[styles.tripButton, isTripActive && styles.tripButtonActive]}
        onPress={isTripActive ? handleStopTrip : handleStartTrip}
        disabled={isLoading}>
        <LinearGradient
          colors={isTripActive ? ['#f44336', '#d32f2f'] : ['#4caf50', '#388e3c']}
          style={styles.tripButtonGradient}>
          <Icon 
            name={isTripActive ? 'stop' : 'play-arrow'} 
            size={24} 
            color="white" 
          />
          <Text style={styles.tripButtonText}>
            {isTripActive ? 'Stop Trip' : 'Start Trip'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* SOS Button */}
      <TouchableOpacity
        style={styles.sosButton}
        onPress={handleSOSAlert}
        disabled={!isTripActive || isLoading}>
        <LinearGradient
          colors={['#f44336', '#d32f2f']}
          style={styles.sosButtonGradient}>
          <Text style={styles.sosButtonText}>SOS</Text>
          <Text style={styles.sosButtonSubtext}>Emergency Alert</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Contacts')}>
          <Icon name="contacts" size={24} color="#1976d2" />
          <Text style={styles.quickActionText}>Contacts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Destinations')}>
          <Icon name="place" size={24} color="#1976d2" />
          <Text style={styles.quickActionText}>Destinations</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings" size={24} color="#1976d2" />
          <Text style={styles.quickActionText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('TripHistory')}>
          <Icon name="history" size={24} color="#1976d2" />
          <Text style={styles.quickActionText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Trip Status Indicator */}
      <View style={styles.tripStatusIndicator}>
        <View style={[
          styles.statusDot, 
          {backgroundColor: isTripActive ? '#4caf50' : '#9e9e9e'}
        ]} />
        <Text style={styles.tripStatusText}>
          {isTripActive ? 'Trip Monitoring Active' : 'Trip Monitoring Inactive'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tripButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tripButtonActive: {
    elevation: 6,
  },
  tripButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  tripButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  sosButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 50,
    elevation: 8,
    shadowColor: '#f44336',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 50,
    minHeight: 120,
  },
  sosButtonText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sosButtonSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 70,
  },
  quickActionText: {
    fontSize: 12,
    color: '#1976d2',
    marginTop: 5,
    textAlign: 'center',
  },
  tripStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  tripStatusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default HomeScreen;
