import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";
import { C } from "../constants/colors";
import { delay, User } from "../utils/helpers";
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
const parseMarkdown = (text: string) => {
  const elements: React.ReactNode[] = [];
  const lines = text.split("\n");
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <Text key={key++} style={styles.h1}>
          {line.slice(2)}
        </Text>
      );
    }
    // H2
    else if (line.startsWith("## ")) {
      elements.push(
        <Text key={key++} style={styles.h2}>
          {line.slice(3)}
        </Text>
      );
    }
    // List item (bullet)
    else if (line.trim().startsWith("• ")) {
      elements.push(
        <View key={key++} style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.listText}>{line.slice(2).trim()}</Text>
        </View>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line.trim())) {
      const match = line.match(/^(\d+)\.\s(.+)$/);
      if (match) {
        elements.push(
          <View key={key++} style={styles.listItem}>
            <Text style={styles.listNumber}>{match[1]}.</Text>
            <Text style={styles.listText}>{match[2]}</Text>
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
          const alt = img.match(/!\[([^\]]*)\]/)?.[1] || "Image";
          if (urlMatch?.[1]) {
            elements.push(
              <Image
                key={key++}
                source={{ uri: urlMatch[1] }}
                style={styles.image}
              />
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
        <Text key={key++} style={styles.paragraph}>
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
      <Text key={`bold-${key++}`} style={styles.bold}>
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
        <Text key={`italic-${key++}`} style={styles.italic}>
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
        <Text key={`underline-${key++}`} style={styles.underline}>
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
      result.push(
        <Text
          key={`link-${key++}`}
          style={styles.link}
          onPress={() => Linking.openURL(linkMatch![2])}
        >
          {linkMatch[1]}
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
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState("");

  const parsedContent = useMemo(() => parseMarkdown(content), [content]);

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
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginVertical: 12,
    backgroundColor: C.border,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
});
