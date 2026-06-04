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

type ProposalDraft = {
  summary: string;
  isInline: boolean;
  originalText?: string;
  suggestedText?: string;
};

const normalizeText = (text: string) => text.replace(/\s+/g, " ").trim();

const buildProposalDraft = (
  baseText: string,
  nextText: string,
): ProposalDraft | null => {
  const base = normalizeText(baseText);
  const next = normalizeText(nextText);

  if (!base || base === next) {
    return null;
  }

  let prefix = 0;
  while (
    prefix < base.length &&
    prefix < next.length &&
    base[prefix] === next[prefix]
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < base.length - prefix &&
    suffix < next.length - prefix &&
    base[base.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const originalText = base.slice(prefix, base.length - suffix).trim();
  const suggestedText = next.slice(prefix, next.length - suffix).trim();
  const changeSize = Math.max(originalText.length, suggestedText.length);
  const changeShare = changeSize / Math.max(base.length, next.length);
  const isInline = changeSize > 0 && changeSize <= 140 && changeShare <= 0.35;

  if (isInline) {
    const summary =
      originalText && suggestedText
        ? `Update: ${originalText.slice(0, 40)}${originalText.length > 40 ? "..." : ""}`
        : originalText
          ? `Remove: ${originalText.slice(0, 40)}${originalText.length > 40 ? "..." : ""}`
          : `Add: ${suggestedText.slice(0, 40)}${suggestedText.length > 40 ? "..." : ""}`;

    return {
      summary,
      isInline: true,
      originalText: originalText || undefined,
      suggestedText: suggestedText || undefined,
    };
  }

  return {
    summary: "Full-document revision submitted",
    isInline: false,
  };
};

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

export const EditorScreen: React.FC<EditorScreenProps> = ({
  noteId,
  user,
  navigate,
  onBack,
}) => {
  const { getNote, getVersion, createProposal } = useNoteData();
  const note = getNote(noteId);
  const version = note ? getVersion(note.currentVersionId) : undefined;
  const [content, setContent] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [linkSheet, setLinkSheet] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [toast, setToast] = useState("");
  const baseContent = version
    ? normalizeText(version.content.replace(/<[^>]+>/g, " "))
    : "";

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

  const handleSubmitProposal = () => {
    if (!version || !note) {
      setToast("Unable to submit proposal right now.");
      return;
    }

    const draft = buildProposalDraft(baseContent, content);
    if (!draft) {
      setToast("Make a change before submitting a proposal.");
      return;
    }

    createProposal(note.id, user.fullName, draft.summary, {
      isInline: draft.isInline,
      originalText: draft.originalText,
      suggestedText: draft.suggestedText,
    });

    onBack();
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
        setLinkText(
          selectedText.startsWith("http")
            ? selectedText
            : selectedText || "Link text",
        );
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
      <Header title="Edit Note" onBack={onBack} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.toolbar}
      >
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.label}
            onPress={() => applyFormatting(tool.style)}
            style={styles.toolBtn}
          >
            {tool.icon ? (
              <Ionicons
                name={tool.icon as any}
                size={16}
                color={C.textPrimary}
              />
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
        <Text style={styles.hint}>
          Use toolbar buttons for headings, italics, links, and images.
        </Text>
      </ScrollView>

      <View style={styles.previewRow}>
        <Btn full onPress={handlePreview} variant="secondary">
          Preview final note
        </Btn>
        <View style={{ height: 10 }} />
        <Btn
          full
          onPress={handleSubmitProposal}
          disabled={!content.trim() || normalizeText(content) === baseContent}
        >
          Propose changes
        </Btn>
      </View>

      <Sheet
        open={linkSheet}
        onClose={() => setLinkSheet(false)}
        title="Insert link"
        half
      >
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
