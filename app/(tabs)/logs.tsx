import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppStore } from "../../src/stores/useAppStore";

/** ---- Types from your store ---- */
type LogRecord = {
  id: string;
  type: string;
  timestamp: number;
  batteryLevel?: number;
  location?: { latitude: number; longitude: number; address?: string };
  data?: any;
};

/** ---- Icons/Colors ---- */
const getLogIcon = (type: string) => {
  switch (type) {
    case "location_update": return "location";
    case "battery_check":   return "battery-half";
    case "motion_detected": return "move";
    case "inactivity_alert":return "warning";
    case "sos_sent":        return "alert-circle";
    default:                return "information-circle";
  }
};

const getLogColor = (type: string) => {
  switch (type) {
    case "location_update": return "#3b82f6";
    case "battery_check":   return "#f59e0b";
    case "motion_detected": return "#8b5cf6";
    case "inactivity_alert":return "#ef4444";
    case "sos_sent":        return "#dc2626";
    default:                return "#6b7280";
  }
};

const fmt = (ts: number) => {
  const d = new Date(ts);
  return { date: d.toLocaleDateString(), time: d.toLocaleTimeString(), iso: d.toISOString() };
};

/** ---- Merge battery+location into one card per minute ---- */
const TYPE_PRIORITY = ["sos_sent","inactivity_alert","motion_detected","location_update","battery_check","other"];

function mergeLogsPerMinute(logs: LogRecord[], bucketMs = 60000): LogRecord[] {
  const buckets = new Map<number, LogRecord>();
  for (const log of logs) {
    const key = Math.floor(log.timestamp / bucketMs);
    const existing = buckets.get(key);

    if (!existing) { buckets.set(key, { ...log }); continue; }

    const batteryLevel = typeof log.batteryLevel === "number" ? log.batteryLevel : existing.batteryLevel;
    const location     = log.location ?? existing.location;

    const existingPri  = TYPE_PRIORITY.includes(existing.type) ? TYPE_PRIORITY.indexOf(existing.type) : TYPE_PRIORITY.length - 1;
    const incomingPri  = TYPE_PRIORITY.includes(log.type)      ? TYPE_PRIORITY.indexOf(log.type)      : TYPE_PRIORITY.length - 1;
    const type         = incomingPri < existingPri ? log.type : existing.type;

    const timestamp    = Math.max(existing.timestamp, log.timestamp);

    let data = existing.data ?? log.data;
    if (existing.data && log.data && typeof existing.data === "string" && typeof log.data === "string") {
      data = `${existing.data}\n${log.data}`;
    }

    buckets.set(key, { ...existing, ...log, type, batteryLevel, location, data, timestamp });
  }
  return Array.from(buckets.values());
}

/** ---- CSV helpers ---- */
const toCsv = (rows: LogRecord[]) => {
  const header = ["id","type","timestamp","date","time","batteryLevel","latitude","longitude","address","data"];
  const lines = rows.map((r) => {
    const { date, time } = fmt(r.timestamp);
    const lat = r.location?.latitude ?? "";
    const lng = r.location?.longitude ?? "";
    const addr= r.location?.address ?? "";
    const data= typeof r.data === "string" ? r.data : r.data ? JSON.stringify(r.data) : "";
    const esc = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
    return [esc(r.id),esc(r.type),esc(r.timestamp),esc(date),esc(time),esc(r.batteryLevel ?? ""),esc(lat),esc(lng),esc(addr),esc(data)].join(",");
  });
  return [header.join(","), ...lines].join("\n");
};

const shareCsv = async (filename: string, csv: string) => {
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  const can = await Sharing.isAvailableAsync();
  if (can) {
    await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: "Export Logs", UTI: "public.comma-separated-values-text" });
  } else {
    Alert.alert("Exported", `Saved to: ${path}`);
  }
};

