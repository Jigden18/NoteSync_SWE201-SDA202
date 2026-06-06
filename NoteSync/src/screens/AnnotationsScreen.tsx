import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { C } from "../constants/colors";
import { fmtDate } from "../utils/helpers";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api/client";
import { Header } from "../components/layout/Header";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Toast } from "../components/ui/Toast";
import { EmptyState } from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Ionicons } from "@expo/vector-icons";

interface Annotation {
  id: string;
  noteId: string;
  versionId: string;
  targetLine: number;
  annotationText: string;
  createdAt: string;
  lecturer: { id: string; fullName: string } | null;
}

interface AnnotationsScreenProps {
  noteId: string;
  onBack: () => void;
}

export const AnnotationsScreen: React.FC<AnnotationsScreenProps> = ({ noteId, onBack }) => {
  const { user } = useAuth();
  const [annotations, setAnnotations] = useState<Annotation[] | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [lineNum, setLineNum] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<Annotation[]>(`/api/notes/${noteId}/annotations`),
      apiFetch<any>(`/api/notes/${noteId}`),
    ]).then(([anns, note]) => {
      setAnnotations(anns);
      setCurrentVersionId(note.currentVersionId ?? null);
    }).catch(() => setAnnotations([]));
  }, [noteId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const add = async () => {
    if (!text.trim() || !currentVersionId) return;
    setSubmitting(true);
    try {
      const created = await apiFetch<Annotation>(`/api/notes/${noteId}/annotations`, {
        method: "POST",
        body: JSON.stringify({
          versionId: currentVersionId,
          targetLine: parseInt(lineNum, 10) || 1,
          annotationText: text.trim(),
        }),
      });
      setAnnotations((prev) => [...(prev || []), created]);
      setText("");
      setLineNum("1");
      showToast("Annotation added ✓");
    } catch (e: any) {
      showToast(e.message || "Failed to add annotation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Annotations" onBack={onBack} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.annotationsList}>
          {!annotations ? (
            <ListSkeleton />
          ) : annotations.length === 0 ? (
            <EmptyState iconName="pin-outline" title="No annotations yet" />
          ) : (
            annotations.map((a) => (
              <View key={a.id} style={styles.annotationCard}>
                <View style={styles.annotationHeader}>
                  <Ionicons name="pin" size={14} color={C.warning} />
                  <Text style={styles.annotationLine}>Line {a.targetLine}</Text>
                </View>
                <Text style={styles.annotationText}>{a.annotationText}</Text>
                <Text style={styles.annotationDate}>
                  {a.lecturer?.fullName ?? "Lecturer"} · {fmtDate(a.createdAt)}
                </Text>
              </View>
            ))
          )}
        </View>

        {user?.role === "lecturer" && (
          <View style={styles.addSection}>
            <Text style={styles.addTitle}>ADD ANNOTATION</Text>
            <Input
              value={lineNum}
              onChangeText={setLineNum}
              placeholder="Line number"
              keyboardType="number-pad"
            />
            <View style={{ height: 8 }} />
            <Input
              value={text}
              onChangeText={setText}
              multiline
              rows={3}
              placeholder="Add a note visible to students…"
            />
            <View style={{ height: 12 }} />
            <Btn onPress={add} full disabled={!text.trim() || submitting || !currentVersionId}>
              {submitting ? "Adding…" : "Add Annotation"}
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
  annotationsList: { gap: 10, marginBottom: 20 },
  annotationCard: { backgroundColor: C.warningLight, borderLeftWidth: 3, borderLeftColor: C.warning, borderRadius: 8, padding: 12 },
  annotationHeader: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 4 },
  annotationLine: { fontSize: 11, color: C.warning },
  annotationText: { fontSize: 14, color: "#92400E", lineHeight: 22, marginBottom: 4 },
  annotationDate: { fontSize: 11, color: C.warning },
  addSection: { marginTop: 8 },
  addTitle: { fontSize: 13, fontWeight: "600", color: C.textSecondary, marginBottom: 10 },
});
