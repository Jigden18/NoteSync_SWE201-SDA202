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
import { Btn } from "../components/ui/Btn";
import { Toast } from "../components/ui/Toast";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Ionicons } from "@expo/vector-icons";

interface Note {
  id: string;
  title: string;
  lectureDate: string;
  moduleId: string;
  currentVersion?: { content: string };
}

interface ModuleNote {
  id: string;
  title: string;
  lectureDate: string;
}

interface ExportScreenProps {
  noteId: string;
  onBack: () => void;
}

export const ExportScreen: React.FC<ExportScreenProps> = ({ noteId, onBack }) => {
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [moduleNotes, setModuleNotes] = useState<ModuleNote[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({ [noteId]: true });
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    apiFetch<Note>(`/api/notes/${noteId}`).then((data) => {
      setNote(data);
      if (user?.role === "lecturer" && data.moduleId) {
        apiFetch<ModuleNote[]>(`/api/modules/${data.moduleId}/notes`).then(setModuleNotes).catch(() => {});
      }
    }).catch(() => {});
  }, [noteId]);

  const handleExport = async () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setToast("PDF exported & ready to share!");
      setTimeout(() => setToast(""), 3000);
    }, 1200);
  };

  const content = note?.currentVersion?.content ?? "";

  return (
    <View style={styles.container}>
      <Header title="Export PDF" onBack={onBack} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>PREVIEW</Text>
          {!note ? (
            <ListSkeleton count={2} />
          ) : content ? (
            <View style={styles.previewContent}>
              <Text style={styles.previewText} numberOfLines={10}>
                {content.replace(/<[^>]+>/g, " ")}
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No content yet.</Text>
          )}
        </View>

        <Btn onPress={handleExport} full disabled={exporting || !note}>
          {exporting ? "Generating PDF…" : "Export Single Note"}
        </Btn>

        {user?.role === "lecturer" && moduleNotes.length > 0 && (
          <View style={styles.compileSection}>
            <Text style={styles.compileTitle}>COMPILE MODULE (select notes)</Text>
            {moduleNotes.map((n) => (
              <View key={n.id} style={styles.checkboxItem}>
                <TouchableOpacity
                  onPress={() => setSelected((s) => ({ ...s, [n.id]: !s[n.id] }))}
                  style={styles.checkbox}
                >
                  <Ionicons
                    name={selected[n.id] ? "checkbox" : "square-outline"}
                    size={20}
                    color={selected[n.id] ? C.accent : C.textMuted}
                  />
                </TouchableOpacity>
                <View style={styles.checkboxLabel}>
                  <Text style={styles.checkboxTitle}>{n.title}</Text>
                  <Text style={styles.checkboxSubtitle}>{fmtDate(n.lectureDate)}</Text>
                </View>
              </View>
            ))}
            <View style={{ height: 14 }} />
            <Btn
              full
              variant="secondary"
              onPress={handleExport}
              disabled={exporting || !Object.values(selected).some(Boolean)}
            >
              Compile & Export Module PDF
            </Btn>
          </View>
        )}
      </ScrollView>

      {toast ? <Toast msg={toast} onClose={() => setToast("")} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, padding: 16 },
  previewContainer: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16 },
  previewTitle: { fontSize: 14, fontWeight: "600", color: C.textSecondary, marginBottom: 10 },
  previewContent: { maxHeight: 200 },
  previewText: { fontSize: 13, lineHeight: 21, color: C.textPrimary },
  emptyText: { fontSize: 13, color: C.textMuted },
  compileSection: { marginTop: 20 },
  compileTitle: { fontSize: 14, fontWeight: "600", color: C.textSecondary, marginBottom: 10 },
  checkboxItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  checkbox: { padding: 0 },
  checkboxLabel: { flex: 1 },
  checkboxTitle: { fontSize: 14, fontWeight: "500", color: C.textPrimary },
  checkboxSubtitle: { fontSize: 12, color: C.textMuted },
});
