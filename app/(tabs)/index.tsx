import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppStore } from "../../src/stores/useAppStore";
import { monitoringService } from "../../src/services/monitoringService";
import { batteryService } from "../../src/services/batteryService";
import * as Battery from "expo-battery"; // for enum values

export default function HomeScreen() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    isMonitoring,
    lastLocation,
    batteryStatus,
    emergencyContacts,
    isEmergencyMode,
    settings,
  } = useAppStore();

  useEffect(() => {
    // Initialize monitoring on app start
    initializeMonitoring();
  }, []);

  const initializeMonitoring = async () => {
    try {
      await monitoringService.startMonitoring();
    } catch (error) {
      console.error("Failed to initialize monitoring:", error);
    }
  };

  const handleSOSPress = async () => {
    Alert.alert(
      "🚨 EMERGENCY SOS 🚨",
      "Are you sure you want to send an emergency alert to your contacts?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "SEND SOS",
          style: "destructive",
          onPress: async () => {
            const success = await monitoringService.sendSOSAlert("manual");
            if (success) {
              Alert.alert(
                "SOS Sent",
                "Emergency alert has been sent to your contacts."
              );
            } else {
              Alert.alert(
                "SOS Failed",
                "Failed to send emergency alert. Please check your settings."
              );
            }
          },
        },
      ]
    );
  };

  const toggleMonitoring = async () => {
    try {
      if (isMonitoring) {
        monitoringService.stopMonitoring();
      } else {
        await monitoringService.startMonitoring();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to toggle monitoring");
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await initializeMonitoring();
    setIsRefreshing(false);
  };

  /** ---------------- Battery helpers ---------------- */
  const getBatteryPercent = (raw?: number | null) => {
    if (raw == null || Number.isNaN(raw as number)) return null;
    if (raw <= 1) return Math.round(raw * 100); // Expo's 0..1
    if (raw <= 100) return Math.round(raw);     // already 0..100
    // fallback clamp
    return Math.round(Math.max(0, Math.min(100, raw)));
  };

  // IMPORTANT: Only treat CHARGING as "charging" (NOT FULL)
  const isChargingFromStatus = (status: any): boolean => {
    const state = status?.batteryState;
    if (typeof state === "number") {
      return state === Battery.BatteryState.CHARGING;
    }
    // Fallback to common booleans only if enum not present
    if (typeof status?.isCharging === "boolean") return status.isCharging;
    if (typeof status?.charging === "boolean") return status.charging;
    if (typeof status?.batteryState === "string")
      return String(status.batteryState).toLowerCase() === "charging";
    return false;
  };

  const getBatteryColor = (percent: number | null) => {
    if (percent == null) return "#6b7280"; // gray = unknown
    if (percent > 50) return "#22c55e";    // green
    if (percent > 20) return "#f59e0b";    // amber
    return "#ef4444";                      // red
  };

  const getBatteryIcon = (percent: number | null, isCharging: boolean) => {
    if (isCharging) return "battery-charging";
    if (percent == null) return "battery-dead";
    if (percent >= 95) return "battery-full";
    if (percent > 40) return "battery-half";
    if (percent > 15) return "battery-low";
    return "battery-dead";
  };

  /** ---------------- Status helpers ---------------- */
  const getStatusColor = () => {
    if (isEmergencyMode) return "#ef4444";
    if (isMonitoring) return "#22c55e";
    return "#6b7280";
  };

  const getStatusText = () => {
    if (isEmergencyMode) return "EMERGENCY MODE";
    if (isMonitoring) return "MONITORING ACTIVE";
    return "MONITORING INACTIVE";
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Header */}
      <View className="bg-white dark:bg-gray-800 mx-4 mt-4 rounded-lg p-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Status
          </Text>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: getStatusColor() + "20" }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: getStatusColor() }}
            >
              {getStatusText()}
            </Text>
          </View>
        </View>

        <View className="space-y-2">
          {/* Location */}
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600 dark:text-gray-300">Location</Text>
            <Text className="text-sm font-medium text-gray-900 dark:text-white">
              {lastLocation ? "📍 Active" : "❌ No Location"}
            </Text>
          </View>

          {/* Battery */}
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600 dark:text-gray-300">Battery</Text>
            {(() => {
              const percent = getBatteryPercent(batteryStatus?.batteryLevel);
              const charging = isChargingFromStatus(batteryStatus);
              const color = getBatteryColor(percent);
              const icon = getBatteryIcon(percent, charging);
              const lpm =
                (batteryStatus as any)?.lowPowerMode ??
                (batteryStatus as any)?.powerSave ??
                (batteryStatus as any)?.batterySaver;

              // Optional: show "Full" chip when 100% and not charging
              const isFull = percent === 100 && !charging;

              return (
                <View className="flex-row items-center space-x-2">
                  <Ionicons name={icon as any} size={18} color={color} />
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">
                    {percent == null ? "Unknown" : `${percent}%`}
                  </Text>
                  {charging && (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: color + "20" }}
                    >
                      <Text
                        className="text-[10px] font-semibold"
                        style={{ color }}
                      >
                        Charging
                      </Text>
                    </View>
                  )}
                  {isFull && (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: color + "20" }}
                    >
                      <Text
                        className="text-[10px] font-semibold"
                        style={{ color }}
                      >
                        Full
                      </Text>
                    </View>
                  )}
                  {lpm === true && (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#f59e0b20" }}
                    >
                      <Text
                        className="text-[10px] font-semibold"
                        style={{ color: "#f59e0b" }}
                      >
                        Low Power
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>

          {/* Emergency Contacts */}
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600 dark:text-gray-300">
              Emergency Contacts
            </Text>
            <Text className="text-sm font-medium text-gray-900 dark:text-white">
              {emergencyContacts.filter((c) => c.isActive).length} Active
            </Text>
          </View>
        </View>
      </View>

      {/* SOS Button */}
      <View className="mx-4 mt-6">
        <Pressable
          onPress={handleSOSPress}
          className="bg-red-600 active:bg-red-700 rounded-2xl p-8 items-center shadow-lg"
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Ionicons name="warning" size={48} color="white" />
          <Text className="text-white text-xl font-bold mt-2">SOS</Text>
          <Text className="text-red-100 text-sm mt-1">Emergency Alert</Text>
        </Pressable>
      </View>

      {/* Quick Actions */}
      <View className="mx-4 mt-6">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Quick Actions
        </Text>

        <View className="flex-row space-x-3">
          <Pressable
            onPress={() => router.push("/setup")}
            className="flex-1 bg-blue-600 active:bg-blue-700 rounded-lg p-4 items-center"
          >
            <Ionicons name="settings" size={24} color="white" />
            <Text className="text-white font-medium mt-1">Setup</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/trip")}
            className="flex-1 bg-green-600 active:bg-green-700 rounded-lg p-4 items-center"
          >
            <Ionicons name="map" size={24} color="white" />
            <Text className="text-white font-medium mt-1">Trip Plan</Text>
          </Pressable>

          <Pressable
            onPress={toggleMonitoring}
            className={`flex-1 rounded-lg p-4 items-center ${
              isMonitoring
                ? "bg-orange-600 active:bg-orange-700"
                : "bg-gray-600 active:bg-gray-700"
            }`}
          >
            <Ionicons name={isMonitoring ? "pause" : "play"} size={24} color="white" />
            <Text className="text-white font-medium mt-1">
              {isMonitoring ? "Pause" : "Start"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Location Info */}
      {lastLocation && (
        <View className="mx-4 mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Current Location
          </Text>
          {lastLocation.address && (
            <Text className="text-gray-600 dark:text-gray-300 mb-2">
              {lastLocation.address}
            </Text>
          )}
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {lastLocation.latitude.toFixed(6)}, {lastLocation.longitude.toFixed(6)}
          </Text>
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Last updated: {new Date(lastLocation.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* Settings Info */}
      <View className="mx-4 mt-6 mb-8 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Settings
        </Text>
        <View className="space-y-1">
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            Inactivity Threshold: {settings.inactivityThreshold} minutes
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            Battery Alert: {settings.batteryThreshold}%
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            Update Interval: {settings.updateInterval} seconds
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            Auto SOS: {settings.autoSOSEnabled ? "Enabled" : "Disabled"}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            Prefer MMS: {settings.preferMMS ? "Yes (fallback to SMS)" : "No (SMS only)"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
