// src/services/batteryService.ts
import * as Battery from "expo-battery";
import { Platform } from "react-native";
import { BatteryStatus } from "../types";

/*
Suggested type (if you want to extend it):
export type BatteryStatus = {
  batteryLevel: number;        // 0..100 (percentage)
  isCharging: boolean;
  isLowPowerMode?: boolean;
  batteryState?: Battery.BatteryState; // enum
  timestamp: number;
};
*/

export class BatteryService {
  private batteryListener: ((status: BatteryStatus) => void) | null = null;

  // Live listener handles
  private levelSub: Battery.Subscription | null = null;
  private stateSub: Battery.Subscription | null = null;

  // Optional polling fallback (e.g., web)
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /** Internal: build a normalized status object */
  private async snapshot(): Promise<BatteryStatus> {
    const [level0to1, state, lowPower] = await Promise.all([
      Battery.getBatteryLevelAsync(),     // 0..1
      Battery.getBatteryStateAsync(),     // enum
      Battery.isLowPowerModeEnabledAsync().catch(() => undefined),
    ]);

    const batteryLevel = Math.round(Math.max(0, Math.min(1, level0to1 ?? 0)) * 100);
    const isCharging =
      state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;

    return {
      batteryLevel,          // percentage 0..100
      isCharging,
      isLowPowerMode: lowPower,
      batteryState: state,
      timestamp: Date.now(),
    };
  }

  /** Public: one-shot read */
  async getBatteryStatus(): Promise<BatteryStatus | null> {
    try {
      return await this.snapshot();
    } catch (error) {
      console.error("Error getting battery status:", error);
      return null;
    }
  }

  /**
   * Start monitoring battery. Uses native listeners; on web (or if anything fails),
   * falls back to polling every `updateInterval` ms.
   */
  async startBatteryMonitoring(
    onBatteryUpdate: (status: BatteryStatus) => void,
    updateInterval = 30000 // 30s
  ): Promise<void> {
    this.batteryListener = onBatteryUpdate;

    // Emit initial snapshot
    try {
      const first = await this.snapshot();
      this.batteryListener?.(first);
    } catch (e) {
      console.warn("Initial battery snapshot failed:", e);
    }

    // Clear any previous subs/intervals
    this.stopBatteryMonitoring();

    // Prefer native listeners (not fully supported on web)
    try {
      this.levelSub = Battery.addBatteryLevelListener(async () => {
        const s = await this.snapshot();
        this.batteryListener?.(s);
      });

      this.stateSub = Battery.addBatteryStateListener(async () => {
        const s = await this.snapshot();
        this.batteryListener?.(s);
      });
    } catch (e) {
      console.warn("Battery listeners unavailable, will use polling:", e);
    }

    // Web & fallback polling
    if (Platform.OS === "web" || (!this.levelSub && !this.stateSub)) {
      this.intervalId = setInterval(async () => {
        try {
          const s = await this.snapshot();
          this.batteryListener?.(s);
        } catch {
          // ignore transient failures
        }
      }, updateInterval);
    }
  }

  /** Stop monitoring & clean up */
  stopBatteryMonitoring(): void {
    this.batteryListener = null;

    this.levelSub?.remove?.();
    this.levelSub = null;

    this.stateSub?.remove?.();
    this.stateSub = null;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Convenience helpers (keep your existing signatures) */
  isBatteryLow(batteryLevel: number, threshold = 10): boolean {
    return batteryLevel <= threshold;
  }

  isBatteryCritical(batteryLevel: number, threshold = 5): boolean {
    return batteryLevel <= threshold;
  }

  formatBatteryLevel(batteryLevel: number): string {
    return `${Math.round(batteryLevel)}%`;
  }

  getBatteryStatusText(batteryLevel: number): string {
    if (batteryLevel > 50) return "Good";
    if (batteryLevel > 20) return "Low";
    if (batteryLevel > 5) return "Critical";
    return "Very Low";
  }

  getBatteryColor(batteryLevel: number): string {
    if (batteryLevel > 50) return "#4ade80"; // Green
    if (batteryLevel > 20) return "#fbbf24"; // Yellow
    if (batteryLevel > 5) return "#f97316"; // Orange
    return "#ef4444"; // Red
  }
}

export const batteryService = new BatteryService();
