import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { C } from "../constants/colors";
import { fmtDate } from "../utils/helpers";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch, getStoredToken, API_URL } from "../api/client";
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

  const handleExport = async (isCompilation: boolean) => {
    if (!note) return;
    setExporting(true);
    try {
      let htmlContent = "";
      let pdfName = "";

      if (isCompilation) {
        const selectedNoteIds = Object.keys(selected).filter((id) => selected[id]);
        if (selectedNoteIds.length === 0) {
          setToast("Select at least one note to compile.");
          setExporting(false);
          return;
        }
        const res = await apiFetch<{ content: string }>(`/api/modules/${note.moduleId}/compile`, {
          method: "POST",
          body: JSON.stringify({ noteIds: selectedNoteIds }),
        });
        htmlContent = res.content;
        pdfName = `${note.title.replace(/\s+/g, "_")}_Compiled.pdf`;
      } else {
        const res = await apiFetch<{ title: string; content: string }>(`/api/notes/${noteId}/export`);
        htmlContent = res.content;
        pdfName = `${res.title.replace(/\s+/g, "_")}.pdf`;
      }

      // Generate local PDF file from HTML content
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();

      // Upload generated PDF to backend
      const formData = new FormData();
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append("file", blob, pdfName);
      } else {
        formData.append("file", {
          uri: uri,
          name: pdfName,
          type: "application/pdf",
        } as any);
      }
      if (!isCompilation) {
        formData.append("noteId", noteId);
      }
      formData.append("moduleId", note.moduleId);
      formData.append("isCompilation", isCompilation ? "true" : "false");

      const token = await getStoredToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const uploadRes = await fetch(`${API_URL}/api/pdfs/upload`, {
        method: "POST",
        body: formData,
        headers,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Failed to save PDF on server");
      }

      // Open sharing dialog or download file depending on platform
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri);
        setToast("PDF exported & ready to share!");
      } else if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = uri;
        link.download = pdfName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast("PDF exported & downloaded!");
      } else {
        setToast("PDF exported! (Sharing not supported on this device)");
      }
    } catch (error: any) {
      setToast(error.message || "Failed to export PDF");
    } finally {
      setExporting(false);
      setTimeout(() => setToast(""), 3000);
    }
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

        <Btn onPress={() => handleExport(false)} full disabled={exporting || !note}>
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
              onPress={() => handleExport(true)}
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

