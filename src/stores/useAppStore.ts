import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppState,
  LocationData,
  BatteryStatus,
  EmergencyContact,
  AppSettings,
  MonitoringLog,
  SOSAlert,
  UserProfile,
  TripDestination,
  NearbyPlace,
} from '../types';

interface AppStore extends AppState {
  // Actions
  setMonitoring: (isMonitoring: boolean) => void;
  updateLocation: (location: LocationData) => void;
  updateBatteryStatus: (battery: BatteryStatus) => void;
  addEmergencyContact: (contact: EmergencyContact) => void;
  updateEmergencyContact: (id: string, contact: Partial<EmergencyContact>) => void;
  removeEmergencyContact: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addMonitoringLog: (log: MonitoringLog) => void;
  setEmergencyMode: (isEmergency: boolean) => void;
  clearLogs: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  addTripDestination: (destination: TripDestination) => void;
  removeTripDestination: (id: string) => void;
  clearTripDestinations: () => void;
  setNearbyPlacesForDestination: (destinationId: string, places: NearbyPlace[]) => void;
}

const defaultSettings: AppSettings = {
  inactivityThreshold: 30, // 30 minutes
  batteryThreshold: 10, // 10%
  monitoringEnabled: true,
  autoSOSEnabled: true,
  notificationsEnabled: true,
  updateInterval: 60, // 60 seconds
  preferMMS: false,
};

const defaultProfile: UserProfile = {
  fullName: '',
  username: '',
  phoneNumber: '',
  email: '',
  medicalInfo: '',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isMonitoring: false,
      lastLocation: undefined,
      batteryStatus: undefined,
      emergencyContacts: [],
      settings: defaultSettings,
      monitoringLogs: [],
      isEmergencyMode: false,
      userProfile: defaultProfile,
      tripDestinations: [],
      tripNearbyCache: {},

      // Actions
      setMonitoring: (isMonitoring) => set({ isMonitoring }),
      
      updateLocation: (location) => set({ lastLocation: location }),
      
      updateBatteryStatus: (batteryStatus) => set({ batteryStatus }),
      
      addEmergencyContact: (contact) => set((state) => ({
        emergencyContacts: [...state.emergencyContacts, contact]
      })),
      
      updateEmergencyContact: (id, contactUpdate) => set((state) => ({
        emergencyContacts: state.emergencyContacts.map(contact =>
          contact.id === id ? { ...contact, ...contactUpdate } : contact
        )
      })),
      
      removeEmergencyContact: (id) => set((state) => ({
        emergencyContacts: state.emergencyContacts.filter(contact => contact.id !== id)
      })),
      
      updateSettings: (settingsUpdate) => set((state) => ({
        settings: { ...state.settings, ...settingsUpdate }
      })),
      
      addMonitoringLog: (log) => set((state) => ({
        monitoringLogs: [...state.monitoringLogs, log].slice(-100) // Keep last 100 logs
      })),
      
      setEmergencyMode: (isEmergencyMode) => set({ isEmergencyMode }),
      
      clearLogs: () => set({ monitoringLogs: [] }),

      updateUserProfile: (profile) => set((state) => ({
        userProfile: { ...state.userProfile, ...profile }
      })),

      addTripDestination: (destination) => set((state) => ({
        tripDestinations: [...state.tripDestinations, destination],
      })),

      removeTripDestination: (id) => set((state) => ({
        tripDestinations: state.tripDestinations.filter((d) => d.id !== id),
      })),

      clearTripDestinations: () => set({ tripDestinations: [] }),

      setNearbyPlacesForDestination: (destinationId, places) =>
        set((state) => ({
          tripNearbyCache: { ...state.tripNearbyCache, [destinationId]: places },
        })),
    }),
    {
      name: 'safeguard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        emergencyContacts: state.emergencyContacts,
        settings: state.settings,
        monitoringLogs: state.monitoringLogs,
        userProfile: state.userProfile,
        tripDestinations: state.tripDestinations,
        tripNearbyCache: state.tripNearbyCache,
      }),
    }
  )
);