export default function LogsScreen() {
  const { monitoringLogs, clearLogs } = useAppStore() as unknown as {
    monitoringLogs: LogRecord[];
    clearLogs: () => void;
    clearLogsByIds?: (ids: string[]) => void;
  };

  /** Enable LayoutAnimation on Android */
  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  /** Collapsibles */
  const [showFilters, setShowFilters] = useState(false);
  const [showTools, setShowTools] = useState(false);

  /** Smooth layout helper */
  const animateLayout = () =>
    LayoutAnimation.configureNext({
      duration: 220,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });

  /** Filters: separate date+time (Android-safe) */
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const startAt = useMemo(() => {
    if (!startDate && !startTime) return null;
    const d = new Date(startDate ?? new Date());
    if (startTime) d.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    else d.setHours(0, 0, 0, 0);
    return d;
  }, [startDate, startTime]);

  const endAt = useMemo(() => {
    if (!endDate && !endTime) return null;
    const d = new Date(endDate ?? new Date());
    if (endTime) d.setHours(endTime.getHours(), endTime.getMinutes(), 59, 999);
    else d.setHours(23, 59, 59, 999);
    return d;
  }, [endDate, endTime]);

  /** Merge to a single card per bucket */
  const merged = useMemo(() => mergeLogsPerMinute(monitoringLogs), [monitoringLogs]);

  const filtered = useMemo(() => {
    return merged.filter((log) => {
      if (startAt && log.timestamp < startAt.getTime()) return false;
      if (endAt && log.timestamp > endAt.getTime()) return false;
      return true;
    });
  }, [merged, startAt, endAt]);

  const resetFilters = () => {
    animateLayout();
    setStartDate(null); setStartTime(null); setEndDate(null); setEndTime(null);
  };

  /** Android-safe pickers */
  const openAndroidDate = (value: Date | null, onChange: (d: Date) => void) => {
    DateTimePickerAndroid.open({
      mode: "date",
      value: value ?? new Date(),
      onChange: (_event, date) => { if (date) onChange(date); },
    });
  };
  const openAndroidTime = (value: Date | null, onChange: (d: Date) => void) => {
    DateTimePickerAndroid.open({
      mode: "time",
      is24Hour: true,
      value: value ?? new Date(),
      onChange: (_event, date) => { if (date) onChange(date); },
    });
  };

  /** Actions */
  const exportAll = async () => {
    if (merged.length === 0) return Alert.alert("Nothing to export", "No logs yet.");
    await shareCsv("safeguard-logs-all.csv", toCsv(merged));
  };
  const exportShown = async () => {
    if (filtered.length === 0) return Alert.alert("Nothing to export", "No logs match the filters.");
    await shareCsv("safeguard-logs-filtered.csv", toCsv(filtered));
  };
  const clearAll = () =>
    Alert.alert("Clear All Logs", "This will remove all logs. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => clearLogs() },
    ]);
  const clearShown = () => {
    if (filtered.length === 0) return Alert.alert("Nothing to clear", "No logs match the filters.");
    const ids = filtered.map((l) => l.id);
    const store = useAppStore.getState() as any;
    if (typeof store.clearLogsByIds === "function") {
      Alert.alert("Clear Shown Logs", `Remove ${ids.length} filtered logs?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => store.clearLogsByIds(ids) },
      ]);
    } else {
      Alert.alert("Feature not available", "Add clearLogsByIds(ids: string[]) to the store to enable clearing only filtered logs.");
    }
  };

  /** ---- UI ---- */
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center justify-between">
          <View className="px-2">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">Activity Logs</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">• {monitoringLogs.length} row</Text>
          </View>

          {/* Collapsible toggles */}
          <View className="flex-row px-4">
            <Pressable
              onPress={() => { animateLayout(); setShowFilters((s) => !s); }}
              className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg mr-2"
            >
              <View className="flex-row items-center">
                <Ionicons name={showFilters ? "chevron-up" : "chevron-down"} size={16} color="#111827" />
                <Text className="ml-1 text-gray-900 dark:text-white">Filters</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => { animateLayout(); setShowTools((s) => !s); }}
              className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg"
            >
              <View className="flex-row items-center">
                <Ionicons name={showTools ? "chevron-up" : "chevron-down"} size={16} color="#111827" />
                <Text className="ml-1 text-gray-900 dark:text-white">Tools</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Tools (Export / Clear) */}
      {showTools && (
        <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <View className="flex-row flex-wrap" style={{ rowGap: 6 }}>
            <Pressable onPress={exportAll}  className="bg-blue-600 active:bg-blue-700 px-3 py-2 rounded-lg mr-2 mt-2">
              <Text className="text-white text-sm font-medium">Export All</Text>
            </Pressable>
            <Pressable onPress={exportShown} className="bg-blue-500 active:bg-blue-600 px-3 py-2 rounded-lg mr-2 mt-2">
              <Text className="text-white text-sm font-medium">Export Shown</Text>
            </Pressable>
            <Pressable onPress={clearAll}   className="bg-red-600  active:bg-red-700  px-3 py-2 rounded-lg mr-2 mt-2">
              <Text className="text-white text-sm font-medium">Clear All</Text>
            </Pressable>
            <Pressable onPress={clearShown} className="bg-red-500  active:bg-red-600  px-3 py-2 rounded-lg mr-2 mt-2">
              <Text className="text-white text-sm font-medium">Clear Shown</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Filters */}
      {showFilters && (
        <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Filter by Date & Time</Text>

          {/* From */}
          <View className="flex-row items-center mb-2">
            <Text className="w-12 text-xs text-gray-500 dark:text-gray-400">From</Text>

            {/* Date */}
            <Pressable
              onPress={() => (Platform.OS === "android" ? openAndroidDate(startDate, setStartDate) : setStartDate(startDate ?? new Date()))}
              className="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 mr-2"
            >
              <Text className="text-gray-900 dark:text-white">{startDate ? startDate.toLocaleDateString() : "Any date"}</Text>
            </Pressable>

            {/* Time */}
            <Pressable
              onPress={() => (Platform.OS === "android" ? openAndroidTime(startTime, setStartTime) : setStartTime(startTime ?? new Date()))}
              className="w-28 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
            >
              <Text className="text-gray-900 dark:text-white">{startTime ? startTime.toLocaleTimeString() : "Any time"}</Text>
            </Pressable>
          </View>

          {/* To */}
          <View className="flex-row items-center mb-2">
            <Text className="w-12 text-xs text-gray-500 dark:text-gray-400">To</Text>

            {/* Date */}
            <Pressable
              onPress={() => (Platform.OS === "android" ? openAndroidDate(endDate, setEndDate) : setEndDate(endDate ?? new Date()))}
              className="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 mr-2"
            >
              <Text className="text-gray-900 dark:text-white">{endDate ? endDate.toLocaleDateString() : "Any date"}</Text>
            </Pressable>

            {/* Time */}
            <Pressable
              onPress={() => (Platform.OS === "android" ? openAndroidTime(endTime, setEndTime) : setEndTime(endTime ?? new Date()))}
              className="w-28 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
            >
              <Text className="text-gray-900 dark:text-white">{endTime ? endTime.toLocaleTimeString() : "Any time"}</Text>
            </Pressable>
          </View>

          {/* iOS inline pickers (only when active) */}
          {Platform.OS === "ios" && startDate instanceof Date && (
            <DateTimePicker value={startDate} mode="date" display="inline" onChange={(_, d) => d && setStartDate(d)} />
          )}
          {Platform.OS === "ios" && startTime instanceof Date && (
            <DateTimePicker value={startTime} mode="time" display="inline" onChange={(_, d) => d && setStartTime(d)} />
          )}
          {Platform.OS === "ios" && endDate instanceof Date && (
            <DateTimePicker value={endDate} mode="date" display="inline" onChange={(_, d) => d && setEndDate(d)} />
          )}
          {Platform.OS === "ios" && endTime instanceof Date && (
            <DateTimePicker value={endTime} mode="time" display="inline" onChange={(_, d) => d && setEndTime(d)} />
          )}

          <View className="flex-row justify-end mt-2">
            <Pressable onPress={resetFilters} className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded">
              <Text className="text-gray-900 dark:text-white">Reset</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* List */}
      {merged.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
          <Text className="text-xl font-medium text-gray-900 dark:text-white mt-4 mb-2">No Logs Yet</Text>
          <Text className="text-center text-gray-500 dark:text-gray-400">Monitoring logs will appear here once you start using SafeGuard</Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          <View className="p-4 space-y-3">
            {filtered.slice().reverse().map((log) => {
              const { date, time } = fmt(log.timestamp);
              const logColor = getLogColor(log.type);
              const badgeBg  = logColor + "20";

              return (
                <View key={log.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-l-4" style={{ borderLeftColor: logColor }}>
                  <View className="flex-row items-start space-x-3">
                    <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: badgeBg }}>
                      <Ionicons name={getLogIcon(log.type) as any} size={16} color={logColor} />
                    </View>

                    <View className="flex-1">
                      {/* Title + time */}
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {log.type.replace("_", " ")}
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">{time}</Text>
                      </View>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">{date}</Text>

                      {/* Single record chips: Battery + Location */}
                      <View className="flex-row flex-wrap items-center">
                        {typeof log.batteryLevel === "number" && (
                          <View className="flex-row items-center mr-2 mb-2 px-2 py-1 rounded" style={{ backgroundColor: badgeBg }}>
                            <Ionicons name="battery-half" size={12} color={logColor} />
                            <Text className="text-xs font-medium ml-1" style={{ color: logColor }}>
                              {Math.round(log.batteryLevel)}%
                            </Text>
                          </View>
                        )}

                        {log.location && (
                          <View className="flex-row items-center mr-2 mb-2 px-2 py-1 rounded" style={{ backgroundColor: badgeBg }}>
                            <Ionicons name="location" size={12} color={logColor} />
                            <Text className="text-xs font-medium ml-1" style={{ color: logColor }}>
                              {log.location.latitude.toFixed(3)}, {log.location.longitude.toFixed(3)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {log.location?.address && (
                        <Text className="text-xs text-gray-600 dark:text-gray-300">{log.location.address}</Text>
                      )}

                      {log.data && (
                        <View className="bg-gray-50 dark:bg-gray-700 rounded p-2 mt-2">
                          <Text className="text-xs text-gray-600 dark:text-gray-300">
                            {typeof log.data === "string" ? log.data : JSON.stringify(log.data, null, 2)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
