import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { C } from "../constants/colors";
import { timeAgo } from "../utils/helpers";
import { apiFetch } from "../api/client";
import { Header } from "../components/layout/Header";
import { EmptyState } from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Ionicons } from "@expo/vector-icons";

interface AppNotification {
  id: string;
  type: "proposal_submitted" | "proposal_approved" | "proposal_rejected" | "comment" | "locked";
  title: string;
  body: string;
  noteId: string;
  initialTab?: "notes" | "proposals" | "comments";
  createdAt: string;
}

const iconMap: Record<AppNotification["type"], keyof typeof Ionicons.glyphMap> = {
  proposal_approved: "checkmark-circle",
  proposal_rejected: "close-circle",
  comment: "chatbubble-ellipses-outline",
  locked: "lock-closed",
  proposal_submitted: "document-text-outline",
};

const iconColorMap: Record<AppNotification["type"], string> = {
  proposal_approved: C.success,
  proposal_rejected: C.danger,
  comment: C.accent,
  locked: C.textMuted,
  proposal_submitted: C.accent,
};

export const NotificationsScreen: React.FC = () => {
  const [notifs, setNotifs] = useState<AppNotification[] | null>(null);
  const [read, setRead] = useState<Set<string>>(new Set());
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      apiFetch<AppNotification[]>("/api/notifications")
        .then(setNotifs)
        .catch(() => setNotifs([]));
    }, [])
  );

  const markAll = () => setRead(new Set(notifs?.map((n) => n.id) ?? []));

  const openNotif = (n: AppNotification) => {
    setRead((prev) => new Set([...prev, n.id]));
    if (n.noteId) {
      navigation.navigate("Note", { id: n.noteId, initialTab: n.initialTab });
    }
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
          {notifs === null ? (
            <ListSkeleton count={4} />
          ) : notifs.length === 0 ? (
            <EmptyState iconName="notifications-outline" title="No notifications" sub="You're all caught up" />
          ) : (
            notifs.map((n) => {
              const isRead = read.has(n.id);
              return (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => openNotif(n)}
                  style={[styles.notifCard, !isRead && styles.unreadNotif]}
                >
                  <View style={styles.notifIcon}>
                    <Ionicons
                      name={iconMap[n.type] ?? "notifications-outline"}
                      size={20}
                      color={iconColorMap[n.type] ?? C.accent}
                    />
                  </View>
                  <View style={styles.notifContent}>
                    <View style={styles.notifHeader}>
                      <Text style={[styles.notifTitle, !isRead && styles.unreadTitle]}>
                        {n.title}
                      </Text>
                      {!isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notifBody}>{n.body}</Text>
                    <Text style={styles.notifTime}>{timeAgo(n.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  markAllBtn: { color: C.accent, fontSize: 13, fontWeight: "600" },
  content: { flex: 1 },
  notifList: { padding: 12, gap: 8 },
  notifCard: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14 },
  unreadNotif: { borderLeftWidth: 3, borderLeftColor: C.accent },
  notifIcon: { flexShrink: 0 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  notifTitle: { fontSize: 14, color: C.textPrimary, flex: 1 },
  unreadTitle: { fontWeight: "600" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginLeft: 8 },
  notifBody: { fontSize: 13, color: C.textSecondary, lineHeight: 20, marginBottom: 4 },
  notifTime: { fontSize: 11, color: C.textMuted },
});
