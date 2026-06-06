import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Modal as RNModal,
  Clipboard,
} from "react-native";
import { C } from "../constants/colors";
import { Header } from "../components/layout/Header";
import { Btn } from "../components/ui/Btn";
import { Toast } from "../components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";

interface PreviewScreenProps {
  noteId: string;
  content: string;
  onBack: () => void;
  onSubmit: () => void;
}

const parseMarkdown = (text: string, onImagePress: (url: string) => void) => {
  const elements: React.ReactNode[] = [];
  const lines = text.split("\n");
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(<Text key={key++} style={styles.h1} selectable>{line.slice(2)}</Text>);
    } else if (line.startsWith("## ")) {
      elements.push(<Text key={key++} style={styles.h2} selectable>{line.slice(3)}</Text>);
    } else if (line.trim().startsWith("• ")) {
      elements.push(
        <View key={key++} style={styles.listItem}>
          <Text style={styles.listBullet} selectable>•</Text>
          <Text style={styles.listText} selectable>{line.slice(2).trim()}</Text>
        </View>
      );
    } else if (/^\d+\.\s/.test(line.trim())) {
      const match = line.match(/^(\d+)\.\s(.+)$/);
      if (match) {
        elements.push(
          <View key={key++} style={styles.listItem}>
            <Text style={styles.listNumber} selectable>{match[1]}.</Text>
            <Text style={styles.listText} selectable>{match[2]}</Text>
          </View>
        );
      }
    } else if (line.includes("![") && line.includes("](")) {
      const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
      if (imgMatch) {
        imgMatch.forEach((img) => {
          const urlMatch = img.match(/\]\(([^)]+)\)/);
          if (urlMatch?.[1]) {
            const imageUrl = urlMatch[1];
            elements.push(
              <TouchableOpacity key={key++} onPress={() => onImagePress(imageUrl)} activeOpacity={0.9} style={styles.imageContainer}>
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
              </TouchableOpacity>
            );
          }
        });
      }
    } else if (line.trim()) {
      elements.push(<Text key={key++} style={styles.paragraph} selectable>{parseInlineElements(line)}</Text>);
    }
  }

  return elements;
};

const parseInlineElements = (text: string) => {
  const result: React.ReactNode[] = [];
  let key = 0;
  let current = 0;

  const boldRegex = /\*\*(.+?)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = boldRegex.exec(text)) !== null) {
    if (m.index > current) result.push(text.slice(current, m.index));
    result.push(<Text key={`b-${key++}`} style={styles.bold} selectable>{m[1]}</Text>);
    current = boldRegex.lastIndex;
  }

  const italicRegex = /\*(.+?)\*/g;
  while ((m = italicRegex.exec(text)) !== null) {
    if (m.index >= current) {
      result.push(<Text key={`i-${key++}`} style={styles.italic} selectable>{m[1]}</Text>);
      current = italicRegex.lastIndex;
    }
  }

  const underlineRegex = /__(.+?)__/g;
  while ((m = underlineRegex.exec(text)) !== null) {
    if (m.index >= current) {
      result.push(<Text key={`u-${key++}`} style={styles.underline} selectable>{m[1]}</Text>);
      current = underlineRegex.lastIndex;
    }
  }

  const linkRegex = /\[(.+?)\]\((.+?)\)/g;
  while ((m = linkRegex.exec(text)) !== null) {
    if (m.index >= current) {
      const url = m[2];
      result.push(<Text key={`l-${key++}`} style={styles.link} onPress={() => Linking.openURL(url)} selectable>{m[1]}</Text>);
      current = linkRegex.lastIndex;
    }
  }

  if (current < text.length) result.push(text.slice(current));
  return result.length ? result : text;
};

