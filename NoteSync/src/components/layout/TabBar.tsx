import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { C } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

type TabId = "home" | "search" | "notifications" | "profile";

const TABS: { id: TabId; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: "home", icon: "home-outline", label: "Home" },
  { id: "search", icon: "search-outline", label: "Search" },
  { id: "notifications", icon: "notifications-outline", label: "Notifications" },
  { id: "profile", icon: "person-outline", label: "Profile" },
];

interface TabBarProps {
  active: TabId;
  onTab: (tab: TabId) => void;
  unreadCount: number;
}

export const TabBar: React.FC<TabBarProps> = ({ active, onTab, unreadCount }) => (
  <View style={styles.container}>
    {TABS.map(tab => (
      <TouchableOpacity
        key={tab.id}
        onPress={() => onTab(tab.id)}
        style={styles.tab}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={tab.icon}
            size={22}
            color={active === tab.id ? C.accent : C.textMuted}
          />
          {tab.id === "notifications" && unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.label,
            { color: active === tab.id ? C.accent : C.textMuted },
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
  },
});