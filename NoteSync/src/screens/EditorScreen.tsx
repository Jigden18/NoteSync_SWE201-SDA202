import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Clipboard,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { C } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import { useNoteData } from "../contexts/NoteDataContext";
import { apiFetch, API_URL, getStoredToken } from "../api/client";
import { Header } from "../components/layout/Header";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Sheet } from "../components/ui/Sheet";
import { Toast } from "../components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";

const normalizeText = (text: string) => text.replace(/\s+/g, " ").trim();

const buildProposalDraft = (baseText: string, nextText: string) => {
  const base = normalizeText(baseText);
  const next = normalizeText(nextText);
  if (!base || base === next) return null;

  let prefix = 0;
  while (prefix < base.length && prefix < next.length && base[prefix] === next[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < base.length - prefix &&
    suffix < next.length - prefix &&
    base[base.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) suffix++;

  const originalText = base.slice(prefix, base.length - suffix).trim();
  const suggestedText = next.slice(prefix, next.length - suffix).trim();
  const changeSize = Math.max(originalText.length, suggestedText.length);
  const changeShare = changeSize / Math.max(base.length, next.length);
  const isInline = changeSize > 0 && changeSize <= 140 && changeShare <= 0.35;

  if (isInline) {
    const summary = originalText && suggestedText
      ? `Update: ${originalText.slice(0, 40)}${originalText.length > 40 ? "..." : ""}`
      : originalText
        ? `Remove: ${originalText.slice(0, 40)}${originalText.length > 40 ? "..." : ""}`
        : `Add: ${suggestedText.slice(0, 40)}${suggestedText.length > 40 ? "..." : ""}`;
    return { summary, isInline: true, originalText: originalText || undefined, suggestedText: suggestedText || undefined };
  }

  return { summary: "Full-document revision submitted", isInline: false, originalText: base, suggestedText: next };
};

interface EditorScreenProps {
  noteId: string;
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
  { icon: "clipboard-outline", label: "Paste Img", style: "paste_image" },
];

export const EditorScreen: React.FC<EditorScreenProps> = ({ noteId, navigate, onBack }) => {
  const { user } = useAuth();
  const { setProposalToast } = useNoteData();
  const [note, setNote] = useState<{ id: string; currentVersionId: string | null; isLocked: boolean } | null>(null);
  const [baseContent, setBaseContent] = useState("");
  const [content, setContent] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [linkSheet, setLinkSheet] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [pasteSheet, setPasteSheet] = useState(false);
  const [pasteImageUrl, setPasteImageUrl] = useState("");
  const [toast, setToast] = useState("");
  const [uploadedImageIds, setUploadedImageIds] = useState<string[]>([]);

  useEffect(() => {
    apiFetch<any>(`/api/notes/${noteId}`).then((data) => {
      setNote(data);
      const plain = (data.currentVersion?.content || "").replace(/<[^>]+>/g, " ");
      setBaseContent(normalizeText(plain));
      setContent(plain);
    }).catch(() => setToast("Failed to load note"));
  }, [noteId]);

  const handlePreview = () => navigate("Preview", { noteId, content });

  const handleSubmitProposal = async () => {
    if (!note?.currentVersionId) { setToast("Unable to submit proposal."); return; }
    const draft = buildProposalDraft(baseContent, content);
    if (!draft) { setToast("Make a change before submitting."); return; }

    try {
      const endpoint = draft.isInline ? `/api/notes/${noteId}/proposals/inline` : `/api/notes/${noteId}/proposals`;
      const proposalData = await apiFetch<any>(endpoint, {
        method: "POST",
        body: JSON.stringify({
          baseVersionId: note.currentVersionId,
          proposedContent: content,
          summary: draft.summary,
          originalText: draft.originalText,
          suggestedText: draft.suggestedText,
        }),
      });

      // Link uploaded images to proposal
      for (const imgId of uploadedImageIds) {
        try {
          await apiFetch(`/api/images/${imgId}/link`, {
            method: "PATCH",
            body: JSON.stringify({ proposalId: proposalData.id }),
          });
        } catch (linkErr) {
          // Silently continue
        }
      }

      setProposalToast({ noteId, message: "Proposal submitted successfully." });
      onBack();
    } catch (e: any) {
      setToast(e.message || "Failed to submit proposal");
    }
  };

  const insertAtCursor = (inserted: string) => {
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    setContent(`${content.slice(0, start)}${inserted}${content.slice(end)}`);
    const pos = start + inserted.length;
    setSelection({ start: pos, end: pos });
  };

  const insertLink = () => {
    const url = linkUrl.trim();
    if (!url) { setToast("Paste a valid link first."); return; }
    insertAtCursor(`[${linkText.trim() || url}](${url})`);
    setLinkUrl(""); setLinkText(""); setLinkSheet(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setToast("Gallery access is required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const localUri = result.assets[0].uri;
      try {
        setToast("Uploading image...");
        const formData = new FormData();
        const uriParts = localUri.split('.');
        const fileType = uriParts[uriParts.length - 1] || 'jpg';
        
        if (Platform.OS === "web") {
          const response = await fetch(localUri);
          const blob = await response.blob();
          formData.append("file", blob, `photo.${fileType}`);
        } else {
          formData.append("file", {
            uri: localUri,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        }
        formData.append("noteId", noteId);
        
        const token = await getStoredToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const uploadRes = await fetch(`${API_URL}/api/images/upload`, {
          method: "POST",
          body: formData,
          headers,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload image");
        }

        setUploadedImageIds((prev) => [...prev, uploadData.id]);
        insertAtCursor(`![Image](${uploadData.publicUrl})`);
        setToast("Image uploaded and inserted!");
      } catch (e: any) {
        setToast(e.message || "Failed to upload image");
      }
    }
  };

  const handlePasteImage = async () => {
    const clipboardText = await Clipboard.getString();
    if (!clipboardText.trim()) { setToast("Nothing to paste. Copy an image URL first."); return; }
    const isImageUrl = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(clipboardText.trim());
    if (isImageUrl) { insertAtCursor(`![Pasted Image](${clipboardText.trim()})`); setToast("Image inserted ✓"); }
    else { setPasteImageUrl(clipboardText.trim()); setPasteSheet(true); }
  };

  const applyFormatting = (style: string) => {
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const selectedText = content.slice(start, end) || "text";
    const map: Record<string, string> = {
      bold: `**${selectedText}**`, italic: `*${selectedText}*`, underline: `__${selectedText}__`,
      h1: `\n# ${selectedText}\n`, h2: `\n## ${selectedText}\n`,
      bullet: `\n• ${selectedText}`, number: `\n1. ${selectedText}`,
    };
    if (style === "link") { setLinkText(selectedText.startsWith("http") ? selectedText : selectedText || "Link text"); setLinkUrl(selectedText.startsWith("http") ? selectedText : ""); setLinkSheet(true); return; }
    if (style === "image") { pickImage(); return; }
    if (style === "paste_image") { handlePasteImage(); return; }
    insertAtCursor(map[style] || selectedText);
  };

  return (
    <View style={styles.container}>
      <Header title="Edit Note" onBack={onBack} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbar}>
        {TOOLS.map((tool) => (
          <TouchableOpacity key={tool.label} onPress={() => applyFormatting(tool.style)} style={styles.toolBtn}>
            {tool.icon ? <Ionicons name={tool.icon as any} size={16} color={C.textPrimary} /> : <Text style={styles.toolText}>{tool.label}</Text>}
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
        <Btn full onPress={handlePreview} variant="secondary">Preview final note</Btn>
        <View style={{ height: 10 }} />
        <Btn full onPress={handleSubmitProposal} disabled={!content.trim() || normalizeText(content) === baseContent}>
          Propose changes
        </Btn>
      </View>

      <Sheet open={linkSheet} onClose={() => setLinkSheet(false)} title="Insert link" half>
        <Input value={linkText} onChangeText={setLinkText} placeholder="Link text" />
        <View style={{ height: 12 }} />
        <Input value={linkUrl} onChangeText={setLinkUrl} placeholder="https://example.com" />
        <View style={{ height: 14 }} />
        <Btn onPress={insertLink} full disabled={!linkUrl}>Insert link</Btn>
      </Sheet>

      <Sheet open={pasteSheet} onClose={() => { setPasteSheet(false); setPasteImageUrl(""); }} title="Paste Image URL" half>
        <Text style={styles.sheetDesc}>Paste the image URL below to insert it into your note.</Text>
        <View style={{ height: 12 }} />
        <Input value={pasteImageUrl} onChangeText={setPasteImageUrl} placeholder="https://example.com/image.jpg" />
        <View style={{ height: 14 }} />
        <Btn full disabled={!pasteImageUrl} onPress={() => {
          const url = pasteImageUrl.trim();
          if (url) { insertAtCursor(`![Pasted Image](${url})`); setPasteImageUrl(""); setPasteSheet(false); setToast("Image inserted ✓"); }
        }}>Insert Image</Btn>
      </Sheet>

      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  toolbar: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 12, paddingVertical: 8, flexGrow: 0 },
  toolBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: C.border, marginHorizontal: 3 },
  toolText: { fontSize: 12, color: C.textPrimary },
  editorContainer: { flex: 1, padding: 20 },
  editor: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 20, minHeight: 300 },
  textArea: { fontSize: 15, lineHeight: 26, color: C.textPrimary, textAlignVertical: "top", minHeight: 260 },
  hint: { fontSize: 12, color: C.textMuted, textAlign: "center", marginTop: 8 },
  previewRow: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  sheetDesc: { fontSize: 13, color: C.textMuted, marginBottom: 8 },
});
