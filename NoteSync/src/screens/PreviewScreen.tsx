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
import { delay } from "../utils/helpers";
import { useNoteData } from "../contexts/NoteDataContext";
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

// Simple markdown parser for preview
const parseMarkdown = (text: string, onImagePress: (url: string) => void) => {
  const elements: React.ReactNode[] = [];
  const lines = text.split("\n");
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <Text key={key++} style={styles.h1} selectable={true}>
          {line.slice(2)}
        </Text>
      );
    }
    // H2
    else if (line.startsWith("## ")) {
      elements.push(
        <Text key={key++} style={styles.h2} selectable={true}>
          {line.slice(3)}
        </Text>
      );
    }
    // List item (bullet)
    else if (line.trim().startsWith("• ")) {
      elements.push(
        <View key={key++} style={styles.listItem}>
          <Text style={styles.listBullet} selectable={true}>•</Text>
          <Text style={styles.listText} selectable={true}>{line.slice(2).trim()}</Text>
        </View>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line.trim())) {
      const match = line.match(/^(\d+)\.\s(.+)$/);
      if (match) {
        elements.push(
          <View key={key++} style={styles.listItem}>
            <Text style={styles.listNumber} selectable={true}>{match[1]}.</Text>
            <Text style={styles.listText} selectable={true}>{match[2]}</Text>
          </View>
        );
      }
    }
    // Image
    else if (line.includes("![") && line.includes("](")) {
      const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
      if (imgMatch) {
        imgMatch.forEach((img) => {
          const urlMatch = img.match(/\]\(([^)]+)\)/);
          if (urlMatch?.[1]) {
            const imageUrl = urlMatch[1];
            elements.push(
              <TouchableOpacity
                key={key++}
                onPress={() => onImagePress(imageUrl)}
                activeOpacity={0.9}
                style={styles.imageContainer}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            );
          }
        });
      }
    }
    // Link or mixed inline
    else if (line.trim()) {
      // Parse inline elements
      const parts = parseInlineElements(line);
      elements.push(
        <Text key={key++} style={styles.paragraph} selectable={true}>
          {parts}
        </Text>
      );
    }
  }

  return elements;
};

const parseInlineElements = (text: string) => {
  const result: React.ReactNode[] = [];
  let key = 0;
  let current = 0;

  // Bold
  const boldRegex = /\*\*(.+?)\*\*/g;
  let boldMatch;
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    if (boldMatch.index > current) {
      result.push(text.slice(current, boldMatch.index));
    }
    result.push(
      <Text key={`bold-${key++}`} style={styles.bold} selectable={true}>
        {boldMatch[1]}
      </Text>
    );
    current = boldRegex.lastIndex;
  }

  // Italic
  const italicRegex = /\*(.+?)\*/g;
  let italicMatch;
  while ((italicMatch = italicRegex.exec(text)) !== null) {
    if (italicMatch.index >= current) {
      result.push(
        <Text key={`italic-${key++}`} style={styles.italic} selectable={true}>
          {italicMatch[1]}
        </Text>
      );
      current = italicRegex.lastIndex;
    }
  }

  // Underline
  const underlineRegex = /__(.+?)__/g;
  let underlineMatch;
  while ((underlineMatch = underlineRegex.exec(text)) !== null) {
    if (underlineMatch.index >= current) {
      result.push(
        <Text key={`underline-${key++}`} style={styles.underline} selectable={true}>
          {underlineMatch[1]}
        </Text>
      );
      current = underlineRegex.lastIndex;
    }
  }

  // Link
  const linkRegex = /\[(.+?)\]\((.+?)\)/g;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    if (linkMatch.index >= current) {
      const url = linkMatch[2];
      const linkText = linkMatch[1];
      result.push(
        <Text
          key={`link-${key++}`}
          style={styles.link}
          onPress={() => Linking.openURL(url)}
          selectable={true}
        >
          {linkText}
        </Text>
      );
      current = linkRegex.lastIndex;
    }
  }

  // Remaining text
  if (current < text.length) {
    result.push(text.slice(current));
  }

  return result.length ? result : text;
};

