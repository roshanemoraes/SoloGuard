import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider as PaperProvider} from 'react-native-paper';
import {StatusBar} from 'react-native';

// Screens
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import DestinationsScreen from './screens/DestinationsScreen';
import ContactsScreen from './screens/ContactsScreen';
import TripHistoryScreen from './screens/TripHistoryScreen';

// Services
import {initializeDatabase} from './services/DatabaseService';
import {requestPermissions} from './services/PermissionService';
import {initializeLocationService} from './services/LocationService';
import {initializeSensorService} from './services/SensorService';
import {initializeBackgroundTaskService} from './services/BackgroundTaskService';

const Stack = createStackNavigator();

const App = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await initializeDatabase();
      
      // Request permissions
      await requestPermissions();
      
      // Initialize services
      initializeLocationService();
      initializeSensorService();
      initializeBackgroundTaskService();
      
      console.log('SafeGuard app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  return (
    <PaperProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'SafeGuard'}}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: 'Settings'}}
          />
          <Stack.Screen
            name="Destinations"
            component={DestinationsScreen}
            options={{title: 'Planned Destinations'}}
          />
          <Stack.Screen
            name="Contacts"
            component={ContactsScreen}
            options={{title: 'Emergency Contacts'}}
          />
          <Stack.Screen
            name="TripHistory"
            component={TripHistoryScreen}
            options={{title: 'Trip History'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
