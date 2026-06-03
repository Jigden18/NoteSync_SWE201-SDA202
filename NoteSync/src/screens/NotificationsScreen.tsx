import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { C } from "../constants/colors";
import { timeAgo } from "../utils/helpers";
import { MOCK_NOTIFICATIONS, Notification } from "../data/mockData";
import { Header } from "../components/layout/Header";
import { Ionicons } from "@expo/vector-icons";

const iconMap: Record<Notification["type"], keyof typeof Ionicons.glyphMap> = {
  proposal_approved: "checkmark-circle",
  proposal_rejected: "close-circle",
  comment: "chatbubble-ellipses-outline",
  locked: "lock-closed",
  proposal_submitted: "document-text-outline",
};

const iconColorMap: Record<Notification["type"], string> = {
  proposal_approved: C.success,
  proposal_rejected: C.danger,
  comment: C.accent,
  locked: C.textMuted,
  proposal_submitted: C.accent,
};

export const NotificationsScreen: React.FC = () => {
  const [notifs, setNotifs] = useState<Notification[]>([...MOCK_NOTIFICATIONS]);

  const markAll = () => {
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        right={
          <TouchableOpacity onPress={markAll}>
            <Text style={styles.markAllBtn}>Mark all read</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.notifList}>
          {notifs.map((n) => (
            <TouchableOpacity
              key={n.id}
              onPress={() => markRead(n.id)}
              style={[
                styles.notifCard,
                !n.read && styles.unreadNotif,
              ]}
            >
              <View style={styles.notifIcon}>
                <Ionicons
                  name={iconMap[n.type] || "notifications-outline"}
                  size={20}
                  color={iconColorMap[n.type] || C.accent}
                />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  <Text
                    style={[
                      styles.notifTitle,
                      !n.read && styles.unreadTitle,
                    ]}
                  >
                    {n.title}
                  </Text>
                  {!n.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifBody}>{n.body}</Text>
                <Text style={styles.notifTime}>{timeAgo(n.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  markAllBtn: {
    color: C.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  notifList: {
    padding: 12,
    gap: 8,
  },
  notifCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  unreadNotif: {
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
    backgroundColor: C.surface,
  },
  notifIcon: {
    flexShrink: 0,
  },
  notifIconText: {
    fontSize: 20,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    color: C.textPrimary,
  },
  unreadTitle: {
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
  },
  notifBody: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    color: C.textMuted,
  },
});