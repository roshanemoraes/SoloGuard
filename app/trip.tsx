import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { TripDestination } from "../src/types";

export default function TripScreen() {
  const [destinations, setDestinations] = useState<TripDestination[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TripDestination["type"] | "all">(
    "all"
  );
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [showEmergencySheet, setShowEmergencySheet] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapSelected, setMapSelected] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapPlaceName, setMapPlaceName] = useState("");

  const sriLankaPlaces: {
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
    type?: TripDestination["type"];
  }[] = [
    // Outdoors
    {
      name: "Horton Plains National Park",
      latitude: 6.8093,
      longitude: 80.7998,
      address: "Ohiya, Central Province",
      type: "outdoors",
    },
    {
      name: "Adam's Peak (Sri Pada)",
      latitude: 6.8097,
      longitude: 80.4993,
      address: "Nallathanniya, Central Province",
      type: "outdoors",
    },
    {
      name: "Udawalawe National Park",
      latitude: 6.4755,
      longitude: 80.8737,
      address: "Udawalawa, Sabaragamuwa Province",
      type: "outdoors",
    },
    {
      name: "Knuckles Mountain Range",
      latitude: 7.4716,
      longitude: 80.7916,
      address: "Matale, Central Province",
      type: "outdoors",
    },

    // Food
    {
      name: "Galle Face Green Street Food",
      latitude: 6.9225,
      longitude: 79.8442,
      address: "Galle Face, Colombo 03",
      type: "food",
    },
    {
      name: "Ministry of Crab",
      latitude: 6.9319,
      longitude: 79.8428,
      address: "Dutch Hospital, Colombo 01",
      type: "food",
    },
    {
      name: "Nuga Gama Village Restaurant",
      latitude: 6.9158,
      longitude: 79.857,
      address: "Cinnamon Grand, Colombo 03",
      type: "food",
    },
    {
      name: "Upali's by Nawaloka",
      latitude: 6.9115,
      longitude: 79.8602,
      address: "Colombo 07",
      type: "food",
    },

    // Culture
    {
      name: "Temple of the Sacred Tooth Relic",
      latitude: 7.2936,
      longitude: 80.6413,
      address: "Kandy, Central Province",
      type: "culture",
    },
    {
      name: "Galle Fort",
      latitude: 6.0261,
      longitude: 80.217,
      address: "Galle, Southern Province",
      type: "culture",
    },
    {
      name: "Jaffna Public Library",
      latitude: 9.6669,
      longitude: 80.0094,
      address: "Jaffna, Northern Province",
      type: "culture",
    },
    {
      name: "Colombo National Museum",
      latitude: 6.9106,
      longitude: 79.8608,
      address: "Sir Marcus Fernando Mawatha, Colombo 07",
      type: "culture",
    },

    // Water
    {
      name: "Mirissa Beach",
      latitude: 5.9488,
      longitude: 80.4546,
      address: "Mirissa, Southern Province",
      type: "water",
    },
    {
      name: "Unawatuna Beach",
      latitude: 6.0125,
      longitude: 80.2496,
      address: "Unawatuna, Southern Province",
      type: "water",
    },
    {
      name: "Nilaveli Beach",
      latitude: 8.7207,
      longitude: 81.1889,
      address: "Nilaveli, Eastern Province",
      type: "water",
    },
    {
      name: "Bentota River Safari Jetty",
      latitude: 6.4197,
      longitude: 79.9979,
      address: "Bentota, Southern Province",
      type: "water",
    },

    // General safe areas
    {
      name: "Bandaranaike International Airport",
      latitude: 7.1808,
      longitude: 79.8841,
      address: "Katunayake, Western Province",
      type: "safe_area",
    },
    {
      name: "Colombo Fort Railway Station",
      latitude: 6.9344,
      longitude: 79.8428,
      address: "Colombo 01, Western Province",
      type: "safe_area",
    },
    {
      name: "Ella Town",
      latitude: 6.8667,
      longitude: 81.0467,
      address: "Ella, Uva Province",
      type: "safe_area",
    },
    {
      name: "Anuradhapura Sacred City",
      latitude: 8.335,
      longitude: 80.4037,
      address: "Anuradhapura, North Central Province",
      type: "safe_area",
    },
  ];

  const getDestinationIcon = (type: string) => {
    switch (type) {
      case "hospital":
        return "medical";
      case "police":
        return "shield";
      case "safe_area":
        return "home";
      case "outdoors":
        return "leaf";
      case "food":
        return "restaurant";
      case "culture":
        return "color-palette";
      case "water":
        return "water";
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
      case "outdoors":
        return "#0ea5e9";
      case "food":
        return "#f97316";
      case "culture":
        return "#8b5cf6";
      case "water":
        return "#14b8a6";
      default:
        return "#6b7280";
    }
  };

  const handleSelectPlace = (place: typeof sriLankaPlaces[number]) => {
    const destination: TripDestination = {
      id: `${Date.now()}-${Math.random()}`,
      name: place.name,
      location: {
        latitude: place.latitude,
        longitude: place.longitude,
        timestamp: Date.now(),
        address: place.address,
      },
      type: place.type || "custom",
      isPreloaded: false,
    };

    setDestinations((prev) => {
      const updated = [...prev, destination];
      setCurrentPage(Math.max(1, Math.ceil(updated.length / pageSize)));
      return updated;
    });
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleAddFromMap = () => {
    if (!mapSelected || !mapPlaceName.trim()) {
      Alert.alert("Select a place", "Tap on the map and give it a name first.");
      return;
    }

    const destination: TripDestination = {
      id: `${Date.now()}-${Math.random()}`,
      name: mapPlaceName.trim(),
      location: {
        latitude: mapSelected.latitude,
        longitude: mapSelected.longitude,
        timestamp: Date.now(),
      },
      type: "custom",
      isPreloaded: false,
    };

    setDestinations((prev) => {
      const updated = [...prev, destination];
      setCurrentPage(Math.max(1, Math.ceil(updated.length / pageSize)));
      return updated;
    });

    setMapSelected(null);
    setMapPlaceName("");
    setShowMapPicker(false);
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
            setDestinations((prev) => prev.filter((d) => d.id !== id)),
        },
      ]
    );
  };

  const matchingPlaces =
    searchQuery.trim().length === 0
      ? []
      : sriLankaPlaces.filter((place) =>
          place.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        );

  const typeFilters = Array.from(new Set(destinations.map((d) => d.type)));
  const filteredDestinations =
    typeFilter === "all"
      ? destinations
      : destinations.filter((d) => d.type === typeFilter);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredDestinations.length / pageSize));
  const currentPageIndex = currentPage - 1;
  const pagedDestinations = filteredDestinations.slice(
    currentPageIndex * pageSize,
    currentPageIndex * pageSize + pageSize
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

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
          </View>

          {item.location.address && (
            <Text className="text-gray-600 dark:text-gray-300 mb-1">
              {item.location.address}
            </Text>
          )}

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

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
      >
        <View className="p-4 flex-1">
          {/* Add Destination Section */}
          <View className="mb-6">
            <View className="items-center mb-4">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                Where to?
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Places to go, things to do, hotels...
              </Text>
            </View>

            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <View>
                <View className="flex-row items-center space-x-2 mb-2">
                  {searchQuery.length > 0 && (
                    <View className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                      <Text className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Typing: {searchQuery}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3">
                  <Ionicons name="search" size={18} color="#6b7280" className="mr-2" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      setShowSuggestions(text.trim().length > 0);
                    }}
                    onFocus={() => setShowSuggestions(searchQuery.trim().length > 0)}
                    placeholder="Places to go, things to do, hotels..."
                    className="flex-1 py-3 text-gray-900 dark:text-white"
                  />
                  {searchQuery.length > 0 && (
                    <Pressable
                      onPress={() => {
                        setSearchQuery("");
                        setShowSuggestions(false);
                      }}
                      className="pl-2"
                    >
                      <Ionicons name="close-circle" size={18} color="#9ca3af" />
                    </Pressable>
                  )}
                </View>
                <Pressable
                  onPress={() => setShowMapPicker(true)}
                  className="mt-3 flex-row items-center justify-center bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3"
                >
                  <Ionicons name="map" size={18} color="#16a34a" />
                  <Text className="ml-2 text-sm font-semibold text-green-700 dark:text-green-200">
                    Pick on Google Maps
                  </Text>
                </Pressable>
                {showSuggestions && searchQuery.trim().length > 0 && (
                  <View className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mt-2 max-h-64">
                    {matchingPlaces.length > 0 ? (
                      <FlatList
                        data={matchingPlaces.slice(0, 8)}
                        keyExtractor={(item) => item.name}
                        renderItem={({ item }) => (
                          <Pressable
                            onPress={() => handleSelectPlace(item)}
                            className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700"
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1 pr-3">
                                <Text className="text-base font-medium text-gray-900 dark:text-white">
                                  {item.name}
                                </Text>
                                {item.address && (
                                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.address}
                                  </Text>
                                )}
                              </View>
                              {item.type && (
                                <View
                                  className="px-2 py-1 rounded-full"
                                  style={{ backgroundColor: getDestinationColor(item.type) + "33" }}
                                >
                                  <Text
                                    className="text-xs font-semibold capitalize"
                                    style={{ color: getDestinationColor(item.type) }}
                                  >
                                    {item.type}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </Pressable>
                        )}
                      />
                    ) : (
                      <View className="px-4 py-3">
                        <Text className="text-sm font-medium text-gray-900 dark:text-white">
                          No matches
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Try a different name.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Section separator */}
          <View className="flex-row items-center mb-4 mt-2">
            <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <Text className="mx-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
              Your trip destinations ({destinations.length})
            </Text>
            <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </View>

          {/* Destinations List */}
          <View className="mb-6">
            {/* Inline type filters for selected destinations */}
            {destinations.length > 0 && (
              <View className="flex-row flex-wrap mb-3 -mx-1">
                <Pressable
                  className="px-2 mb-2"
                  onPress={() => {
                    setTypeFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  <View
                    className={`px-3 py-2 rounded-full border ${
                      typeFilter === "all"
                        ? "bg-green-600 border-green-700"
                        : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        typeFilter === "all"
                          ? "text-white"
                          : "text-gray-800 dark:text-gray-100"
                      }`}
                    >
                      All
                    </Text>
                  </View>
                </Pressable>
                {typeFilters.map((type) => (
                  <Pressable
                    key={type}
                    className="px-2 mb-2"
                    onPress={() => {
                      setTypeFilter(type);
                      setCurrentPage(1);
                    }}
                  >
                    <View
                      className="px-3 py-2 rounded-full border"
                      style={{
                        backgroundColor:
                          typeFilter === type
                            ? getDestinationColor(type)
                            : getDestinationColor(type) + "12",
                        borderColor:
                          typeFilter === type
                            ? getDestinationColor(type)
                            : getDestinationColor(type) + "55",
                      }}
                    >
                      <Text
                        className={`text-xs font-semibold capitalize ${
                          typeFilter === type
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {type.replace("_", " ")}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {filteredDestinations.length === 0 ? (
              <View className="bg-white dark:bg-gray-800 rounded-lg p-6 items-center">
                <Ionicons name="map-outline" size={48} color="#9ca3af" />
                <Text className="text-lg font-medium text-gray-900 dark:text-white mt-2 mb-1">
                  No Destinations
                </Text>
                <Text className="text-center text-gray-500 dark:text-gray-400">
                  Search above to add destinations to your trip.
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={pagedDestinations}
                  renderItem={renderDestinationItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />

                {totalPages > 1 && (
                  <View className="flex-row items-center justify-between mt-3">
                    {currentPage > 1 ? (
                      <Pressable
                        onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className="px-3 py-2 rounded bg-green-600 active:bg-green-700"
                      >
                        <Text className="text-sm font-medium text-white">Previous</Text>
                      </Pressable>
                    ) : (
                      <View />
                    )}

                    <Text className="text-sm text-gray-600 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </Text>

                    {currentPage < totalPages ? (
                      <Pressable
                        onPress={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        className="px-3 py-2 rounded bg-green-600 active:bg-green-700"
                      >
                        <Text className="text-sm font-medium text-white">Next</Text>
                      </Pressable>
                    ) : (
                      <View />
                    )}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Footer content */}
          <View style={{ flex: 1 }} />
          <View className="mt-10 mb-12 space-y-6">
            <View>
              <Pressable
                onPress={() => setShowSafetyTips((prev) => !prev)}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center space-x-2">
                  <Ionicons name="shield-checkmark" size={18} color="#2563eb" />
                  <Text className="text-base font-semibold text-blue-900 dark:text-blue-100">
                    Safety tips
                  </Text>
                </View>
                <Ionicons
                  name={showSafetyTips ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#2563eb"
                />
              </Pressable>
              {showSafetyTips && (
                <View className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 rounded-lg px-4 py-3 mt-2 space-y-2">
                  {[
                    "Add key destinations before you travel",
                    "Set up emergency contacts and test SOS",
                    "Keep your phone charged and share your route",
                  ].map((tip) => (
                    <View key={tip} className="flex-row items-start space-x-2">
                      <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                      <Text className="text-sm text-gray-800 dark:text-gray-100 flex-1">
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              onPress={() => setShowEmergencySheet(true)}
              className="bg-red-600 active:bg-red-700 rounded-full px-4 py-3 shadow-lg flex-row items-center justify-center"
            >
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Need help?</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showEmergencySheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEmergencySheet(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowEmergencySheet(false)}>
          <View className="flex-1 bg-black/40" />
        </TouchableWithoutFeedback>
        <View className="bg-white dark:bg-gray-900 rounded-t-2xl p-4 shadow-2xl">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Emergency Information
            </Text>
            <Pressable onPress={() => setShowEmergencySheet(false)}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </Pressable>
          </View>

          <View className="space-y-3">
            <Pressable className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 flex-row justify-between items-center">
              <View>
                <Text className="text-base font-semibold text-red-700 dark:text-red-200">
                  Police
                </Text>
                <Text className="text-sm text-gray-700 dark:text-gray-200">
                  119
                </Text>
              </View>
              <Ionicons name="call" size={20} color="#dc2626" />
            </Pressable>

            <Pressable className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 flex-row justify-between items-center">
              <View>
                <Text className="text-base font-semibold text-orange-700 dark:text-orange-200">
                  Ambulance
                </Text>
                <Text className="text-sm text-gray-700 dark:text-gray-200">
                  110
                </Text>
              </View>
              <Ionicons name="call" size={20} color="#ea580c" />
            </Pressable>

            <Pressable className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex-row justify-between items-center">
              <View>
                <Text className="text-base font-semibold text-gray-900 dark:text-white">
                  Fire Service
                </Text>
                <Text className="text-sm text-gray-700 dark:text-gray-200">
                  110
                </Text>
              </View>
              <Ionicons name="call" size={20} color="#111827" />
            </Pressable>

            <Pressable className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 flex-row justify-between items-center">
              <View>
                <Text className="text-base font-semibold text-green-700 dark:text-green-200">
                  Tourist Police
                </Text>
                <Text className="text-sm text-gray-700 dark:text-gray-200">
                  +94 11 242 1052
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  Available 24/7 for tourist assistance
                </Text>
              </View>
              <Ionicons name="flag" size={20} color="#16a34a" />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Google Maps picker modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMapPicker(false)}
      >
        <View className="flex-1 bg-black/40">
          <View className="mt-12 flex-1 bg-white dark:bg-gray-900 rounded-t-2xl overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Select on Google Maps
              </Text>
              <Pressable onPress={() => setShowMapPicker(false)}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </Pressable>
            </View>

            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: 7.8731,
                longitude: 80.7718,
                latitudeDelta: 3,
                longitudeDelta: 3,
              }}
              onPress={(e: MapPressEvent) =>
                setMapSelected(e.nativeEvent.coordinate)
              }
            >
              {mapSelected && (
                <Marker coordinate={mapSelected} />
              )}
            </MapView>

            <View className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                Tap on the map to drop a pin, then name it.
              </Text>
              <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3">
                <Ionicons name="pricetag" size={18} color="#6b7280" />
                <TextInput
                  value={mapPlaceName}
                  onChangeText={setMapPlaceName}
                  placeholder="Give this place a name"
                  className="flex-1 py-3 px-2 text-gray-900 dark:text-white"
                />
              </View>
              <Pressable
                onPress={handleAddFromMap}
                className="mt-3 py-3 rounded-lg bg-green-600 active:bg-green-700 items-center"
              >
                <Text className="text-white font-semibold">Add destination</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
