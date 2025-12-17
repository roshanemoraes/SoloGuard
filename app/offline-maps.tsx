import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/stores/useAppStore';
import { offlineMapService, OfflinePackInfo } from '../src/services/offlineMapService';
import { TripDestination } from '../src/types';
import MapboxMap from '../src/components/MapboxMap';

export default function OfflineMapsScreen() {
  const { tripDestinations } = useAppStore() as unknown as {
    tripDestinations: TripDestination[];
  };

  const [offlinePacks, setOfflinePacks] = useState<OfflinePackInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [storageSize, setStorageSize] = useState(0);
  const [autoDownload, setAutoDownload] = useState(false);
  const [downloadRadius, setDownloadRadius] = useState(5); // km
  const [showMapViewer, setShowMapViewer] = useState(false);
  const [selectedMapPack, setSelectedMapPack] = useState<OfflinePackInfo | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Confirmation modals
  const [showDownloadAllConfirm, setShowDownloadAllConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [packToDelete, setPackToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadOfflinePacks();
    loadStorageSize();

    // Refresh storage every 3 seconds while downloading
    const interval = setInterval(() => {
      if (isDownloading) {
        loadStorageSize();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isDownloading]);

  // Pulsing animation effect while downloading
  useEffect(() => {
    if (isDownloading) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isDownloading]);

  const loadOfflinePacks = async () => {
    try {
      const packs = await offlineMapService.getOfflinePacks();
      setOfflinePacks(packs);
    } catch (error) {
      console.error('Error loading offline packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageSize = async () => {
    const size = await offlineMapService.getTotalStorageSize();
    setStorageSize(size);
  };

  const handleDownloadAll = () => {
    if (tripDestinations.length === 0) {
      Alert.alert('No Destinations', 'Add trip destinations first to download offline maps.');
      return;
    }
    setShowDownloadAllConfirm(true);
  };

  const confirmDownloadAll = async () => {
    setShowDownloadAllConfirm(false);

    // Check if this is the first download (no existing packs)
    const isFirstDownload = offlinePacks.length === 0;

    if (isFirstDownload) {
      setIsInitializing(true);
      // Add a small delay to show initialization message
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsInitializing(false);
    }

    setIsDownloading(true);
    try {
      await offlineMapService.downloadRegionsForDestinations(
        tripDestinations,
        downloadRadius,
        (destinationId, progress) => {
          setDownloadProgress((prev) => ({
            ...prev,
            [destinationId]: progress,
          }));
        }
      );

      await loadOfflinePacks();
      await loadStorageSize();
      setSuccessMessage('All offline maps downloaded successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download offline maps. Please try again.';
      Alert.alert('Download Error', errorMessage);
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress({});
    }
  };

  const handleDownloadSingle = async (destination: TripDestination) => {
    const packName = `destination-${destination.id}`;

    try {
      const exists = await offlineMapService.hasOfflinePack(packName);
      if (exists) {
        Alert.alert('Already Downloaded', 'This destination already has an offline map.');
        return;
      }

      // Check if this is the first download
      const isFirstDownload = offlinePacks.length === 0;

      if (isFirstDownload) {
        setIsInitializing(true);
        // Add a small delay to show initialization message
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsInitializing(false);
      }

      setIsDownloading(true);
      await offlineMapService.downloadOfflineRegion(
        packName,
        destination.location,
        downloadRadius,
        (progress) => {
          setDownloadProgress((prev) => ({
            ...prev,
            [destination.id]: progress,
          }));
        }
      );

      await loadOfflinePacks();
      await loadStorageSize();
      setSuccessMessage(`Offline map for "${destination.name}" downloaded successfully!`);
      setShowSuccessModal(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download offline map. Please try again.';
      Alert.alert('Download Error', errorMessage);
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress((prev) => {
        const updated = { ...prev };
        delete updated[destination.id];
        return updated;
      });
    }
  };

  const handleDeletePack = (packName: string) => {
    setPackToDelete(packName);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!packToDelete) return;
    setShowDeleteConfirm(false);
    try {
      await offlineMapService.deleteOfflinePack(packToDelete);
      await loadOfflinePacks();
      await loadStorageSize();
      setSuccessMessage('Offline map deleted successfully.');
      setShowSuccessModal(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete offline map.';
      Alert.alert('Delete Error', errorMessage);
      console.error('Delete error:', error);
    } finally {
      setPackToDelete(null);
    }
  };

  const handleDeleteAll = () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAll = async () => {
    setShowDeleteAllConfirm(false);
    try {
      await offlineMapService.deleteAllPacks();
      await loadOfflinePacks();
      await loadStorageSize();
      setSuccessMessage('All offline maps deleted successfully.');
      setShowSuccessModal(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete offline maps.';
      Alert.alert('Delete Error', errorMessage);
      console.error('Delete all error:', error);
    }
  };

  const getDestinationName = (packName: string): string => {
    const destinationId = packName.replace('destination-', '');
    const destination = tripDestinations.find((d) => d.id === destinationId);
    return destination?.name || packName;
  };

  const handleViewMap = (pack: OfflinePackInfo) => {
    // Log the pack data for debugging
    console.log('Viewing pack:', JSON.stringify(pack, null, 2));

    // Try to get destination from pack name
    const destinationId = pack.name.replace('destination-', '');
    const destination = tripDestinations.find((d) => d.id === destinationId);

    // If we don't have valid bounds but have a destination, use destination location
    if (!pack.bounds || !Array.isArray(pack.bounds) || pack.bounds.length !== 2) {
      if (destination) {
        // Calculate bounds from destination location and download radius
        const radiusInKm = downloadRadius;
        const earthRadius = 6371;
        const latDelta = (radiusInKm / earthRadius) * (180 / Math.PI);
        const lonDelta = (radiusInKm / earthRadius) * (180 / Math.PI) / Math.cos(destination.location.latitude * Math.PI / 180);

        const calculatedBounds: [[number, number], [number, number]] = [
          [destination.location.longitude - lonDelta, destination.location.latitude - latDelta],
          [destination.location.longitude + lonDelta, destination.location.latitude + latDelta]
        ];

        // Create a modified pack with calculated bounds
        const modifiedPack = { ...pack, bounds: calculatedBounds };
        setSelectedMapPack(modifiedPack);
        setShowMapViewer(true);
        return;
      }

      Alert.alert('Error', 'Invalid map data. This map doesn\'t have valid coordinates stored.');
      console.error('Invalid bounds:', pack.bounds);
      return;
    }

    const [sw, ne] = pack.bounds;
    if (!sw || !ne || !Array.isArray(sw) || !Array.isArray(ne) || sw.length !== 2 || ne.length !== 2) {
      Alert.alert('Error', 'Invalid map bounds format.');
      console.error('Invalid sw/ne:', sw, ne);
      return;
    }

    // Validate that bounds contain valid numbers
    const hasValidNumbers = sw.every((n: any) => typeof n === 'number' && !isNaN(n)) &&
                           ne.every((n: any) => typeof n === 'number' && !isNaN(n));

    if (!hasValidNumbers) {
      Alert.alert('Error', 'Map coordinates are not valid numbers.');
      console.error('Non-numeric bounds:', sw, ne);
      return;
    }

    setSelectedMapPack(pack);
    setShowMapViewer(true);
  };

  const isDestinationDownloaded = (destinationId: string): boolean => {
    const packName = `destination-${destinationId}`;
    return offlinePacks.some((pack) => pack.name === packName);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <View className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
        <View className="flex-row items-center mb-2">
          <Ionicons name="cloud-download-outline" size={28} color="#3b82f6" />
          <Text className="text-2xl font-bold text-gray-900 dark:text-white ml-3">
            Offline Maps
          </Text>
        </View>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Download maps for offline access. Maps include roads, places, and terrain.
        </Text>
      </View>

      {/* Storage Info */}
      <View className="px-4 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-800">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">
              Storage Used
            </Text>
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              {offlinePacks.length} offline pack{offlinePacks.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {storageSize.toFixed(2)} MB
          </Text>
        </View>
      </View>

      {/* Download Settings */}
      <View className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Download Settings
        </Text>

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 mr-4">
            <Text className="text-sm text-gray-900 dark:text-white font-medium">
              Auto-download for new destinations
            </Text>
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              Automatically download maps when adding destinations
            </Text>
          </View>
          <Switch
            value={autoDownload}
            onValueChange={setAutoDownload}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor="#ffffff"
          />
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-900 dark:text-white font-medium">
            Download Radius
          </Text>
          <View className="flex-row items-center space-x-2">
            <Pressable
              onPress={() => setDownloadRadius(Math.max(1, downloadRadius - 1))}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center"
            >
              <Ionicons name="remove" size={20} color="#6b7280" />
            </Pressable>
            <Text className="text-sm font-bold text-gray-900 dark:text-white min-w-[60px] text-center">
              {downloadRadius} km
            </Text>
            <Pressable
              onPress={() => setDownloadRadius(Math.min(20, downloadRadius + 1))}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#6b7280" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Initialization Message */}
      {isInitializing && (
        <View className="mx-4 mt-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <View className="flex-row items-center space-x-3">
            <ActivityIndicator size="small" color="#2563eb" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Initializing Offline Maps...
              </Text>
              <Text className="text-xs text-blue-700 dark:text-blue-300">
                Preparing map data for first download. This only happens once.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <Pressable
          onPress={handleDownloadAll}
          disabled={isDownloading || isInitializing || tripDestinations.length === 0}
          className={`flex-row items-center justify-center py-3 px-4 rounded-lg mb-2 ${
            isDownloading || isInitializing || tripDestinations.length === 0
              ? 'bg-gray-300 dark:bg-gray-700'
              : 'bg-blue-600'
          }`}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#9ca3af" />
          ) : (
            <Ionicons
              name="download-outline"
              size={20}
              color={isInitializing || tripDestinations.length === 0 ? '#9ca3af' : '#ffffff'}
            />
          )}
          <Text
            className={`ml-2 font-semibold ${
              isDownloading || isInitializing || tripDestinations.length === 0
                ? 'text-gray-500 dark:text-gray-400'
                : 'text-white'
            }`}
          >
            {isInitializing ? 'Initializing...' : isDownloading ? 'Downloading...' : 'Download All Destinations'}
          </Text>
        </Pressable>

        {offlinePacks.length > 0 && (
          <Pressable
            onPress={handleDeleteAll}
            disabled={isDownloading}
            className="flex-row items-center justify-center py-3 px-4 rounded-lg border border-red-600 dark:border-red-400"
          >
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
            <Text className="ml-2 font-semibold text-red-600 dark:text-red-400">
              Delete All Maps
            </Text>
          </Pressable>
        )}
      </View>

      {/* Trip Destinations */}
      <View className="px-4 py-4">
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Your Trip Destinations ({tripDestinations.length})
        </Text>

        {tripDestinations.length === 0 ? (
          <View className="py-8 items-center">
            <Ionicons name="map-outline" size={48} color="#9ca3af" />
            <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
              No destinations yet. Add destinations in the Trip tab.
            </Text>
          </View>
        ) : (
          tripDestinations.map((destination) => {
            const isDownloaded = isDestinationDownloaded(destination.id);
            const progress = downloadProgress[destination.id];

            return (
              <View
                key={destination.id}
                className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">
                    {destination.name}
                  </Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-400">
                    {destination.type}
                  </Text>
                  {progress !== undefined && progress < 1 && (
                    <View className="mt-2">
                      <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <Animated.View
                          className="h-full bg-blue-600"
                          style={{
                            width: `${progress * 100}%`,
                            transform: [{ scaleY: pulseAnim }]
                          }}
                        />
                      </View>
                      <View className="flex-row items-center justify-between mt-1">
                        <Text className="text-xs text-gray-600 dark:text-gray-400">
                          {Math.round(progress * 100)}% downloaded
                        </Text>
                        <ActivityIndicator size="small" color="#2563eb" />
                      </View>
                    </View>
                  )}
                </View>

                {isDownloaded ? (
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text className="text-xs text-green-600 dark:text-green-400 ml-1">
                      Downloaded
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handleDownloadSingle(destination)}
                    disabled={isDownloading || isInitializing}
                    className={`py-2 px-3 rounded-lg ${
                      isDownloading || isInitializing ? 'bg-gray-300 dark:bg-gray-700' : 'bg-blue-600'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isDownloading || isInitializing ? 'text-gray-500' : 'text-white'
                      }`}
                    >
                      Download
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Downloaded Packs */}
      {offlinePacks.filter(pack => pack.state === 'complete' && pack.progress >= 100).length > 0 && (
        <View className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Downloaded Maps ({offlinePacks.filter(pack => pack.state === 'complete' && pack.progress >= 100).length})
          </Text>

          {offlinePacks.filter(pack => pack.state === 'complete' && pack.progress >= 100).map((pack) => (
            <View
              key={pack.name}
              className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800"
            >
              <View className="flex-1 mr-3">
                <Text className="text-sm font-medium text-gray-900 dark:text-white">
                  {getDestinationName(pack.name)}
                </Text>
                <Text className="text-xs text-gray-600 dark:text-gray-400">
                  {(pack.downloadedBytes / (1024 * 1024)).toFixed(2)} MB • Zoom {pack.minZoom}-
                  {pack.maxZoom}
                </Text>
              </View>

              <View className="flex-row items-center space-x-2">
                <Pressable
                  onPress={() => handleViewMap(pack)}
                  className="p-2"
                >
                  <Ionicons name="map-outline" size={20} color="#3b82f6" />
                </Pressable>

                <Pressable
                  onPress={() => handleDeletePack(pack.name)}
                  className="p-2"
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>

      {/* Map Viewer Modal */}
      <Modal
        visible={showMapViewer}
        animationType="slide"
        onRequestClose={() => setShowMapViewer(false)}
      >
        <View className="flex-1 bg-white dark:bg-gray-900">
          {/* Header */}
          <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedMapPack ? getDestinationName(selectedMapPack.name) : 'Offline Map'}
            </Text>
            <Pressable onPress={() => setShowMapViewer(false)} className="p-2">
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* Map View */}
          {selectedMapPack && (() => {
            const centerLat = (selectedMapPack.bounds[0][1] + selectedMapPack.bounds[1][1]) / 2;
            const centerLon = (selectedMapPack.bounds[0][0] + selectedMapPack.bounds[1][0]) / 2;

            console.log('Rendering map with:', {
              centerLat,
              centerLon,
              bounds: selectedMapPack.bounds,
              minZoom: selectedMapPack.minZoom
            });

            return (
              <MapboxMap
                initialLatitude={centerLat}
                initialLongitude={centerLon}
                initialZoom={selectedMapPack.minZoom + 2}
                style={{ flex: 1 }}
                showUserLocation={true}
                markers={[
                  {
                    id: 'center',
                    latitude: centerLat,
                    longitude: centerLon,
                    color: '#3b82f6',
                    title: getDestinationName(selectedMapPack.name),
                  },
                ]}
              />
            );
          })()}

          {/* Map Info Footer */}
          <View className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                  Offline Map Area
                </Text>
                <Text className="text-xs text-gray-600 dark:text-gray-400">
                  {selectedMapPack
                    ? `${(selectedMapPack.downloadedBytes / (1024 * 1024)).toFixed(2)} MB • Zoom ${selectedMapPack.minZoom}-${selectedMapPack.maxZoom}`
                    : ''}
                </Text>
              </View>
              <View className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30">
                <Text className="text-xs font-semibold text-green-700 dark:text-green-300">
                  Available Offline
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Download All Confirmation Modal */}
      <Modal
        visible={showDownloadAllConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadAllConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDownloadAllConfirm(false)}>
          <View className="flex-1 bg-black/40" />
        </TouchableWithoutFeedback>
        <View
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-700"
          style={{ position: "absolute", left: 16, right: 16, top: "30%" }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center space-x-2">
              <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center">
                <Ionicons name="cloud-download" size={22} color="#2563eb" />
              </View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Download Offline Maps
              </Text>
            </View>
            <Pressable onPress={() => setShowDownloadAllConfirm(false)}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </Pressable>
          </View>
          <Text className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Download maps for {tripDestinations.length} destination(s)? This will include roads and nearby places within {downloadRadius}km radius.
          </Text>
          <View className="flex-row space-x-3">
            <Pressable
              onPress={() => setShowDownloadAllConfirm(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-800 dark:text-gray-100 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirmDownloadAll}
              className="flex-1 bg-blue-600 active:bg-blue-700 rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">Download</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDeleteConfirm(false)}>
          <View className="flex-1 bg-black/40" />
        </TouchableWithoutFeedback>
        <View
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-700"
          style={{ position: "absolute", left: 16, right: 16, top: "30%" }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center space-x-2">
              <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 items-center justify-center">
                <Ionicons name="trash" size={22} color="#dc2626" />
              </View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Offline Map
              </Text>
            </View>
            <Pressable onPress={() => setShowDeleteConfirm(false)}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </Pressable>
          </View>
          <Text className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to delete this offline map?
          </Text>
          <View className="flex-row space-x-3">
            <Pressable
              onPress={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-800 dark:text-gray-100 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirmDelete}
              className="flex-1 bg-red-600 active:bg-red-700 rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">Delete</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete All Confirmation Modal */}
      <Modal
        visible={showDeleteAllConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteAllConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDeleteAllConfirm(false)}>
          <View className="flex-1 bg-black/40" />
        </TouchableWithoutFeedback>
        <View
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-700"
          style={{ position: "absolute", left: 16, right: 16, top: "30%" }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center space-x-2">
              <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 items-center justify-center">
                <Ionicons name="warning" size={22} color="#dc2626" />
              </View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Delete All Offline Maps
              </Text>
            </View>
            <Pressable onPress={() => setShowDeleteAllConfirm(false)}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </Pressable>
          </View>
          <Text className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to delete all offline maps? This will free up storage space.
          </Text>
          <View className="flex-row space-x-3">
            <Pressable
              onPress={() => setShowDeleteAllConfirm(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-800 dark:text-gray-100 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirmDeleteAll}
              className="flex-1 bg-red-600 active:bg-red-700 rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">Delete All</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSuccessModal(false)}>
          <View className="flex-1 bg-black/40" />
        </TouchableWithoutFeedback>
        <View
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-700"
          style={{ position: "absolute", left: 16, right: 16, top: "30%" }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center space-x-2">
              <View className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 items-center justify-center">
                <Ionicons name="checkmark-circle" size={26} color="#10b981" />
              </View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Success
              </Text>
            </View>
            <Pressable onPress={() => setShowSuccessModal(false)}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </Pressable>
          </View>
          <Text className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {successMessage}
          </Text>
          <Pressable
            onPress={() => setShowSuccessModal(false)}
            className="bg-green-600 active:bg-green-700 rounded-lg py-3 items-center"
          >
            <Text className="text-white font-semibold">OK</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
