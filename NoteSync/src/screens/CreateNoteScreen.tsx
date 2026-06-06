import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { C } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api/client";
import { Header } from "../components/layout/Header";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Toast } from "../components/ui/Toast";

interface CreateNoteScreenProps {
  moduleId: string;
  onBack: () => void;
}

export const CreateNoteScreen: React.FC<CreateNoteScreenProps> = ({ moduleId, onBack }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await apiFetch("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          moduleId,
          lectureDate: date,
          title: title.trim(),
          content: content.trim(),
        }),
      });
      setToast("Note published!");
      setTimeout(() => {
        setToast("");
        onBack();
      }, 1500);
    } catch (e: any) {
      setToast(e.message || "Failed to create note");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="New Lecture Note" onBack={onBack} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>TITLE</Text>
        <Input value={title} onChangeText={setTitle} placeholder="e.g. Introduction to React Hooks" />

        <Text style={styles.label}>DATE</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          style={styles.dateInput}
          placeholderTextColor={C.textMuted}
        />

        <Text style={styles.label}>CONTENT</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Start writing your lecture notes…"
          multiline
          textAlignVertical="top"
          style={styles.contentInput}
          placeholderTextColor={C.textMuted}
        />

        <View style={{ height: 16 }} />
        <Btn onPress={handleCreate} full disabled={!title.trim() || loading}>
          {loading ? "Publishing…" : "Publish Note"}
        </Btn>
      </ScrollView>

      {toast ? <Toast msg={toast} onClose={() => setToast("")} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, padding: 20 },
  label: { fontSize: 12, color: C.textMuted, marginBottom: 6, marginTop: 14 },
  dateInput: {
    height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, fontSize: 14, color: C.textPrimary, backgroundColor: C.surface,
  },
  contentInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12,
    fontSize: 14, color: C.textPrimary, backgroundColor: C.surface, minHeight: 200, lineHeight: 22,
  },
});