export const PreviewScreen: React.FC<PreviewScreenProps> = ({ noteId, content, onBack, onSubmit }) => {
  const [toast, setToast] = useState("");
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTap, setLastTap] = useState(0);

  const parsedContent = useMemo(() => parseMarkdown(content, (url) => { setScale(1); setActiveImageUrl(url); }), [content]);

  const handleTouchStart = (event: any) => {
    const touches = event.nativeEvent.touches;
    if (touches.length === 2) {
      const dx = touches[1].pageX - touches[0].pageX;
      const dy = touches[1].pageY - touches[0].pageY;
      setLastTouchDistance(Math.sqrt(dx * dx + dy * dy));
    }
  };

  const handleTouchMove = (event: any) => {
    const touches = event.nativeEvent.touches;
    if (touches.length === 2 && lastTouchDistance !== null) {
      const dx = touches[1].pageX - touches[0].pageX;
      const dy = touches[1].pageY - touches[0].pageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        setScale((prev) => Math.max(1, Math.min(prev * (dist / lastTouchDistance), 5)));
        setLastTouchDistance(dist);
      }
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) setScale((prev) => (prev > 1 ? 1 : 2.5));
    setLastTap(now);
  };

  const handleCopyImageLink = () => {
    if (activeImageUrl) {
      Clipboard.setString(activeImageUrl);
      setToast("Image copied ✓");
      setTimeout(() => setActiveImageUrl(null), 800);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Preview" onBack={onBack} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewBox}>{parsedContent}</View>
      </ScrollView>

      <View style={styles.footer}>
        <Btn full onPress={onSubmit} disabled={!content.trim()}>
          Back to editor
        </Btn>
      </View>

      {toast ? <Toast msg={toast} onClose={() => setToast("")} /> : null}

      <RNModal visible={!!activeImageUrl} transparent onRequestClose={() => setActiveImageUrl(null)} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={() => setLastTouchDistance(null)}>
            {activeImageUrl && (
              <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap} style={styles.zoomImageContainer}>
                <Image source={{ uri: activeImageUrl }} style={[styles.fullImage, { transform: [{ scale }] }]} resizeMode="contain" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveImageUrl(null)}>
              <Ionicons name="close-circle" size={40} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyImageLink}>
              <Ionicons name="copy" size={20} color="#fff" />
              <Text style={styles.btnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, padding: 16 },
  previewBox: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 20 },
  h1: { fontSize: 28, fontWeight: "700", color: C.textPrimary, marginVertical: 12, marginTop: 20 },
  h2: { fontSize: 22, fontWeight: "600", color: C.textPrimary, marginVertical: 10, marginTop: 16 },
  paragraph: { fontSize: 15, lineHeight: 24, color: C.textPrimary, marginBottom: 10 },
  bold: { fontWeight: "700", color: C.textPrimary },
  italic: { fontStyle: "italic", color: C.textPrimary },
  underline: { textDecorationLine: "underline", color: C.textPrimary },
  link: { color: C.accent, textDecorationLine: "underline" },
  listItem: { flexDirection: "row", marginBottom: 8, alignItems: "flex-start", paddingLeft: 8 },
  listBullet: { fontSize: 15, color: C.textPrimary, marginRight: 8, fontWeight: "600" },
  listNumber: { fontSize: 15, color: C.textPrimary, marginRight: 8, fontWeight: "600", minWidth: 20 },
  listText: { fontSize: 15, lineHeight: 24, color: C.textPrimary, flex: 1 },
  imageContainer: { width: "100%", marginVertical: 12, borderRadius: 10, overflow: "hidden" },
  image: { width: "100%", height: 200 },
  footer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  modalContent: { flex: 1, position: "relative", justifyContent: "center", alignItems: "center" },
  zoomImageContainer: { width: "85%", height: "80%", justifyContent: "center", alignItems: "center" },
  fullImage: { width: "100%", height: "100%" },
  closeBtn: { position: "absolute", top: 40, right: 20, zIndex: 10 },
  copyBtn: { position: "absolute", bottom: 40, alignSelf: "center", backgroundColor: "rgba(76,175,80,0.85)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 8, zIndex: 10 },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
