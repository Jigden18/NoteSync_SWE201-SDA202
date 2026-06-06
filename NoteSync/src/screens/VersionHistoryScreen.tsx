import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { C } from "../constants/colors";
import { fmtDate } from "../utils/helpers";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api/client";
import { Header } from "../components/layout/Header";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Ionicons } from "@expo/vector-icons";

interface Version {
  id: string;
  noteId: string;
  versionNumber: number;
  content: string;
  savedAt: string;
  createdAt: string;
  savedByUser: { id: string; fullName: string } | null;
}

interface VersionHistoryScreenProps {
  noteId: string;
  onBack: () => void;
}

export const VersionHistoryScreen: React.FC<VersionHistoryScreenProps> = ({ noteId, onBack }) => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [pinned, setPinned] = useState<Record<string, boolean>>({});
  const [viewVersion, setViewVersion] = useState<Version | null>(null);

  useEffect(() => {
    apiFetch<Version[]>(`/api/notes/${noteId}/versions`).then(setVersions).catch(() => setVersions([]));
  }, [noteId]);

  const togglePin = (id: string) => setPinned((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={styles.container}>
      <Header title="Version History" onBack={onBack} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.versionList}>
          {!versions ? (
            <ListSkeleton />
          ) : (
            versions.map((v) => (
              <View key={v.id} style={styles.versionCard}>
                <View style={styles.versionHeader}>
                  <View style={styles.versionBadges}>
                    <Badge label={`v${v.versionNumber}`} color="accent" />
                    {pinned[v.id] && <Badge label="Pinned" color="warning" small />}
                  </View>
                  <View style={styles.versionMeta}>
                    <Text style={styles.versionDate}>{fmtDate(v.savedAt || v.createdAt)}</Text>
                    {user?.role === "lecturer" && (
                      <TouchableOpacity onPress={() => togglePin(v.id)} style={styles.pinBtn}>
                        <Ionicons
                          name={pinned[v.id] ? "bookmark" : "bookmark-outline"}
                          size={18}
                          color={pinned[v.id] ? C.warning : C.textMuted}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={styles.versionAuthor}>
                  Saved by {v.savedByUser?.fullName ?? "Unknown"}
                </Text>
                <TouchableOpacity onPress={() => setViewVersion(v)} style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>View this version →</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        open={!!viewVersion}
        onClose={() => setViewVersion(null)}
        title={`Version ${viewVersion?.versionNumber}`}
      >
        {viewVersion && (
          <>
            <View style={styles.versionPreview}>
              <Text style={styles.versionPreviewText}>
                {viewVersion.content.replace(/<[^>]+>/g, " ")}
              </Text>
            </View>
            <Text style={styles.versionPreviewMeta}>
              Saved by {viewVersion.savedByUser?.fullName ?? "Unknown"} · {fmtDate(viewVersion.savedAt || viewVersion.createdAt)}
            </Text>
          </>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1 },
  versionList: { padding: 16, gap: 12 },
  versionCard: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14 },
  versionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  versionBadges: { flexDirection: "row", gap: 8, alignItems: "center" },
  versionMeta: { flexDirection: "row", gap: 8, alignItems: "center" },
  versionDate: { fontSize: 12, color: C.textMuted },
  pinBtn: { padding: 0 },
  versionAuthor: { fontSize: 12, color: C.textSecondary, marginBottom: 4 },
  viewBtn: { alignSelf: "flex-start" },
  viewBtnText: { color: C.accent, fontSize: 13, fontWeight: "600" },
  versionPreview: { backgroundColor: C.bg, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: C.border, maxHeight: 300 },
  versionPreviewText: { fontSize: 13, lineHeight: 20, color: C.textPrimary },
  versionPreviewMeta: { fontSize: 12, color: C.textMuted, marginTop: 10 },
});
