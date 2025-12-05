import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../src/stores/useAppStore";

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
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </Text>
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
              <Text className="text-base text-gray-900 dark:text-white">
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

export default function TabTwoScreen() {
  const { userProfile, updateUserProfile } = useAppStore();

  const [profileCountryCode, setProfileCountryCode] = useState<string>("+94");
  const [profilePhone, setProfilePhone] = useState<string>("");
  const [showProfileCountryModal, setShowProfileCountryModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    username: "",
    email: "",
    medicalInfo: "",
  });

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

  const handleSaveProfile = () => {
    const composedPhone = `${profileCountryCode}${profilePhone.replace(
      /[^0-9]/g,
      ""
    )}`;
    if (profilePhone.trim() && !validatePhone(composedPhone)) {
      Alert.alert("Error", "Please enter a valid phone number for your profile.");
      return;
    }

    updateUserProfile({
      fullName: profileForm.fullName.trim(),
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
      medicalInfo: profileForm.medicalInfo.trim(),
      phoneNumber: profilePhone.trim() ? composedPhone : "",
    });

    Alert.alert(
      "Saved",
      "Your profile has been updated. We will include these details in SOS messages."
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Profile
            </Text>
            <Pressable
              onPress={handleSaveProfile}
              className="bg-blue-600 active:bg-blue-700 px-4 py-2 rounded-lg flex-row items-center space-x-2"
            >
              <Ionicons name="save" size={18} color="white" />
              <Text className="text-white font-medium">Save</Text>
            </Pressable>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                Full Name
              </Text>
              <TextInput
                value={profileForm.fullName}
                onChangeText={(text) =>
                  setProfileForm({ ...profileForm, fullName: text })
                }
                placeholder="Enter your full name"
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-3 rounded-lg"
              />
            </View>

            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                Username
              </Text>
              <TextInput
                value={profileForm.username}
                onChangeText={(text) =>
                  setProfileForm({ ...profileForm, username: text })
                }
                placeholder="@handle"
                autoCapitalize="none"
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-3 rounded-lg"
              />
            </View>

            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                Phone Number
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
                  onChangeText={setProfilePhone}
                  placeholder="Your phone"
                  keyboardType="phone-pad"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-3 text-gray-900 dark:text-white"
                />
              </View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Stored as: {profileCountryCode}
                {profilePhone.replace(/[^0-9]/g, "")}
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                Email (optional)
              </Text>
              <TextInput
                value={profileForm.email}
                onChangeText={(text) =>
                  setProfileForm({ ...profileForm, email: text })
                }
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-3 rounded-lg"
              />
            </View>

            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white mb-2">
                Medical / Other Notes
              </Text>
              <TextInput
                value={profileForm.medicalInfo}
                onChangeText={(text) =>
                  setProfileForm({ ...profileForm, medicalInfo: text })
                }
                placeholder="Allergies, medications, other critical info"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-3 rounded-lg"
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                These details are included in SOS messages for responders.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ModalSelect
        visible={showProfileCountryModal}
        onClose={() => setShowProfileCountryModal(false)}
        title="Select Country Code"
        options={COUNTRY_CODES}
        onSelect={(v) => setProfileCountryCode(v)}
      />
    </View>
  );
}
