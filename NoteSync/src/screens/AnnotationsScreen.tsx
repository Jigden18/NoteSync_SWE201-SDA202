import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { C } from "../constants/colors";
import { delay, fmtDate, User } from "../utils/helpers";
import { MOCK_ANNOTATIONS, Annotation } from "../data/mockData";
import { Header } from "../components/layout/Header";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Toast } from "../components/ui/Toast";
import { EmptyState } from "../components/ui/EmptyState";
import { Ionicons } from "@expo/vector-icons";

interface AnnotationsScreenProps {
  noteId: string;
  user: User;
  onBack: () => void;
}

export const AnnotationsScreen: React.FC<AnnotationsScreenProps> = ({
  noteId,
  user,
  onBack,
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([
    ...MOCK_ANNOTATIONS.filter((a) => a.noteId === noteId),
  ]);
  const [text, setText] = useState("");
  const [toast, setToast] = useState("");

  const add = async () => {
    if (!text.trim()) return;
    await delay(300);
    setAnnotations((a) => [
      ...a,
      {
        id: `ann-${Date.now()}`,
        noteId,
        targetLine: Math.floor(Math.random() * 10) + 1,
        annotationText: text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setText("");
    setToast("Annotation added ✓");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <View style={styles.container}>
      <Header title="Annotations" onBack={onBack} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.annotationsList}>
          {annotations.map((a) => (
            <View key={a.id} style={styles.annotationCard}>
              <View style={styles.annotationHeader}>
                <Ionicons name="pin" size={14} color={C.warning} />
                <Text style={styles.annotationLine}>Line {a.targetLine}</Text>
              </View>
              <Text style={styles.annotationText}>{a.annotationText}</Text>
              <Text style={styles.annotationDate}>{fmtDate(a.createdAt)}</Text>
            </View>
          ))}
          {!annotations.length && (
            <EmptyState iconName="pin-outline" title="No annotations yet" />
          )}
        </View>

        {user.role === "lecturer" && (
          <View style={styles.addSection}>
            <Text style={styles.addTitle}>ADD ANNOTATION</Text>
            <Input
              value={text}
              onChangeText={setText}
              multiline
              rows={3}
              placeholder="Add a note visible to students…"
            />
            <View style={{ height: 12 }} />
            <Btn onPress={add} full disabled={!text.trim()}>
              Add Annotation
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
  annotationsList: {
    gap: 10,
    marginBottom: 20,
  },
  annotationCard: {
    backgroundColor: C.warningLight,
    borderLeftWidth: 3,
    borderLeftColor: C.warning,
    borderRadius: 8,
    padding: 12,
  },
  annotationHeader: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 4,
  },
  annotationLine: {
    fontSize: 11,
    color: C.warning,
  },
  annotationText: {
    fontSize: 14,
    color: "#92400E",
    lineHeight: 22,
    marginBottom: 4,
  },
  annotationDate: {
    fontSize: 11,
    color: C.warning,
  },
  addSection: {
    marginTop: 8,
  },
  addTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSecondary,
    marginBottom: 10,
  },
});