import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { C } from "../constants/colors";
import { delay, fmtDate, User } from "../utils/helpers";
import { useNoteData } from "../contexts/NoteDataContext";
import { Header } from "../components/layout/Header";
import { Btn } from "../components/ui/Btn";
import { Toast } from "../components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";

interface ExportScreenProps {
  noteId: string;
  user: User;
  onBack: () => void;
}

export const ExportScreen: React.FC<ExportScreenProps> = ({ noteId, user, onBack }) => {
  const { getNote, getVersion, notes } = useNoteData();
  const note = getNote(noteId);
  const version = note ? getVersion(note.currentVersionId) : undefined;
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({ [noteId]: true });

  const handleExport = async () => {
    setExporting(true);
    await delay(1200);
    setExporting(false);
    setToast("PDF exported & ready to share!");
    setTimeout(() => setToast(""), 3000);
  };

  const moduleNotes = notes.filter((n) => n.moduleId === "module-1");

  return (
    <View style={styles.container}>
      <Header title="Export PDF" onBack={onBack} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>PREVIEW</Text>
          {version && (
            <View style={styles.previewContent}>
              <Text style={styles.previewText} numberOfLines={10}>
                {version.content.replace(/<[^>]+>/g, " ")}
              </Text>
            </View>
          )}
        </View>

        <Btn onPress={handleExport} full disabled={exporting}>
          {exporting ? "Generating PDF…" : "Export Single Note"}
        </Btn>

        {user.role === "lecturer" && (
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

      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  previewContainer: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSecondary,
    marginBottom: 10,
  },
  previewContent: {
    maxHeight: 200,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 21,
    color: C.textPrimary,
  },
  compileSection: {
    marginTop: 20,
  },
  compileTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSecondary,
    marginBottom: 10,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  checkbox: {
    padding: 0,
  },
  checkboxLabel: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: C.textPrimary,
  },
  checkboxSubtitle: {
    fontSize: 12,
    color: C.textMuted,
  },
});