import { OFFLINE_PACK_CONFIG, getMapbox } from '../config/mapbox';
import { LocationData } from '../types';

export interface OfflinePackInfo {
  name: string;
  bounds: [[number, number], [number, number]];
  minZoom: number;
  maxZoom: number;
  progress: number;
  state: 'inactive' | 'active' | 'complete' | 'invalid';
  downloadedBytes: number;
  totalBytes: number;
}

export interface OfflineRegion {
  id: string;
  name: string;
  location: LocationData;
  radiusInKm: number;
  downloadProgress: number;
  isDownloaded: boolean;
  bounds: [[number, number], [number, number]];
}

class OfflineMapService {
  private downloadCallbacks: Map<string, (progress: number) => void> = new Map();

  /**
   * Calculate bounding box coordinates around a center point
   * @param latitude Center latitude
   * @param longitude Center longitude
   * @param radiusInKm Radius in kilometers
   * @returns Bounding box as [[west, south], [east, north]]
   */
  private calculateBounds(
    latitude: number,
    longitude: number,
    radiusInKm: number
  ): [[number, number], [number, number]] {
    // Earth's radius in kilometers
    const earthRadius = 6371;

    // Convert radius to degrees
    const latDelta = (radiusInKm / earthRadius) * (180 / Math.PI);
    const lonDelta = (radiusInKm / earthRadius) * (180 / Math.PI) / Math.cos(latitude * Math.PI / 180);

    const north = latitude + latDelta;
    const south = latitude - latDelta;
    const east = longitude + lonDelta;
    const west = longitude - lonDelta;

    return [[west, south], [east, north]];
  }

