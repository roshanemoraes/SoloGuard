import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TripDestination } from "../src/types";

export default function TripScreen() {
  const [destinations, setDestinations] = useState<TripDestination[]>([]);
  const [newDestination, setNewDestination] = useState({
    name: "",
    latitude: "",
    longitude: "",
    type: "custom" as const,
  });

  const preloadedDestinations: TripDestination[] = [
    {
      id: "1",
      name: "Colombo General Hospital",
      location: {
        latitude: 6.9271,
        longitude: 79.8612,
        timestamp: Date.now(),
        address: "Colombo, Sri Lanka",
      },
      type: "hospital",
      isPreloaded: true,
    },
    {
      id: "2",
      name: "Colombo Police Station",
      location: {
        latitude: 6.9271,
        longitude: 79.8612,
        timestamp: Date.now(),
        address: "Colombo, Sri Lanka",
      },
      type: "police",
      isPreloaded: true,
    },
    {
      id: "3",
      name: "Fort Railway Station",
      location: {
        latitude: 6.9344,
        longitude: 79.8428,
        timestamp: Date.now(),
        address: "Colombo, Sri Lanka",
      },
      type: "safe_area",
      isPreloaded: true,
    },
  ];

  const handleAddDestination = () => {
    if (
      !newDestination.name.trim() ||
      !newDestination.latitude.trim() ||
      !newDestination.longitude.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const lat = parseFloat(newDestination.latitude);
    const lng = parseFloat(newDestination.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert("Error", "Please enter valid coordinates");
      return;
    }

    const destination: TripDestination = {
      id: Date.now().toString(),
      name: newDestination.name.trim(),
      location: {
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
      },
      type: newDestination.type,
      isPreloaded: false,
    };

    setDestinations([...destinations, destination]);
    setNewDestination({
      name: "",
      latitude: "",
      longitude: "",
      type: "custom",
    });
  };

  const handleDeleteDestination = (id: string) => {
    Alert.alert(
      "Delete Destination",
      "Are you sure you want to delete this destination?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            setDestinations(destinations.filter((d) => d.id !== id)),
        },
      ]
    );
  };

  const getDestinationIcon = (type: string) => {
    switch (type) {
      case "hospital":
        return "medical";
      case "police":
        return "shield";
      case "safe_area":
        return "home";
      default:
        return "location";
    }
  };

  const getDestinationColor = (type: string) => {
    switch (type) {
      case "hospital":
        return "#ef4444";
      case "police":
        return "#3b82f6";
      case "safe_area":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const renderDestinationItem = ({ item }: { item: TripDestination }) => (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row items-start space-x-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: getDestinationColor(item.type) + "20" }}
        >
          <Ionicons
            name={getDestinationIcon(item.type) as any}
            size={20}
            color={getDestinationColor(item.type)}
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-medium text-gray-900 dark:text-white">
              {item.name}
            </Text>
            {item.isPreloaded && (
              <View className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                <Text className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  PRELOADED
                </Text>
              </View>
            )}
          </View>

          {item.location.address && (
            <Text className="text-gray-600 dark:text-gray-300 mb-1">
              {item.location.address}
            </Text>
          )}

          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {item.location.latitude.toFixed(6)},{" "}
            {item.location.longitude.toFixed(6)}
          </Text>

          <View className="flex-row items-center justify-between mt-2">
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: getDestinationColor(item.type) + "20" }}
            >
              <Text
                className="text-xs font-medium capitalize"
                style={{ color: getDestinationColor(item.type) }}
              >
                {item.type.replace("_", " ")}
              </Text>
            </View>

            {!item.isPreloaded && (
              <Pressable
                onPress={() => handleDeleteDestination(item.id)}
                className="bg-red-600 active:bg-red-700 px-3 py-1 rounded"
              >
                <Text className="text-white text-xs font-medium">Delete</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const allDestinations = [...preloadedDestinations, ...destinations];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Add Destination Section */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add Custom Destination
            </Text>

            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                  Destination Name
                </Text>
                <TextInput
                  value={newDestination.name}
                  onChangeText={(text) =>
                    setNewDestination({ ...newDestination, name: text })
                  }
                  placeholder="e.g., Hotel, Restaurant, Landmark"
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                />
              </View>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                    Latitude
                  </Text>
                  <TextInput
                    value={newDestination.latitude}
                    onChangeText={(text) =>
                      setNewDestination({ ...newDestination, latitude: text })
                    }
                    placeholder="6.9271"
                    keyboardType="numeric"
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                    Longitude
                  </Text>
                  <TextInput
                    value={newDestination.longitude}
                    onChangeText={(text) =>
                      setNewDestination({ ...newDestination, longitude: text })
                    }
                    placeholder="79.8612"
                    keyboardType="numeric"
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                  />
                </View>
              </View>

              <Pressable
                onPress={handleAddDestination}
                className="bg-green-600 active:bg-green-700 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-medium">
                  Add Destination
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Destinations List */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Trip Destinations
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {allDestinations.length} destinations
              </Text>
            </View>

            {allDestinations.length === 0 ? (
              <View className="bg-white dark:bg-gray-800 rounded-lg p-6 items-center">
                <Ionicons name="map-outline" size={48} color="#9ca3af" />
                <Text className="text-lg font-medium text-gray-900 dark:text-white mt-2 mb-1">
                  No Destinations
                </Text>
                <Text className="text-center text-gray-500 dark:text-gray-400">
                  Add destinations for offline access during your trip
                </Text>
              </View>
            ) : (
              <FlatList
                data={allDestinations}
                renderItem={renderDestinationItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Trip Tips */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Trip Safety Tips
            </Text>

            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <View className="flex-row items-start space-x-3">
                <Ionicons name="information-circle" size={24} color="#3b82f6" />
                <View className="flex-1">
                  <Text className="text-base font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Pre-trip Preparation
                  </Text>
                  <Text className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    • Add important destinations before traveling{"\n"}• Ensure
                    emergency contacts are set up{"\n"}• Test SOS functionality
                    in a safe environment{"\n"}• Keep your phone charged{"\n"}•
                    Inform trusted contacts about your travel plans
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Emergency Information */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Emergency Information
            </Text>

            <View className="space-y-3">
              <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <View className="flex-row items-center space-x-3 mb-2">
                  <Ionicons name="call" size={20} color="#ef4444" />
                  <Text className="text-base font-medium text-gray-900 dark:text-white">
                    Emergency Services
                  </Text>
                </View>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Police: 119{"\n"}
                  Ambulance: 110{"\n"}
                  Fire Service: 110
                </Text>
              </View>

              <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <View className="flex-row items-center space-x-3 mb-2">
                  <Ionicons name="flag" size={20} color="#10b981" />
                  <Text className="text-base font-medium text-gray-900 dark:text-white">
                    Tourist Police
                  </Text>
                </View>
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Hotline: +94 11 242 1052{"\n"}
                  Available 24/7 for tourist assistance
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