export const PreviewScreen: React.FC<PreviewScreenProps> = ({
  noteId,
  content,
  onBack,
  onSubmit,
}) => {
  const { createVersion } = useNoteData();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const [scale, setScale] = useState(1);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTap, setLastTap] = useState(0);

  const parsedContent = useMemo(() => {
    return parseMarkdown(content, (url) => {
      setScale(1);
      setActiveImageUrl(url);
    });
  }, [content]);

  const handleTouchStart = (event: any) => {
    const touches = event.nativeEvent.touches;
    if (touches.length === 2) {
      const x1 = touches[0].pageX;
      const y1 = touches[0].pageY;
      const x2 = touches[1].pageX;
      const y2 = touches[1].pageY;
      const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (event: any) => {
    const touches = event.nativeEvent.touches;
    if (touches.length === 2 && lastTouchDistance !== null) {
      const x1 = touches[0].pageX;
      const y1 = touches[0].pageY;
      const x2 = touches[1].pageX;
      const y2 = touches[1].pageY;
      const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      
      if (distance > 0) {
        const factor = distance / lastTouchDistance;
        setScale((prevScale) => Math.max(1, Math.min(prevScale * factor, 5)));
        setLastTouchDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    setLastTouchDistance(null);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      setScale((prevScale) => (prevScale > 1 ? 1 : 2.5));
    }
    setLastTap(now);
  };

  const handleCopyImageLink = () => {
    if (activeImageUrl) {
      Clipboard.setString(activeImageUrl);
      setToast("Image copied ✓");
      setTimeout(() => {
        setActiveImageUrl(null);
      }, 800);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    await delay(600);
    createVersion(noteId, content, "Current User");
    setLoading(false);
    setToast("Changes saved ✓");
    setTimeout(() => {
      setToast("");
      onSubmit();
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Header title="Preview" onBack={onBack} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewBox}>{parsedContent}</View>
      </ScrollView>

      <View style={styles.footer}>
        <Btn
          full
          onPress={handleSubmit}
          disabled={loading || !content.trim()}
        >
          {loading ? "Saving…" : "Save & submit"}
        </Btn>
      </View>

      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      {/* Image Popup Modal */}
      <RNModal
        visible={!!activeImageUrl}
        transparent={true}
        onRequestClose={() => setActiveImageUrl(null)}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View 
            style={styles.modalContent}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {activeImageUrl && (
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleDoubleTap}
                style={styles.zoomImageContainer}
              >
                <Image
                  source={{ uri: activeImageUrl }}
                  style={[styles.fullImage, { transform: [{ scale }] }]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setActiveImageUrl(null)}
            >
              <Ionicons name="close-circle" size={40} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleCopyImageLink}
            >
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
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  previewBox: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
  },
  h1: {
    fontSize: 28,
    fontWeight: "700",
    color: C.textPrimary,
    marginVertical: 12,
    marginTop: 20,
  },
  h2: {
    fontSize: 22,
    fontWeight: "600",
    color: C.textPrimary,
    marginVertical: 10,
    marginTop: 16,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: C.textPrimary,
    marginBottom: 10,
  },
  bold: {
    fontWeight: "700",
    color: C.textPrimary,
  },
  italic: {
    fontStyle: "italic",
    color: C.textPrimary,
  },
  underline: {
    textDecorationLine: "underline",
    color: C.textPrimary,
  },
  link: {
    color: C.accent,
    textDecorationLine: "underline",
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
    paddingLeft: 8,
  },
  listBullet: {
    fontSize: 15,
    color: C.textPrimary,
    marginRight: 8,
    fontWeight: "600",
  },
  listNumber: {
    fontSize: 15,
    color: C.textPrimary,
    marginRight: 8,
    fontWeight: "600",
    minWidth: 20,
  },
  listText: {
    fontSize: 15,
    lineHeight: 24,
    color: C.textPrimary,
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  modalContent: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomImageContainer: {
    width: "85%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  copyBtn: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(76, 175, 80, 0.85)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
