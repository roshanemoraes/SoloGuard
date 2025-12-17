import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../src/stores/useAppStore";
import { useI18n } from "../../src/stores/useI18n";

const COUNTRY_CODES = [
  { label: "Sri Lanka (+94)", value: "+94" },
  { label: "India (+91)", value: "+91" },
  { label: "United States (+1)", value: "+1" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "Australia (+61)", value: "+61" },
  { label: "Germany (+49)", value: "+49" },
];

function ModalSelect<T extends string>({
  visible,
  onClose,
  onSelect,
  options,
  title,
  searchPlaceholder,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: T) => void;
  options: { label: string; value: T }[];
  title: string;
  searchPlaceholder?: string;
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
                placeholder={searchPlaceholder || "Search country or code"}
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

export default function TabTwoScreen() {
  const { userProfile, updateUserProfile } = useAppStore();
  const { t } = useI18n();

  const [profileCountryCode, setProfileCountryCode] = useState<string>("+94");
  const [profilePhone, setProfilePhone] = useState<string>("");
  const [showProfileCountryModal, setShowProfileCountryModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    username: "",
    email: "",
    medicalInfo: "",
  });
  const [toast, setToast] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; username?: string; phone?: string; email?: string }>({});

  useEffect(() => {
    setProfileForm({
      fullName: userProfile.fullName || "",
      username: userProfile.username || "",
      email: userProfile.email || "",
      medicalInfo: userProfile.medicalInfo || "",
    });

    if (userProfile.phoneNumber) {
      const match = COUNTRY_CODES.find((c) =>
        userProfile.phoneNumber.startsWith(c.value)
      );
      if (match) {
        setProfileCountryCode(match.value);
        setProfilePhone(userProfile.phoneNumber.slice(match.value.length));
      } else {
        const cc =
          userProfile.phoneNumber.match(/^\+\d{1,3}/)?.[0] ?? "+94";
        setProfileCountryCode(cc);
        setProfilePhone(userProfile.phoneNumber.replace(cc, ""));
      }
    } else {
      setProfileCountryCode("+94");
      setProfilePhone("");
    }
  }, [
    userProfile.fullName,
    userProfile.username,
    userProfile.email,
    userProfile.medicalInfo,
    userProfile.phoneNumber,
  ]);

  const validatePhone = (fullPhone: string) => {
    const rest = fullPhone.replace(/^\+/, "").replace(/[^0-9]/g, "");
    return rest.length >= 7 && rest.length <= 15;
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) return true;
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return re.test(email.trim());
  };

  const validateUsername = (handle: string) => {
    if (!handle.trim()) return true;
    return /^[a-zA-Z0-9._-]{2,20}$/.test(handle.trim().replace(/^@/, ""));
  };

  const handleSaveProfile = () => {
    const composedPhone = `${profileCountryCode}${profilePhone.replace(/[^0-9]/g, "")}`;
    const errors: typeof fieldErrors = {};

    if (!profileForm.fullName.trim() || profileForm.fullName.trim().length < 2) {
      errors.fullName = "Enter at least 2 characters.";
    }

    if (!validateUsername(profileForm.username)) {
      errors.username = "Use letters/numbers ._- (2-20 chars).";
    }

    if (profilePhone.trim() && !validatePhone(composedPhone)) {
      errors.phone = "Phone must be 7-15 digits.";
    }

    if (!validateEmail(profileForm.email)) {
      errors.email = "Enter a valid email.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setToast({ type: "error", message: t("fixFields") });
      return;
    }

    updateUserProfile({
      fullName: profileForm.fullName.trim(),
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
      medicalInfo: profileForm.medicalInfo.trim(),
      phoneNumber: profilePhone.trim() ? composedPhone : "",
    });

    setToast({ type: "success", message: t("profileSaved") });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }} className="dark:bg-gray-900">
      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {toast && (
            <View
              className="rounded-lg p-3 border shadow-sm flex-row items-center space-x-2"
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
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("yourProfile")}
            </Text>
            <Pressable
              onPress={handleSaveProfile}
              className="bg-blue-600 active:bg-blue-700 px-4 py-2 rounded-lg flex-row items-center space-x-2"
            >
              <Ionicons name="save" size={18} color="white" />
              <Text className="text-white font-medium">{t("save")}</Text>
            </Pressable>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                {t("fullName")}
              </Text>
              <TextInput
                value={profileForm.fullName}
                onChangeText={(text) => {
                  setProfileForm({ ...profileForm, fullName: text });
                  setFieldErrors((prev) => ({
                    ...prev,
                    fullName: text.trim().length >= 2 ? undefined : "Enter at least 2 characters.",
                  }));
                }}
                placeholder={t("enterFullName")}
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-3 rounded-lg"
              />
              {fieldErrors.fullName && (
                <Text className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</Text>
              )}
            </View>

            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                {t("username")}
              </Text>
              <TextInput
                value={profileForm.username}
                onChangeText={(text) => {
                  setProfileForm({ ...profileForm, username: text });
                  const valid = validateUsername(text);
                  setFieldErrors((prev) => ({
                    ...prev,
                    username: valid ? undefined : "Use letters/numbers ._- (2-20 chars).",
                  }));
                }}
                placeholder={t("handlePlaceholder")}
                autoCapitalize="none"
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-3 rounded-lg"
              />
              {fieldErrors.username && (
                <Text className="text-xs text-red-600 mt-1">{fieldErrors.username}</Text>
              )}
            </View>

              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                  {t("phoneNumber")}
                </Text>
                <View className="flex-row">
                <Pressable
                  onPress={() => setShowProfileCountryModal(true)}
                  className="w-44 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mr-2 px-4 py-3 flex-row items-center justify-between"
                >
                  <Text className="text-gray-900 dark:text-white">
                    {profileCountryCode}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </Pressable>
                <TextInput
                  value={profilePhone}
                  onChangeText={(val) => {
                    const digits = val.replace(/[^0-9]/g, "");
                    setProfilePhone(digits);
                    const composed = `${profileCountryCode}${digits}`;
                    setFieldErrors((prev) => ({
                      ...prev,
                      phone: val.trim()
                        ? validatePhone(composed)
                          ? undefined
                          : "Phone must be 7-15 digits."
                        : undefined,
                    }));
                  }}
                  placeholder={t("yourPhone")}
                  keyboardType="phone-pad"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-3 text-gray-900 dark:text-white"
                />
                </View>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("storedAs")} {profileCountryCode}
                  {profilePhone.replace(/[^0-9]/g, "")}
                </Text>
                {fieldErrors.phone && (
                  <Text className="text-xs text-red-600 mt-1">{fieldErrors.phone}</Text>
                )}
              </View>

            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                {t("emailOptional")}
              </Text>
              <TextInput
                value={profileForm.email}
                onChangeText={(text) => {
                  setProfileForm({ ...profileForm, email: text });
                  setFieldErrors((prev) => ({
                    ...prev,
                    email: validateEmail(text) ? undefined : "Enter a valid email.",
                  }));
                }}
                placeholder={t("emailPlaceholder")}
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-3 rounded-lg"
              />
              {fieldErrors.email && (
                <Text className="text-xs text-red-600 mt-1">{fieldErrors.email}</Text>
              )}
            </View>

            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                {t("medicalNotes")}
              </Text>
              <TextInput
                value={profileForm.medicalInfo}
                onChangeText={(text) =>
                  setProfileForm({ ...profileForm, medicalInfo: text })
                }
                placeholder={t("medicalPlaceholder")}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-3 rounded-lg"
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("medicalHelper")}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ModalSelect
        visible={showProfileCountryModal}
        onClose={() => setShowProfileCountryModal(false)}
        title={t("selectCountryCode")}
        searchPlaceholder={t("searchCountryCode")}
        options={COUNTRY_CODES}
        onSelect={(v) => setProfileCountryCode(v)}
      />
    </View>
  </SafeAreaView>
  );}
