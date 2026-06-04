import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { C } from "../constants/colors";
import { delay, fmtDate, User } from "../utils/helpers";
import { MOCK_MODULES, Note } from "../data/mockData";
import { useNoteData } from "../contexts/NoteDataContext";
import { Header } from "../components/layout/Header";
import { Btn } from "../components/ui/Btn";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Ionicons } from "@expo/vector-icons";

interface LectureCardProps {
  note: Note;
  onClick: () => void;
}

const LectureCard: React.FC<LectureCardProps> = ({ note, onClick }) => (
  <TouchableOpacity onPress={onClick} style={styles.lectureCard}>
    <View style={styles.lectureHeader}>
      <Text style={styles.lectureDate}>{fmtDate(note.lectureDate)}</Text>
      <View style={styles.badgeContainer}>
        <Badge label={`v${note.currentVersionNumber}`} color="gray" small />
        {note.isLocked && (
          <Ionicons name="lock-closed" size={14} color={C.textMuted} />
        )}
        {note.pendingProposalCount > 0 && (
          <Badge
            label={`${note.pendingProposalCount} pending`}
            color="warning"
            small
          />
        )}
      </View>
    </View>
    <View style={styles.lectureFooter}>
      <Text style={styles.lectureTitle} numberOfLines={1}>
        {note.title}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
    </View>
  </TouchableOpacity>
);

interface ModuleDetailScreenProps {
  id: string;
  user: User;
  navigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

export const ModuleDetailScreen: React.FC<ModuleDetailScreenProps> = ({
  id,
  user,
  navigate,
  onBack,
}) => {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const mod = MOCK_MODULES.find((m) => m.id === id);
  const { getNotesByModule } = useNoteData();

  useEffect(() => {
    delay(400).then(() => setNotes(getNotesByModule(id)));
  }, [id, getNotesByModule]);

  return (
    <View style={styles.container}>
      <Header
        title={mod?.name || "Module"}
        sub={mod?.code}
        onBack={onBack}
        right={
          true && (
            <Btn
              size="sm"
              onPress={() => navigate("createNote", { moduleId: id })}
            >
              {user.role === "lecturer" ? "+ Note" : "Submit Note"}
            </Btn>
          )
        }
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noteList}>
          {!notes ? (
            <ListSkeleton />
          ) : notes.length === 0 ? (
            <EmptyState
              iconName="document-text-outline"
              title="No lecture notes yet"
              sub="Create the first note for this module"
            />
          ) : (
            notes.map((n) => (
              <LectureCard
                key={n.id}
                note={n}
                onClick={() => navigate("note", { id: n.id })}
              />
            ))
          )}
        </View>
      </ScrollView>
      {true && (
        <TouchableOpacity
          onPress={() => navigate("createNote", { moduleId: id })}
          style={styles.fab}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
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
    paddingBottom: 80,
  },
  noteList: {
    padding: 16,
    gap: 12,
  },
  lectureCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  lectureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  lectureDate: {
    fontSize: 12,
    color: C.textSecondary,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  lectureFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lectureTitle: {
    flex: 1,
    fontWeight: "600",
    fontSize: 15,
    color: C.textPrimary,
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 5,
  },
});
