import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppStore } from "../src/stores/useAppStore";
import { EmergencyContact, AppSettings } from "../src/types";
import { useI18n, Lang } from "../src/stores/useI18n";

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
  const [query, setQuery] = useState("");
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase())
  );
  const favorites = options.slice(0, 3);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40" />
      <View className="absolute left-4 right-4 top-[12%] bottom-[12%]">
        <View className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-cyan-500">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-2">
                <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                  <Ionicons name="flag" size={20} color="#fff" />
                </View>
                <Text className="text-lg font-semibold text-white">{title}</Text>
              </View>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color="#e5e7eb" />
              </Pressable>
            </View>
            <View className="mt-3 bg-white/15 rounded-lg px-3 py-2 border border-white/20">
              <TextInput
                placeholder="Search country or code"
                placeholderTextColor="#e5e7eb"
                value={query}
                onChangeText={setQuery}
                className="text-white"
              />
            </View>
          </View>

          <View className="px-4 py-3">
            <View className="flex-row flex-wrap" style={{ rowGap: 8 }}>
              {favorites.map((fav) => (
                <Pressable
                  key={fav.value}
                  onPress={() => {
                    onSelect(fav.value as T);
                    onClose();
                  }}
                  className="mr-2 px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                >
                  <Text className="text-xs font-semibold text-blue-800 dark:text-blue-100">{fav.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item.value as T);
                  onClose();
                }}
                className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex-row items-center"
              >
                <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 items-center justify-center mr-3">
                  <Ionicons name="earth" size={16} color="#2563eb" />
                </View>
                <Text className="text-base text-gray-900 dark:text-white">{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function SetupScreen() {
  const router = useRouter();
  const { lang, setLang } = useI18n();
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
  const [contactErrors, setContactErrors] = useState<{ name?: string; phone?: string }>({});
  const [toast, setToast] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ visible: boolean; contactId: string | null; name: string }>({
    visible: false,
    contactId: null,
    name: "",
  });
  const [togglingContactId, setTogglingContactId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  /** ---- SETTINGS FORM: Inactivity (HH/MM) + Interval (MM/SS) + Battery ---- */
  // Inactivity (store in minutes)
  const [inactH, setInactH] = useState<string>("");
  const [inactM, setInactM] = useState<string>("");

  // Update interval (store in seconds)
  const [intM, setIntM] = useState<string>("");
  const [intS, setIntS] = useState<string>("");

  const [batteryVal, setBatteryVal] = useState<string>("");
  const [settingErrors, setSettingErrors] = useState<{ battery?: string; inactivity?: string; interval?: string }>({});

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
    const clean = s.replace(/[^0-9]/g, "");
    if (!clean.trim()) return 0;
    const n = Number(clean);
    return Number.isFinite(n) ? Math.floor(Math.max(0, n)) : 0;
  };
  const clamp059 = (n: number) => Math.max(0, Math.min(59, n));

  const validateInactivityInline = (hText: string, mText: string) => {
    const h = toInt(hText);
    const m = clamp059(toInt(mText));
    const totalMinutes = h * 60 + m;
    if (totalMinutes < 1) {
      setSettingErrors((prev) => ({ ...prev, inactivity: "Must be at least 1 minute." }));
    } else {
      setSettingErrors((prev) => ({ ...prev, inactivity: undefined }));
    }
  };

  const commitInactivityHM = (markChanged = true) => {
    const h = toInt(inactH);
    const m = clamp059(toInt(inactM));
    const totalMinutes = h * 60 + m;
    if (totalMinutes < 1) {
      setSettingErrors((prev) => ({ ...prev, inactivity: "Must be at least 1 minute." }));
      return;
    }
    setSettingErrors((prev) => ({ ...prev, inactivity: undefined }));
    updateSettings({ inactivityThreshold: totalMinutes });
    setInactM(String(m)); // reflect clamp
    if (markChanged) setHasUnsavedChanges(true);
  };

  const validateIntervalInline = (mText: string, sText: string) => {
    const m = toInt(mText);
    const s = clamp059(toInt(sText));
    const totalSeconds = m * 60 + s;
    if (totalSeconds < 5) {
      setSettingErrors((prev) => ({ ...prev, interval: "Must be at least 5 seconds." }));
    } else {
      setSettingErrors((prev) => ({ ...prev, interval: undefined }));
    }
  };

  const commitIntervalMS = (markChanged = true) => {
    const m = toInt(intM);
    const s = clamp059(toInt(intS));
    const totalSeconds = m * 60 + s;
    if (totalSeconds < 5) {
      setSettingErrors((prev) => ({ ...prev, interval: "Must be at least 5 seconds." }));
      return;
    }
    setSettingErrors((prev) => ({ ...prev, interval: undefined }));
    updateSettings({ updateInterval: totalSeconds });
    setIntS(String(s)); // reflect clamp
    if (markChanged) setHasUnsavedChanges(true);
  };

  const validateBatteryInline = (val: string) => {
    const n = Number(val);
    if (!val.trim()) {
      setSettingErrors((prev) => ({ ...prev, battery: "Enter a number 1-100." }));
      return;
    }
    if (!Number.isFinite(n)) {
      setSettingErrors((prev) => ({ ...prev, battery: "Enter a number 1-100." }));
      return;
    }
    const clamped = Math.max(1, Math.min(100, Math.floor(n)));
    if (clamped !== n) {
      setSettingErrors((prev) => ({ ...prev, battery: "Use 1-100 only." }));
    } else {
      setSettingErrors((prev) => ({ ...prev, battery: undefined }));
    }
  };

  const commitBattery = (markChanged = true) => {
    const n = Number(batteryVal);
    if (!Number.isFinite(n)) {
      setSettingErrors((prev) => ({ ...prev, battery: "Enter a number 1-100." }));
      return;
    }
    const clamped = Math.max(1, Math.min(100, Math.floor(n)));
    setSettingErrors((prev) => ({ ...prev, battery: undefined }));
    if (String(clamped) !== batteryVal) setBatteryVal(String(clamped));
    updateSettings({ batteryThreshold: clamped });
    if (markChanged) setHasUnsavedChanges(true);
  };

  /** ---- Contacts ---- */
  const validatePhone = (fullPhone: string) => {
    const rest = fullPhone.replace(/^\+/, "").replace(/[^0-9]/g, "");
    return rest.length >= 7 && rest.length <= 15;
  };

  const validateContactFields = (name: string, phone: string) => {
    const errors: { name?: string; phone?: string } = {};
    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Enter at least 2 characters.";
    }
    if (!phone.trim()) {
      errors.phone = "Enter a phone number.";
    } else {
      const fullPhone = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;
      if (!validatePhone(fullPhone)) {
        errors.phone = "Phone must be 7-15 digits.";
      }
    }
    return errors;
  };

  const handleAddContact = () => {
    try {
      const errors = validateContactFields(newContact.name, localPhone);
      setContactErrors(errors);
      if (Object.keys(errors).length > 0) {
        setToast({ type: "error", message: "Please fix the highlighted fields." });
        return;
      }

      const fullPhone = `${countryCode}${localPhone.replace(/[^0-9]/g, "")}`;

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
      setToast({ type: "success", message: "Contact added successfully." });
      setShowAddContact(false);
    } catch (e) {
      setToast({ type: "error", message: "Something went wrong. Please try again." });
    }
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setNewContact({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      isPrimary: contact.isPrimary,
    });
    setContactErrors({});
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
    try {
      if (!editingContact) return;
      const errors = validateContactFields(newContact.name, localPhone);
      setContactErrors(errors);
      if (Object.keys(errors).length > 0) {
        setToast({ type: "error", message: "Please fix the highlighted fields." });
        return;
      }

      const fullPhone = `${countryCode}${localPhone.replace(/[^0-9]/g, "")}`;

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
      setContactErrors({});
      setShowAddContact(false);
    } catch (e) {
      setToast({ type: "error", message: "Something went wrong. Please try again." });
    }
  };

  const handleDeleteContact = (contactId: string) => {
    const contact = emergencyContacts.find((c) => c.id === contactId);
    setConfirmDelete({ visible: true, contactId, name: contact?.name || "this contact" });
  };

  const toggleContactActive = (contactId: string, isActive: boolean) => {
    if (togglingContactId === contactId) return; // debounce rapid taps
    setTogglingContactId(contactId);
    updateEmergencyContact(contactId, { isActive });
    setTimeout(() => setTogglingContactId((prev) => (prev === contactId ? null : prev)), 150);
  };

  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    updateSettings({ [key]: value });
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    // Validate and commit all settings
    commitInactivityHM(false);
    commitIntervalMS(false);
    commitBattery(false);

    // Check for errors
    if (settingErrors.inactivity || settingErrors.interval || settingErrors.battery) {
      setToast({ type: "error", message: "Please fix validation errors before saving." });
      return;
    }

    setHasUnsavedChanges(false);
    setToast({ type: "success", message: "All settings saved successfully!" });

    // Auto-dismiss success toast after 3 seconds
    setTimeout(() => setToast(null), 3000);
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
            disabled={togglingContactId === item.id}
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
          {/* Language selector */}
          <View className="flex-row items-center justify-end mb-3 space-x-2">
            {[
              { code: "en" as Lang, label: "English" },
              { code: "si" as Lang, label: "සිංහල" },
            ].map((opt) => (
              <Pressable
                key={opt.code}
                onPress={() => setLang(opt.code)}
                className={`px-3 py-2 rounded-lg border ${
                  lang === opt.code
                    ? "bg-green-600 border-green-700"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    lang === opt.code ? "text-white" : "text-gray-800 dark:text-gray-100"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {toast && (
            <View
              className="mb-4 rounded-lg p-3 border shadow-sm flex-row items-center space-x-2"
              style={{
                backgroundColor: toast.type === "error" ? "#fef2f2" : "#ecfdf3",
                borderColor: toast.type === "error" ? "#fecaca" : "#bbf7d0",
              }}
            >
              <Ionicons
                name={toast.type === "error" ? "alert-circle" : "checkmark-circle"}
                size={18}
                color={toast.type === "error" ? "#dc2626" : "#16a34a"}
              />
              <Text
                className="text-sm flex-1"
                style={{ color: toast.type === "error" ? "#991b1b" : "#166534" }}
              >
                {toast.message}
              </Text>
              <Pressable onPress={() => setToast(null)} className="p-1">
                <Ionicons name="close" size={16} color="#6b7280" />
              </Pressable>
            </View>
          )}
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

            {/* Save Button at Top */}
            <View className="mb-4">
              <Pressable
                onPress={handleSaveAll}
                className={`py-4 rounded-lg flex-row items-center justify-center space-x-2 ${
                  hasUnsavedChanges
                    ? "bg-green-600 active:bg-green-700"
                    : "bg-gray-400 dark:bg-gray-600"
                }`}
              >
                <Ionicons
                  name={hasUnsavedChanges ? "save" : "checkmark-circle"}
                  size={22}
                  color="white"
                />
                <Text className="text-white text-lg font-semibold">
                  {hasUnsavedChanges ? "Save All Settings" : "All Settings Saved"}
                </Text>
              </Pressable>
              {hasUnsavedChanges && (
                <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  You have unsaved changes
                </Text>
              )}
            </View>

            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-6">
              {/* Inactivity Threshold (HH MM -> minutes) */}
              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-white">Inactivity Threshold</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">Before auto alert</Text>

                <View className="flex-row items-center space-x-2">
                  <View className="items-center">
                    <TextInput
                      value={inactH}
                      onChangeText={(text) => {
                        const digits = text.replace(/[^0-9]/g, "");
                        setInactH(digits);
                        validateInactivityInline(digits, inactM);
                      }}
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
                      onChangeText={(text) => {
                        const digits = text.replace(/[^0-9]/g, "");
                        setInactM(digits);
                        validateInactivityInline(inactH, digits);
                      }}
                      onBlur={commitInactivityHM}
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={2}
                      className={`${cellClass} w-16`}
                    />
                    <TinyLabel text="minutes (0–59)" />
                  </View>
                </View>
                {settingErrors.inactivity && (
                  <Text className="text-xs text-red-600 mt-1">{settingErrors.inactivity}</Text>
                )}
              </View>

              {/* Battery Threshold (1–100) */}
              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-white">Battery Alert Threshold</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">Battery % for low-battery alert</Text>
                <TextInput
                  value={batteryVal}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, "");
                    setBatteryVal(digits);
                    validateBatteryInline(digits);
                  }}
                  onBlur={commitBattery}
                  keyboardType="numeric"
                  placeholder="10"
                  maxLength={3}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded w-24 text-center"
                />
                {settingErrors.battery && (
                  <Text className="text-xs text-red-600 mt-1">{settingErrors.battery}</Text>
                )}
              </View>

              {/* Update Interval (MM SS -> seconds) */}
              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-white">Update Interval</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">Between location updates</Text>

                <View className="flex-row items-center space-x-2">
                  <View className="items-center">
                    <TextInput
                      value={intM}
                      onChangeText={(text) => {
                        const digits = text.replace(/[^0-9]/g, "");
                        setIntM(digits);
                        validateIntervalInline(digits, intS);
                      }}
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
                      onChangeText={(text) => {
                        const digits = text.replace(/[^0-9]/g, "");
                        setIntS(digits);
                        validateIntervalInline(intM, digits);
                      }}
                      onBlur={commitIntervalMS}
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={2}
                      className={`${cellClass} w-16`}
                    />
                    <TinyLabel text="seconds (0–59)" />
                  </View>
                </View>
                {settingErrors.interval && (
                  <Text className="text-xs text-red-600 mt-1">{settingErrors.interval}</Text>
                )}
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
      <Modal
        visible={showAddContact}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowAddContact(false);
          setEditingContact(null);
          setNewContact({ name: "", phoneNumber: "", isPrimary: false });
          setCountryCode("+94");
          setLocalPhone("");
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setShowAddContact(false);
            setEditingContact(null);
            setNewContact({ name: "", phoneNumber: "", isPrimary: false });
            setCountryCode("+94");
            setLocalPhone("");
          }}
        >
          <View className="flex-1 bg-black/50" />
        </TouchableWithoutFeedback>
        <View className="absolute left-4 right-4 top-[10%] bottom-[10%]">
          <View className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-2">
                  <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 items-center justify-center">
                    <Ionicons name="person-add" size={20} color="#2563eb" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingContact ? "Edit Contact" : "Add Emergency Contact"}
                  </Text>
                </View>
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
                    onChangeText={(text) => {
                      setNewContact({ ...newContact, name: text });
                      setContactErrors((prev) => ({
                        ...prev,
                        name: text.trim().length >= 2 ? undefined : "Enter at least 2 characters.",
                      }));
                    }}
                    placeholder="Enter contact name"
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                  />
                  {contactErrors.name && (
                    <Text className="text-xs text-red-600 mt-1">{contactErrors.name}</Text>
                  )}
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
                      onChangeText={(val) => {
                        const digits = val.replace(/[^0-9]/g, "");
                        setLocalPhone(digits);
                        const errors = validateContactFields(newContact.name, digits);
                        setContactErrors((prev) => ({ ...prev, phone: errors.phone }));
                      }}
                      placeholder="Enter local number"
                      keyboardType="phone-pad"
                      className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-3 text-gray-900 dark:text-white"
                    />
                  </View>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Stored as: {countryCode}
                    {localPhone.replace(/[^0-9]/g, "")}
                  </Text>
                  {contactErrors.phone && (
                    <Text className="text-xs text-red-600 mt-1">{contactErrors.phone}</Text>
                  )}
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

            <View className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90">
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

      {/* Delete contact confirmation */}
      <Modal
        visible={confirmDelete.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete({ visible: false, contactId: null, name: "" })}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmDelete({ visible: false, contactId: null, name: "" })}>
          <View className="flex-1 bg-black/40" />
        </TouchableWithoutFeedback>
        <View
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-700"
          style={{ position: "absolute", left: 16, right: 16, top: "30%" }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center space-x-2">
              <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 items-center justify-center">
                <Ionicons name="trash" size={20} color="#dc2626" />
              </View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">Delete contact?</Text>
            </View>
            <Pressable onPress={() => setConfirmDelete({ visible: false, contactId: null, name: "" })}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </Pressable>
          </View>
          <Text className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            This will remove <Text className="font-semibold">{confirmDelete.name}</Text> from your emergency contacts.
          </Text>
          <View className="flex-row space-x-3">
            <Pressable
              onPress={() => setConfirmDelete({ visible: false, contactId: null, name: "" })}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-800 dark:text-gray-100 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (confirmDelete.contactId) removeEmergencyContact(confirmDelete.contactId);
                setConfirmDelete({ visible: false, contactId: null, name: "" });
              }}
              className="flex-1 bg-red-600 active:bg-red-700 rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">Delete</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
