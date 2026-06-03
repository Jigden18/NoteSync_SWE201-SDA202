import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { C } from "../constants/colors";
import { delay, fmtDate } from "../utils/helpers";
import { useNoteData } from "../contexts/NoteDataContext";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Ionicons } from "@expo/vector-icons";

interface SearchResult {
  noteId?: string;
  noteTitle?: string;
  lectureDate?: string;
  snippet: string;
  versionNumber: number;
}

interface SearchScreenProps {
  navigate: (screen: string, params?: any) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigate }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { notes, versions } = useNoteData();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    
    // Clear existing timeout
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Set new timeout
    timerRef.current = setTimeout(async () => {
      await delay(300);
      const q = query.toLowerCase();
      const res: SearchResult[] = versions
        .filter((v) => v.content.toLowerCase().includes(q))
        .map((v) => {
          const note = notes.find((n) => n.currentVersionId === v.id);
          const plain = v.content.replace(/<[^>]+>/g, " ");
          const idx = plain.toLowerCase().indexOf(q);
          const snippet =
            "…" + plain.slice(Math.max(0, idx - 40), idx + 80) + "…";
          return {
            noteId: note?.id,
            noteTitle: note?.title,
            lectureDate: note?.lectureDate,
            snippet,
            versionNumber: v.versionNumber,
          };
        });
      setResults(res);
      setLoading(false);
      timerRef.current = null;
    }, 300);

    // Cleanup on unmount or when query changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={C.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search notes…"
          autoFocus
          style={styles.searchInput}
          placeholderTextColor={C.textMuted}
        />
        {query !== "" && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close" size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        {!query ? (
          <EmptyState
            iconName="search-outline"
            title="Search across all your notes"
            sub="Find content in any lecture note"
          />
        ) : loading ? (
          <ListSkeleton count={2} />
        ) : results.length === 0 ? (
          <EmptyState
            iconName="search-outline"
            title={`No results for "${query}"`}
            sub="Try a different search term"
          />
        ) : (
          results.map((r, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => r.noteId && navigate("note", { id: r.noteId })}
              style={styles.resultCard}
            >
              <View style={styles.resultHeader}>
                <Badge label="CS301" color="accent" small />
                {r.lectureDate && (
                  <Text style={styles.resultDate}>{fmtDate(r.lectureDate)}</Text>
                )}
              </View>
              <Text style={styles.resultTitle}>{r.noteTitle}</Text>
              <Text style={styles.resultSnippet} numberOfLines={2}>
                {r.snippet}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: C.textPrimary,
    padding: 0,
  },
  results: {
    flex: 1,
    padding: 12,
  },
  resultCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 6,
  },
  resultDate: {
    fontSize: 12,
    color: C.textMuted,
  },
  resultTitle: {
    fontWeight: "600",
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: 6,
  },
  resultSnippet: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 18,
  },
});