  /**
   * Download offline map pack for a specific region
   * @param name Unique name for the offline pack
   * @param location Center location
   * @param radiusInKm Radius around the location to download
   * @param onProgress Progress callback
   */
  async downloadOfflineRegion(
    name: string,
    location: LocationData,
    radiusInKm: number = 5,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;

      try {
        const Mapbox = getMapbox();
        if (!Mapbox) {
          throw new Error('Mapbox not available');
        }

        const bounds = this.calculateBounds(location.latitude, location.longitude, radiusInKm);

        if (onProgress) {
          this.downloadCallbacks.set(name, onProgress);
        }

        let downloadComplete = false;

        // Set timeout for download (10 minutes)
        timeoutId = setTimeout(() => {
          if (!downloadComplete) {
            this.downloadCallbacks.delete(name);
            reject(new Error('Download timeout: Map download took too long. Please try again with a smaller radius.'));
          }
        }, 10 * 60 * 1000);

        const progressListener = (_offlineRegion: any, status: any) => {
          try {
            const progress = status.percentage / 100;
            const callback = this.downloadCallbacks.get(name);
            if (callback) {
              callback(progress);
            }

            // Check if download is complete
            if (status.state === 'complete' && !downloadComplete) {
              downloadComplete = true;
              this.downloadCallbacks.delete(name);
              if (timeoutId) clearTimeout(timeoutId);
              console.log(`Offline pack "${name}" download completed successfully`);
              resolve();
            }
          } catch (err) {
            console.error('Error in progress listener:', err);
          }
        };

        const errorListener = (_offlineRegion: any, error: any) => {
          console.error('Offline pack download error:', error);
          this.downloadCallbacks.delete(name);
          if (timeoutId) clearTimeout(timeoutId);
          reject(new Error(`Download failed: ${error.message || 'Unknown error'}`));
        };

        await Mapbox.offlineManager.createPack(
          {
            name,
            styleURL: OFFLINE_PACK_CONFIG.styleURL,
            bounds,
            minZoom: OFFLINE_PACK_CONFIG.minZoom,
            maxZoom: OFFLINE_PACK_CONFIG.maxZoom,
            metadata: JSON.stringify({
              name,
              bounds,
              minZoom: OFFLINE_PACK_CONFIG.minZoom,
              maxZoom: OFFLINE_PACK_CONFIG.maxZoom,
            }),
          },
          progressListener,
          errorListener
        );

        console.log(`Offline pack "${name}" download started`);
      } catch (error) {
        console.error('Error creating offline pack:', error);
        this.downloadCallbacks.delete(name);
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Get all downloaded offline packs
   */
  async getOfflinePacks(): Promise<OfflinePackInfo[]> {
    try {
      const Mapbox = getMapbox();
      if (!Mapbox) return [];

      const packs = await Mapbox.offlineManager.getPacks();

      console.log('Raw packs from Mapbox:', JSON.stringify(packs, null, 2));

      const packInfos: OfflinePackInfo[] = [];

      for (const packWrapper of packs) {
        // The actual pack data is nested in the 'pack' property
        const pack = packWrapper.pack || packWrapper;
        const metadata = packWrapper._metadata || {};

        console.log('Pack data:', JSON.stringify(pack, null, 2));
        console.log('Metadata:', JSON.stringify(metadata, null, 2));

        // Extract pack name from metadata
        const packName = metadata.name || metadata._rnmapbox?.name || 'unknown';

        // Get bounds from metadata
        let bounds: [[number, number], [number, number]] = [[0, 0], [0, 0]];
        if (metadata._rnmapbox?.bounds?.coordinates?.[0]) {
          // Extract southwest and northeast corners from polygon
          const coords = metadata._rnmapbox.bounds.coordinates[0];
          if (coords.length >= 3) {
            bounds = [
              [coords[0][0], coords[0][1]], // southwest
              [coords[2][0], coords[2][1]]  // northeast
            ];
          }
        } else if (Array.isArray(pack.bounds) && pack.bounds.length === 4) {
          // Bounds as [west, north, east, south]
          bounds = [
            [pack.bounds[2], pack.bounds[3]], // southwest [east, south]
            [pack.bounds[0], pack.bounds[1]]  // northeast [west, north]
          ];
        }

        // Get zoom range
        const zoomRange = metadata._rnmapbox?.zoomRange || [OFFLINE_PACK_CONFIG.minZoom, OFFLINE_PACK_CONFIG.maxZoom];

        // Get size from pack data
        const downloadedBytes = pack.completedResourceSize || 0;

        const packInfo = {
          name: packName,
          bounds,
          minZoom: zoomRange[0],
          maxZoom: zoomRange[1],
          progress: pack.percentage || 0,
          state: pack.state || 'inactive',
          downloadedBytes,
          totalBytes: downloadedBytes, // Use same value as downloaded for completed packs
        };

        console.log('Processed pack info:', JSON.stringify(packInfo, null, 2));
        packInfos.push(packInfo);
      }

      return packInfos;
    } catch (error) {
      console.error('Error getting offline packs:', error);
      return [];
    }
  }

  /**
   * Delete an offline pack by name
   */
  async deleteOfflinePack(name: string): Promise<void> {
    try {
      const Mapbox = getMapbox();
      if (!Mapbox) {
        throw new Error('Mapbox not available');
      }

      await Mapbox.offlineManager.deletePack(name);
      this.downloadCallbacks.delete(name);
      console.log(`Offline pack "${name}" deleted`);
    } catch (error) {
      console.error('Error deleting offline pack:', error);
      throw error;
    }
  }

  /**
   * Check if an offline pack exists
   */
  async hasOfflinePack(name: string): Promise<boolean> {
    try {
      const packs = await this.getOfflinePacks();
      return packs.some(pack => pack.name === name);
    } catch (error) {
      return false;
    }
  }

  /**
   * Download offline maps for multiple destinations
   */
  async downloadRegionsForDestinations(
    destinations: Array<{ id: string; name: string; location: LocationData }>,
    radiusInKm: number = 5,
    onProgress?: (destinationId: string, progress: number) => void
  ): Promise<void> {
    for (const destination of destinations) {
      const packName = `destination-${destination.id}`;

      try {
        const exists = await this.hasOfflinePack(packName);
        if (exists) {
          console.log(`Offline pack for "${destination.name}" already exists`);
          continue;
        }

        await this.downloadOfflineRegion(
          packName,
          destination.location,
          radiusInKm,
          (progress) => {
            if (onProgress) {
              onProgress(destination.id, progress);
            }
          }
        );
      } catch (error) {
        console.error(`Error downloading offline map for "${destination.name}":`, error);
      }
    }
  }

  /**
   * Get storage size of all offline packs in MB
   */
  async getTotalStorageSize(): Promise<number> {
    try {
      const packs = await this.getOfflinePacks();
      const totalBytes = packs.reduce((sum, pack) => sum + pack.downloadedBytes, 0);
      return totalBytes / (1024 * 1024); // Convert to MB
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  /**
   * Delete all offline packs
   */
  async deleteAllPacks(): Promise<void> {
    try {
      const packs = await this.getOfflinePacks();
      for (const pack of packs) {
        await this.deleteOfflinePack(pack.name);
      }
      console.log('All offline packs deleted');
    } catch (error) {
      console.error('Error deleting all packs:', error);
      throw error;
    }
  }

  /**
   * Pause all active downloads
   */
  pauseDownloads(): void {
    // Note: @rnmapbox/maps handles this internally
    // Downloads will pause when app goes to background
    console.log('Offline pack downloads paused');
  }

  /**
   * Resume all paused downloads
   */
  resumeDownloads(): void {
    // Note: @rnmapbox/maps handles this internally
    // Downloads will resume when app comes to foreground
    console.log('Offline pack downloads resumed');
  }
}

export const offlineMapService = new OfflineMapService();
