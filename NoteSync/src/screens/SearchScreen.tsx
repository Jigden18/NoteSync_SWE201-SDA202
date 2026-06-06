import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { C } from "../constants/colors";
import { fmtDate } from "../utils/helpers";
import { apiFetch } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Ionicons } from "@expo/vector-icons";

interface SearchResult {
  id: string;
  title: string;
  lectureDate: string;
  versionNumber: number;
  snippet: string;
  moduleCode?: string;
}

interface Module {
  id: string;
  code: string;
}

interface SearchScreenProps {
  navigate: (screen: string, params?: any) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigate }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<Module[]>("/api/modules").then(setModules).catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || modules.length === 0) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const allResults = await Promise.all(
        modules.map((m) =>
          apiFetch<SearchResult[]>(`/api/search/${m.id}?q=${encodeURIComponent(q)}`)
            .then((rows) => rows.map((r) => ({ ...r, moduleCode: m.code })))
            .catch(() => [] as SearchResult[])
        )
      );
      setResults(allResults.flat());
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [modules]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(() => search(query), 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

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
          <EmptyState iconName="search-outline" title="Search across all your notes" sub="Find content in any lecture note" />
        ) : loading ? (
          <ListSkeleton count={2} />
        ) : results.length === 0 ? (
          <EmptyState iconName="search-outline" title={`No results for "${query}"`} sub="Try a different search term" />
        ) : (
          results.map((r, i) => (
            <TouchableOpacity key={i} onPress={() => navigate("note", { id: r.id })} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                {r.moduleCode && <Badge label={r.moduleCode} color="accent" small />}
                {r.lectureDate && <Text style={styles.resultDate}>{fmtDate(r.lectureDate)}</Text>}
              </View>
              <Text style={styles.resultTitle}>{r.title}</Text>
              <Text style={styles.resultSnippet} numberOfLines={2}>{r.snippet}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 20, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 16, color: C.textPrimary, padding: 0 },
  results: { flex: 1, padding: 12 },
  resultCard: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 12 },
  resultHeader: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 6 },
  resultDate: { fontSize: 12, color: C.textMuted },
  resultTitle: { fontWeight: "600", fontSize: 15, color: C.textPrimary, marginBottom: 6 },
  resultSnippet: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
});
