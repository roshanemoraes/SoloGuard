import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AboutScreen() {
  const router = useRouter();

  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Could not open link");
    }
  };

  const handleSendFeedback = () => {
    Alert.alert(
      "Send Feedback",
      "Would you like to send feedback about SafeGuard?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Email",
          onPress: () =>
            handleOpenLink(
              "mailto:feedback@safeguard.app?subject=SafeGuard Feedback"
            ),
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        {/* App Header */}
        <View className="items-center mb-8">
          <View className="bg-red-600 w-20 h-20 rounded-2xl items-center justify-center mb-4">
            <Ionicons name="shield-checkmark" size={40} color="white" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            SafeGuard
          </Text>
          <Text className="text-lg text-gray-600 dark:text-gray-300 mb-1">
            Version 1.0.0
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Your personal safety companion for solo travel in Sri Lanka
          </Text>
        </View>

        {/* Features */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Features
          </Text>

          <View className="space-y-3">
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <View className="flex-row items-center space-x-3">
                <Ionicons name="location" size={24} color="#3b82f6" />
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900 dark:text-white">
                    Location Tracking
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-300">
                    Continuous GPS monitoring with offline capability
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <View className="flex-row items-center space-x-3">
                <Ionicons name="warning" size={24} color="#ef4444" />
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900 dark:text-white">
                    Emergency SOS
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-300">
                    Instant emergency alerts via SMS to trusted contacts
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <View className="flex-row items-center space-x-3">
                <Ionicons name="move" size={24} color="#10b981" />
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900 dark:text-white">
                    Activity Detection
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-300">
                    Motion sensors detect inactivity and send automatic alerts
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <View className="flex-row items-center space-x-3">
                <Ionicons name="battery-half" size={24} color="#f59e0b" />
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900 dark:text-white">
                    Battery Monitoring
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-300">
                    Low battery alerts with last known location
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <View className="flex-row items-center space-x-3">
                <Ionicons name="map" size={24} color="#8b5cf6" />
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900 dark:text-white">
                    Offline Maps
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-300">
                    Preload destinations for offline access
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* How to Use */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            How to Use
          </Text>

          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <View className="space-y-3">
              <View className="flex-row items-start space-x-3">
                <View className="bg-blue-600 w-6 h-6 rounded-full items-center justify-center mt-0.5">
                  <Text className="text-white text-xs font-bold">1</Text>
                </View>
                <Text className="text-sm text-blue-800 dark:text-blue-200 flex-1">
                  Set up your emergency contacts in the Setup screen
                </Text>
              </View>

              <View className="flex-row items-start space-x-3">
                <View className="bg-blue-600 w-6 h-6 rounded-full items-center justify-center mt-0.5">
                  <Text className="text-white text-xs font-bold">2</Text>
                </View>
                <Text className="text-sm text-blue-800 dark:text-blue-200 flex-1">
                  Configure monitoring settings and thresholds
                </Text>
              </View>

              <View className="flex-row items-start space-x-3">
                <View className="bg-blue-600 w-6 h-6 rounded-full items-center justify-center mt-0.5">
                  <Text className="text-white text-xs font-bold">3</Text>
                </View>
                <Text className="text-sm text-blue-800 dark:text-blue-200 flex-1">
                  Add trip destinations for offline access
                </Text>
              </View>

              <View className="flex-row items-start space-x-3">
                <View className="bg-blue-600 w-6 h-6 rounded-full items-center justify-center mt-0.5">
                  <Text className="text-white text-xs font-bold">4</Text>
                </View>
                <Text className="text-sm text-blue-800 dark:text-blue-200 flex-1">
                  Start monitoring and travel safely!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Safety Tips */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Safety Tips
          </Text>

          <View className="space-y-3">
            <View className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <View className="flex-row items-start space-x-3">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text className="text-sm text-green-800 dark:text-green-200 flex-1">
                  Always inform someone about your travel plans
                </Text>
              </View>
            </View>

            <View className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <View className="flex-row items-start space-x-3">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text className="text-sm text-green-800 dark:text-green-200 flex-1">
                  Keep your phone charged and carry a power bank
                </Text>
              </View>
            </View>

            <View className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <View className="flex-row items-start space-x-3">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text className="text-sm text-green-800 dark:text-green-200 flex-1">
                  Test the SOS feature in a safe environment first
                </Text>
              </View>
            </View>

            <View className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <View className="flex-row items-start space-x-3">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text className="text-sm text-green-800 dark:text-green-200 flex-1">
                  Trust your instincts and avoid risky situations
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact & Support */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Contact & Support
          </Text>

          <View className="space-y-3">
            <Pressable
              onPress={handleSendFeedback}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-row items-center space-x-3"
            >
              <Ionicons name="mail" size={24} color="#3b82f6" />
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  Send Feedback
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Help us improve SafeGuard
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>

            <Pressable
              onPress={() => handleOpenLink("https://safeguard.app/privacy")}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-row items-center space-x-3"
            >
              <Ionicons name="shield" size={24} color="#10b981" />
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  Privacy Policy
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  How we protect your data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>

            <Pressable
              onPress={() => handleOpenLink("https://safeguard.app/terms")}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-row items-center space-x-3"
            >
              <Ionicons name="document-text" size={24} color="#6b7280" />
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  Terms of Service
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Usage terms and conditions
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          </View>
        </View>

        {/* App Info */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            App Information
          </Text>

          <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600 dark:text-gray-300">
                  Version
                </Text>
                <Text className="text-gray-900 dark:text-white font-medium">
                  1.0.0
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-600 dark:text-gray-300">Build</Text>
                <Text className="text-gray-900 dark:text-white font-medium">
                  2024.01.01
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-600 dark:text-gray-300">
                  Platform
                </Text>
                <Text className="text-gray-900 dark:text-white font-medium">
                  React Native
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-600 dark:text-gray-300">
                  Target Region
                </Text>
                <Text className="text-gray-900 dark:text-white font-medium">
                  Sri Lanka
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center mb-8">
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
            Made with ❤️ for solo travelers in Sri Lanka
          </Text>
          <Text className="text-xs text-gray-400 dark:text-gray-500 text-center">
            © 2024 SafeGuard. All rights reserved.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
