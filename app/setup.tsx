import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Switch,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppStore } from "../src/stores/useAppStore";
import { EmergencyContact, AppSettings } from "../src/types";

/** ---- Country codes (add more as needed) ---- */
const COUNTRY_CODES = [
  { label: "Sri Lanka (+94)", value: "+94" },
  { label: "India (+91)", value: "+91" },
  { label: "United States (+1)", value: "+1" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "Australia (+61)", value: "+61" },
  { label: "Germany (+49)", value: "+49" },
];

/** ---- ModalSelect (themeable dropdown) ---- */
function ModalSelect<T extends string>({
  visible,
  onClose,
  onSelect,
  options,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: T) => void;
  options: { label: string; value: T }[];
  title: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">{title}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item.value as T);
                onClose();
              }}
              className="px-4 py-4 border-b border-gray-200 dark:border-gray-700"
            >
              <Text className="text-base text-gray-900 dark:text-white">{item.label}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

export default function SetupScreen() {
  const router = useRouter();
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  const {
    emergencyContacts,
    settings,
    addEmergencyContact,
    updateEmergencyContact,
    removeEmergencyContact,
    updateSettings,
  } = useAppStore();

  /** ---- CONTACT FORM (local state so typing doesn’t fight defaults) ---- */
  const [countryCode, setCountryCode] = useState<string>("+94"); // default to Sri Lanka
  const [localPhone, setLocalPhone] = useState<string>("");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phoneNumber: "", // composed on save
    isPrimary: false,
  });

  /** ---- SETTINGS FORM: Inactivity (HH/MM) + Interval (MM/SS) + Battery ---- */
  // Inactivity (store in minutes)
  const [inactH, setInactH] = useState<string>("");
  const [inactM, setInactM] = useState<string>("");

  // Update interval (store in seconds)
  const [intM, setIntM] = useState<string>("");
  const [intS, setIntS] = useState<string>("");

  const [batteryVal, setBatteryVal] = useState<string>("");

  /** ---- Hydrate local UI from store ---- */
  useEffect(() => {
    // Inactivity from minutes -> HH MM
    const totalMin = Math.max(1, settings.inactivityThreshold || 1);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    setInactH(String(h));
    setInactM(String(m));

    // Update interval from seconds -> MM SS (ignore hours)
    const totalSec = Math.max(1, settings.updateInterval || 1);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    setIntM(String(mm));
    setIntS(String(ss));

    // Battery
    setBatteryVal(String(settings.batteryThreshold || 10));
  }, [settings.inactivityThreshold, settings.updateInterval, settings.batteryThreshold]);

  /** ---- Helpers & committers ---- */
  const toInt = (s: string) => {
    if (!s.trim()) return 0;
    const n = Number(s);
    return Number.isFinite(n) ? Math.floor(Math.max(0, n)) : 0;
  };
  const clamp059 = (n: number) => Math.max(0, Math.min(59, n));

  const commitInactivityHM = () => {
    const h = toInt(inactH);
    const m = clamp059(toInt(inactM));
    const totalMinutes = Math.max(1, h * 60 + m);
    updateSettings({ inactivityThreshold: totalMinutes });
    setInactM(String(m)); // reflect clamp
  };

  const commitIntervalMS = () => {
    const m = toInt(intM);
    const s = clamp059(toInt(intS));
    const totalSeconds = Math.max(1, m * 60 + s);
    updateSettings({ updateInterval: totalSeconds });
    setIntS(String(s)); // reflect clamp
  };

  const commitBattery = () => {
    const n = Number(batteryVal);
    if (!Number.isFinite(n)) {
      Alert.alert("Invalid value", "Battery percentage must be 1–100.");
      return;
    }
    const clamped = Math.max(1, Math.min(100, Math.floor(n)));
    if (String(clamped) !== batteryVal) setBatteryVal(String(clamped));
    updateSettings({ batteryThreshold: clamped });
  };

  /** ---- Contacts ---- */
  const validatePhone = (fullPhone: string) => {
    const rest = fullPhone.replace(/^\+/, "").replace(/[^0-9]/g, "");
    return rest.length >= 7 && rest.length <= 15;
  };

  const handleAddContact = () => {
    if (!newContact.name.trim()) {
      Alert.alert("Error", "Please enter a contact name.");
      return;
    }
    const fullPhone = `${countryCode}${localPhone.replace(/[^0-9]/g, "")}`;
    if (!validatePhone(fullPhone)) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return;
    }

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      name: newContact.name.trim(),
      phoneNumber: fullPhone,
      isPrimary: newContact.isPrimary,
      isActive: true,
    };

    if (contact.isPrimary) {
      emergencyContacts.forEach((c) => c.isPrimary && updateEmergencyContact(c.id, { isPrimary: false }));
    }

    addEmergencyContact(contact);
    setNewContact({ name: "", phoneNumber: "", isPrimary: false });
    setCountryCode("+94");
    setLocalPhone("");
    setShowAddContact(false);
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setNewContact({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      isPrimary: contact.isPrimary,
    });
    const match = COUNTRY_CODES.find((c) => contact.phoneNumber.startsWith(c.value));
    if (match) {
      setCountryCode(match.value);
      setLocalPhone(contact.phoneNumber.slice(match.value.length));
    } else {
      const cc = contact.phoneNumber.match(/^\+\d{1,3}/)?.[0] ?? "+94";
      setCountryCode(cc);
      setLocalPhone(contact.phoneNumber.replace(cc, ""));
    }
    setShowAddContact(true);
  };

  const handleUpdateContact = () => {
    if (!editingContact) return;
    if (!newContact.name.trim()) {
      Alert.alert("Error", "Please enter a contact name.");
      return;
    }
    const fullPhone = `${countryCode}${localPhone.replace(/[^0-9]/g, "")}`;
    if (!validatePhone(fullPhone)) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return;
    }

    if (newContact.isPrimary) {
      emergencyContacts.forEach((c) => {
        if (c.isPrimary && c.id !== editingContact.id) updateEmergencyContact(c.id, { isPrimary: false });
      });
    }

    updateEmergencyContact(editingContact.id, {
      name: newContact.name.trim(),
      phoneNumber: fullPhone,
      isPrimary: newContact.isPrimary,
    });

    setEditingContact(null);
    setNewContact({ name: "", phoneNumber: "", isPrimary: false });
    setCountryCode("+94");
    setLocalPhone("");
    setShowAddContact(false);
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert("Delete Contact", "Are you sure you want to delete this emergency contact?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeEmergencyContact(contactId) },
    ]);
  };

  const toggleContactActive = (contactId: string, isActive: boolean) => {
    updateEmergencyContact(contactId, { isActive });
  };

  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    updateSettings({ [key]: value });
  };

  /** ---- UI ---- */
  const renderContactItem = ({ item }: { item: EmergencyContact }) => (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center space-x-2 mb-1">
            <Text className="text-lg font-medium text-gray-900 dark:text-white">{item.name}</Text>
            {item.isPrimary && (
              <View className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                <Text className="text-xs font-medium text-blue-800 dark:text-blue-200">PRIMARY</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-600 dark:text-gray-300">{item.phoneNumber}</Text>
        </View>

        <View className="flex-row items-center space-x-2">
          <Switch
            value={item.isActive}
            onValueChange={(value) => toggleContactActive(item.id, value)}
            trackColor={{ false: "#d1d5db", true: "#10b981" }}
            thumbColor="#ffffff"
          />
          <Pressable onPress={() => handleEditContact(item)} className="bg-blue-600 active:bg-blue-700 px-3 py-2 rounded">
            <Ionicons name="pencil" size={16} color="white" />
          </Pressable>
          <Pressable onPress={() => handleDeleteContact(item.id)} className="bg-red-600 active:bg-red-700 px-3 py-2 rounded">
            <Ionicons name="trash" size={16} color="white" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const TinyLabel = ({ text }: { text: string }) => (
    <Text className="text-xs text-gray-600 dark:text-gray-300 mt-1">{text}</Text>
  );

  const cellClass =
    "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded text-center";

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Emergency Contacts Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">Emergency Contacts</Text>
              <Pressable onPress={() => setShowAddContact(true)} className="bg-green-600 active:bg-green-700 px-4 py-2 rounded-lg flex-row items-center space-x-2">
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-medium">Add Contact</Text>
              </Pressable>
            </View>

            {emergencyContacts.length === 0 ? (
              <View className="bg-white dark:bg-gray-800 rounded-lg p-6 items-center">
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                <Text className="text-lg font-medium text-gray-900 dark:text-white mt-2 mb-1">No Emergency Contacts</Text>
                <Text className="text-center text-gray-500 dark:text-gray-400">Add emergency contacts to receive SOS alerts</Text>
              </View>
            ) : (
              <FlatList data={emergencyContacts} renderItem={renderContactItem} keyExtractor={(item) => item.id} scrollEnabled={false} />
            )}
          </View>

          {/* Settings Section */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">Monitoring Settings</Text>

            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-6">
              {/* Inactivity Threshold (HH MM -> minutes) */}
              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-white">Inactivity Threshold</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">Before auto alert</Text>

                <View className="flex-row items-center space-x-2">
                  <View className="items-center">
                    <TextInput
                      value={inactH}
                      onChangeText={setInactH}
                      onBlur={commitInactivityHM}
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={5}
                      className={`${cellClass} w-20`}
                    />
                    <TinyLabel text="hours" />
                  </View>
                  <View className="items-center">
                    <TextInput
                      value={inactM}
                      onChangeText={setInactM}
                      onBlur={commitInactivityHM}
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={2}
                      className={`${cellClass} w-16`}
                    />
                    <TinyLabel text="minutes (0–59)" />
                  </View>
                </View>
              </View>

              {/* Battery Threshold (1–100) */}
              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-white">Battery Alert Threshold</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">Battery % for low-battery alert</Text>
                <TextInput
                  value={batteryVal}
                  onChangeText={setBatteryVal}
                  onBlur={commitBattery}
                  keyboardType="numeric"
                  placeholder="10"
                  maxLength={3}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded w-24 text-center"
                />
              </View>

              {/* Update Interval (MM SS -> seconds) */}
              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-white">Update Interval</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">Between location updates</Text>

                <View className="flex-row items-center space-x-2">
                  <View className="items-center">
                    <TextInput
                      value={intM}
                      onChangeText={setIntM}
                      onBlur={commitIntervalMS}
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={3}
                      className={`${cellClass} w-20`}
                    />
                    <TinyLabel text="minutes" />
                  </View>
                  <View className="items-center">
                    <TextInput
                      value={intS}
                      onChangeText={setIntS}
                      onBlur={commitIntervalMS}
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={2}
                      className={`${cellClass} w-16`}
                    />
                    <TinyLabel text="seconds (0–59)" />
                  </View>
                </View>
              </View>

              {/* Toggles */}
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-medium text-gray-900 dark:text-white">Enable Monitoring</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">Start location and battery monitoring</Text>
                  </View>
                  <Switch
                    value={settings.monitoringEnabled}
                    onValueChange={(value) => handleSettingsChange("monitoringEnabled", value)}
                    trackColor={{ false: "#d1d5db", true: "#10b981" }}
                    thumbColor="#ffffff"
                  />
                </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-base font-medium text-gray-900 dark:text-white">Auto SOS</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">Send SOS automatically on inactivity</Text>
                </View>
                <Switch
                  value={settings.autoSOSEnabled}
                  onValueChange={(value) => handleSettingsChange("autoSOSEnabled", value)}
                  trackColor={{ false: "#d1d5db", true: "#10b981" }}
                  thumbColor="#ffffff"
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-base font-medium text-gray-900 dark:text-white">Prefer MMS</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Try MMS first (needs data), automatically fall back to SMS
                  </Text>
                </View>
                <Switch
                  value={!!settings.preferMMS}
                  onValueChange={(value) => handleSettingsChange("preferMMS", value)}
                  trackColor={{ false: "#d1d5db", true: "#10b981" }}
                  thumbColor="#ffffff"
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-base font-medium text-gray-900 dark:text-white">Notifications</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">Enable push notifications</Text>
                </View>
                  <Switch
                    value={settings.notificationsEnabled}
                    onValueChange={(value) => handleSettingsChange("notificationsEnabled", value)}
                    trackColor={{ false: "#d1d5db", true: "#10b981" }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Contact Modal */}
      <Modal visible={showAddContact} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
          <View className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingContact ? "Edit Contact" : "Add Emergency Contact"}
              </Text>
              <Pressable
                onPress={() => {
                  setShowAddContact(false);
                  setEditingContact(null);
                  setNewContact({ name: "", phoneNumber: "", isPrimary: false });
                  setCountryCode("+94");
                  setLocalPhone("");
                }}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="space-y-4">
              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">Contact Name</Text>
                <TextInput
                  value={newContact.name}
                  onChangeText={(text) => setNewContact({ ...newContact, name: text })}
                  placeholder="Enter contact name"
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                />
              </View>

              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">Phone Number</Text>
                <View className="flex-row">
                  <Pressable
                    onPress={() => setShowCountryModal(true)}
                    className="w-44 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mr-2 px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text className="text-gray-900 dark:text-white">{countryCode}</Text>
                    <Ionicons name="chevron-down" size={16} color="#6b7280" />
                  </Pressable>
                  <TextInput
                    value={localPhone}
                    onChangeText={setLocalPhone}
                    placeholder="Enter local number"
                    keyboardType="phone-pad"
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-3 text-gray-900 dark:text-white"
                  />
                </View>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Stored as: {countryCode}
                  {localPhone.replace(/[^0-9]/g, "")}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900 dark:text-white">Primary Contact</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">This contact will receive priority alerts</Text>
                </View>
                <Switch
                  value={newContact.isPrimary}
                  onValueChange={(value) => setNewContact({ ...newContact, isPrimary: value })}
                  trackColor={{ false: "#d1d5db", true: "#10b981" }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </ScrollView>

          <View className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Pressable
              onPress={editingContact ? handleUpdateContact : handleAddContact}
              className="bg-blue-600 active:bg-blue-700 py-3 rounded-lg"
            >
              <Text className="text-white text-center font-medium">
                {editingContact ? "Update Contact" : "Add Contact"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Country code modal */}
      <ModalSelect
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        title="Select Country Code"
        options={COUNTRY_CODES}
        onSelect={(v) => setCountryCode(v)}
      />
    </View>
  );
}
