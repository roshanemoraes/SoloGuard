import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Tabs, useRouter } from "expo-router";
import { Pressable, View, Text, Image } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function IoniconTabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

function HeaderTitle() {
  const colorScheme = useColorScheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={{ width: 32, height: 32, borderRadius: 8 }}
        resizeMode="contain"
      />
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: colorScheme === "dark" ? "#ffffff" : "#000000",
        }}
      >
        SoloGuard
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ef4444", // Red for emergency theme
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#1f2937" : "#ffffff",
          borderTopColor: colorScheme === "dark" ? "#374151" : "#e5e7eb",
        },
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#111827" : "#ffffff",
        },
        headerTintColor: colorScheme === "dark" ? "#ffffff" : "#000000",
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "SoloGuard",
          headerTitle: () => <HeaderTitle />,
          tabBarIcon: ({ color }) => (
            <IoniconTabBarIcon name="home" color={color} />
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push("/setup")}>
              {({ pressed }) => (
                <Ionicons
                  name="settings"
                  size={25}
                  color={Colors[colorScheme ?? "light"].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: "Activity Logs",
          headerTitle: "Activity Logs",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IoniconTabBarIcon name="list" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Profile",
          headerTitle: "Your Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IoniconTabBarIcon name="person-circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
