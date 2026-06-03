import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { C } from "../constants/colors";
import { delay, User } from "../utils/helpers";
import { useNoteData } from "../contexts/NoteDataContext";
import { Header } from "../components/layout/Header";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Sheet } from "../components/ui/Sheet";
import { Toast } from "../components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";

interface EditorScreenProps {
  noteId: string;
  user: User;
  navigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

const TOOLS = [
  { label: "B", style: "bold" },
  { label: "I", style: "italic" },
  { label: "U", style: "underline" },
  { label: "H1", style: "h1" },
  { label: "H2", style: "h2" },
  { label: "• List", style: "bullet" },
  { label: "1. List", style: "number" },
  { icon: "link", label: "Link", style: "link" },
  { icon: "image", label: "Image", style: "image" },
];

export const EditorScreen: React.FC<EditorScreenProps> = ({ noteId, user, navigate, onBack }) => {
  const { getNote, getVersion, createVersion } = useNoteData();
  const note = getNote(noteId);
  const version = note ? getVersion(note.currentVersionId) : undefined;
  const [content, setContent] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [linkSheet, setLinkSheet] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (version) {
      // Strip HTML tags for plain text editing in React Native
      const plainText = version.content.replace(/<[^>]+>/g, " ");
      setContent(plainText);
    }
  }, [version]);

  const handlePreview = () => {
    navigate("Preview", { noteId, content });
  };

  const insertAtCursor = (inserted: string) => {
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const next = `${content.slice(0, start)}${inserted}${content.slice(end)}`;
    setContent(next);
    const pos = start + inserted.length;
    setSelection({ start: pos, end: pos });
  };

  const insertLink = () => {
    const url = linkUrl.trim();
    if (!url) {
      setToast("Paste a valid link first.");
      return;
    }
    const text = linkText.trim() || url;
    insertAtCursor(`[${text}](${url})`);
    setLinkUrl("");
    setLinkText("");
    setLinkSheet(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setToast("Gallery access is required to insert an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        insertAtCursor(`![Image](${uri})`);
      }
    }
  };

  const applyFormatting = (style: string) => {
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const selectedText = content.slice(start, end) || "text";

    let formatted = "";
    switch (style) {
      case "bold":
        formatted = `**${selectedText}**`;
        break;
      case "italic":
        formatted = `*${selectedText}*`;
        break;
      case "underline":
        formatted = `__${selectedText}__`;
        break;
      case "h1":
        formatted = `\n# ${selectedText}\n`;
        break;
      case "h2":
        formatted = `\n## ${selectedText}\n`;
        break;
      case "bullet":
        formatted = `\n• ${selectedText}`;
        break;
      case "number":
        formatted = `\n1. ${selectedText}`;
        break;
      case "link":
        setLinkText(selectedText.startsWith("http") ? selectedText : selectedText || "Link text");
        setLinkUrl(selectedText.startsWith("http") ? selectedText : "");
        setLinkSheet(true);
        return;
      case "image":
        pickImage();
        return;
      default:
        formatted = selectedText;
    }

    insertAtCursor(formatted);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Edit Note"
        onBack={onBack}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbar}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.label}
            onPress={() => applyFormatting(tool.style)}
            style={styles.toolBtn}
          >
            {tool.icon ? (
              <Ionicons name={tool.icon as any} size={16} color={C.textPrimary} />
            ) : (
              <Text style={styles.toolText}>{tool.label}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.editorContainer}>
        <View style={styles.editor}>
          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            style={styles.textArea}
            placeholder="Start writing your note..."
            placeholderTextColor={C.textMuted}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            selection={selection}
          />
        </View>
        <Text style={styles.hint}>Use toolbar buttons for headings, italics, links, and images.</Text>
      </ScrollView>

      <View style={styles.previewRow}>
        <Btn full onPress={handlePreview}>
          Preview final note
        </Btn>
      </View>

      <Sheet open={linkSheet} onClose={() => setLinkSheet(false)} title="Insert link" half>
        <Input
          value={linkText}
          onChangeText={setLinkText}
          placeholder="Link text"
        />
        <View style={{ height: 12 }} />
        <Input
          value={linkUrl}
          onChangeText={setLinkUrl}
          placeholder="https://example.com"
        />
        <View style={{ height: 14 }} />
        <Btn onPress={insertLink} full disabled={!linkUrl}>
          Insert link
        </Btn>
      </Sheet>

      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  submitBtn: {
    color: C.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  toolbar: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexGrow: 0,
  },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 3,
  },
  toolText: {
    fontSize: 12,
    color: C.textPrimary,
  },
  editorContainer: {
    flex: 1,
    padding: 20,
  },
  editor: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    minHeight: 300,
  },
  textArea: {
    fontSize: 15,
    lineHeight: 26,
    color: C.textPrimary,
    textAlignVertical: "top",
    minHeight: 260,
  },
  hint: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  previewRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
});