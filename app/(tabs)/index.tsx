import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppStore } from "../../src/stores/useAppStore";
import { monitoringService } from "../../src/services/monitoringService";
import { batteryService } from "../../src/services/batteryService";
import * as Battery from "expo-battery"; // for enum values
import { useI18n } from "../../src/stores/useI18n";

export default function HomeScreen() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [sosResult, setSosResult] = useState<null | { status: "success" | "error"; message: string }>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const {
    isMonitoring,
    lastLocation,
    batteryStatus,
    emergencyContacts,
    isEmergencyMode,
    settings,
    updateBatteryStatus,
    userProfile,
  } = useAppStore();
  const { t } = useI18n();
  const hasActiveContacts = emergencyContacts.some((c) => c.isActive);

  // Check if profile is complete
  const isProfileComplete = userProfile.fullName && userProfile.fullName.trim().length >= 2;

  useEffect(() => {
    // Check profile completion on mount
    if (!isProfileComplete) {
      setShowProfileModal(true);
    }
  }, [isProfileComplete]);

  useEffect(() => {
    // Initialize monitoring on app start
    initializeMonitoring();
  }, []);

  useEffect(() => {
    // Realtime battery listener even when monitoring is paused
    batteryService.startBatteryMonitoring(
      (status) => {
        updateBatteryStatus(status);
      },
      settings.updateInterval * 1000
    );

    return () => {
      batteryService.stopBatteryMonitoring();
    };
  }, [settings.updateInterval, updateBatteryStatus]);

  // Auto-dismiss SOS result popup after 5 seconds
  useEffect(() => {
    if (sosResult) {
      const timer = setTimeout(() => {
        setSosResult(null);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [sosResult]);

  const initializeMonitoring = async () => {
    try {
      await monitoringService.startMonitoring();
    } catch (error) {
      console.error("Failed to initialize monitoring:", error);
    }
  };

  const handleSOSPress = () => {
    setShowSOSConfirm(true);
  };

  const confirmSendSOS = async () => {
    try {
      if (!hasActiveContacts || !lastLocation) {
        setSosResult({
          status: "error",
          message: !hasActiveContacts
            ? t("sosMissingContact")
            : t("sosMissingLocation"),
        });
        setShowSOSConfirm(false);
        return;
      }

      setSosSending(true);
      const success = await monitoringService.sendSOSAlert("manual");
      setSosResult(
        success
          ? { status: "success", message: t("sosSentMessage") }
          : { status: "error", message: t("sosFailedMessage") }
      );
    } catch (error) {
      setSosResult({ status: "error", message: t("sosRetry") });
    } finally {
      setSosSending(false);
      setShowSOSConfirm(false);
    }
  };

  const toggleMonitoring = async () => {
    try {
      if (isMonitoring) {
        monitoringService.stopMonitoring();
      } else {
        await monitoringService.startMonitoring();
      }
    } catch (error) {
      setSosResult({ status: "error", message: t("sosRetry") });
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
    if (percent > 15) return "battery-half"; // battery-low doesn't exist in Ionicons
    return "battery-dead";
  };

  /** ---------------- Status helpers ---------------- */
  const getStatusColor = () => {
    if (isEmergencyMode) return "#ef4444";
    if (isMonitoring) return "#22c55e";
    return "#6b7280";
  };

  const getStatusText = () => {
    if (isEmergencyMode) return t("emergencyMode");
    if (isMonitoring) return t("monitoringActive");
    return t("monitoringInactive");
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 bg-gray-50 dark:bg-gray-900"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        pointerEvents={!isProfileComplete ? "none" : "auto"}
      >
      {/* Status Header */}
      <View className="bg-white dark:bg-gray-800 mx-4 mt-4 rounded-lg p-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("status")}
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
            <Text className="text-gray-600 dark:text-gray-300">{t("location")}</Text>
            <Text className="text-sm font-medium text-gray-900 dark:text-white">
              {lastLocation
                ? `${lastLocation.latitude.toFixed(3)}, ${lastLocation.longitude.toFixed(3)}`
                : t("noLocation")}
            </Text>
          </View>

          {/* Battery */}
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600 dark:text-gray-300">{t("battery")}</Text>
            {(() => {
              const percent = getBatteryPercent(batteryStatus?.batteryLevel);
              const charging = isChargingFromStatus(batteryStatus);
              const color = getBatteryColor(percent);
              const icon = getBatteryIcon(percent, charging);
              const lpm =
                (batteryStatus as any)?.lowPowerMode ??
                (batteryStatus as any)?.powerSave ??
                (batteryStatus as any)?.batterySaver;

              const isFull = percent === 100 && !charging;

              return (
                <View className="flex-row items-center space-x-2">
                  <Ionicons name={icon as any} size={18} color={color} />
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">
                    {percent == null ? t("unknown") : `${percent}%`}
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
                        {t("charging")}
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
                        {t("full")}
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
                        {t("lowPower")}
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
              {t("emergencyContacts")}
            </Text>
            <Text className="text-sm font-medium text-gray-900 dark:text-white">
              {emergencyContacts.filter((c) => c.isActive).length} {t("active")}
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
          <Text className="text-white text-xl font-bold mt-2">{t("sos")}</Text>
          <Text className="text-red-100 text-sm mt-1">{t("emergencyAlert")}</Text>
        </Pressable>
        {sosResult && (
          <View className="mt-3 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-2 flex-1 pr-2">
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{
                    backgroundColor:
                      sosResult.status === "success" ? "#dcfce7" : "#fee2e2",
                  }}
                >
                  <Ionicons
                    name={sosResult.status === "success" ? "checkmark-circle" : "alert-circle"}
                    size={20}
                    color={sosResult.status === "success" ? "#16a34a" : "#dc2626"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: sosResult.status === "success" ? "#166534" : "#991b1b" }}
                  >
                    {sosResult.status === "success" ? t("sosSent") : t("sosIssue")}
                  </Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-300">
                    {sosResult.message}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setSosResult(null)} className="p-1">
                <Ionicons name="close" size={18} color="#6b7280" />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View className="mx-4 mt-6">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {t("quickActions")}
        </Text>

        <View className="flex-row space-x-3">
          <Pressable
            onPress={() => router.push("/setup")}
            className="flex-1 bg-blue-600 active:bg-blue-700 rounded-lg p-4 items-center"
          >
            <Ionicons name="settings" size={24} color="white" />
            <Text className="text-white font-medium mt-1">{t("setup")}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/trip")}
            className="flex-1 bg-green-600 active:bg-green-700 rounded-lg p-4 items-center"
          >
            <Ionicons name="map" size={24} color="white" />
            <Text className="text-white font-medium mt-1">{t("tripPlan")}</Text>
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
              {isMonitoring ? t("pause") : t("start")}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Location Info */}
      {lastLocation && (
        <View className="mx-4 mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("currentLocation")}
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
            {t("lastUpdated")}: {new Date(lastLocation.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      )}

      {/* Settings Info */}
      <View className="mx-4 mt-6 mb-8 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t("settings")}
        </Text>
        <View className="space-y-1">
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            {t("inactivityThreshold")}: {settings.inactivityThreshold} minutes
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            {t("batteryAlert")}: {settings.batteryThreshold}%
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            {t("updateInterval")}: {settings.updateInterval} seconds
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            {t("autoSOS")}: {settings.autoSOSEnabled ? t("enabled") : t("disabled")}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            {t("preferMMS")}: {settings.preferMMS ? t("yes") : t("no")}
          </Text>
        </View>
      </View>

      {/* Profile completion modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-4">
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center mb-3">
                <Ionicons name="person-add" size={32} color="#2563eb" />
              </View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
                Complete Your Profile
              </Text>
            </View>

            <Text className="text-sm text-gray-700 dark:text-gray-300 text-center mb-6">
              Before you can use SoloGuard, please complete your profile information. This helps us protect you better in case of emergencies.
            </Text>

            <View className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6 border border-blue-100 dark:border-blue-800">
              <View className="flex-row items-start space-x-2">
                <Ionicons name="information-circle" size={20} color="#2563eb" />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    Required Information:
                  </Text>
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    • Full name (at least 2 characters){'\n'}
                    • Emergency contacts{'\n'}
                    • Optional: Phone, email, medical info
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setShowProfileModal(false);
                router.push("/(tabs)/two");
              }}
              className="bg-blue-600 active:bg-blue-700 rounded-lg py-4 items-center mb-3"
            >
              <View className="flex-row items-center space-x-2">
                <Ionicons name="arrow-forward" size={20} color="white" />
                <Text className="text-white font-semibold text-base">
                  Complete Profile Now
                </Text>
              </View>
            </Pressable>

            <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
              You won't be able to use the app until your profile is complete.
            </Text>
          </View>
        </View>
      </Modal>

      {/* SOS confirmation modal */}
      <Modal
        visible={showSOSConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSOSConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSOSConfirm(false)}>
          <View className="flex-1 bg-black/40" />
        </TouchableWithoutFeedback>
        <View
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-700"
          style={{ position: "absolute", left: 16, right: 16, top: "25%" }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center space-x-2">
              <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 items-center justify-center">
                <Ionicons name="warning" size={22} color="#dc2626" />
              </View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {t("sendSOSQuestion")}
              </Text>
            </View>
            <Pressable onPress={() => setShowSOSConfirm(false)}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </Pressable>
          </View>
          <Text className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {t("sosModalBody")}
          </Text>
          {(!hasActiveContacts || !lastLocation) && (
            <View className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 border border-red-100 dark:border-red-800 mb-4">
              <View className="flex-row space-x-2">
                <Ionicons name="information-circle" size={16} color="#dc2626" />
                <View className="flex-1">
                  <Text className="text-xs text-red-800 dark:text-red-200">
                    {t("sosTip")}
                  </Text>
                </View>
              </View>
            </View>
          )}
          <View className="flex-row space-x-3">
            <Pressable
              onPress={() => setShowSOSConfirm(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-800 dark:text-gray-100 font-semibold">{t("cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={confirmSendSOS}
              disabled={sosSending}
              className={`flex-1 rounded-lg py-3 items-center ${
                sosSending ? "bg-red-400" : "bg-red-600 active:bg-red-700"
              }`}
            >
              <Text className="text-white font-semibold">
                {sosSending ? t("sending") : t("sendSOS")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      </ScrollView>

      {/* Blur overlay when profile incomplete */}
      {!isProfileComplete && (
        <View
          className="absolute inset-0 bg-gray-900/20"
          pointerEvents="none"
        />
      )}
    </View>
  );
}


