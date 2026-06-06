import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { C } from "../constants/colors";
import { fmtDate, timeAgo } from "../utils/helpers";
import { useAuth } from "../contexts/AuthContext";
import { useNoteData } from "../contexts/NoteDataContext";
import { apiFetch } from "../api/client";
import { Header } from "../components/layout/Header";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Sheet } from "../components/ui/Sheet";
import { Modal } from "../components/ui/Modal";
import { Toast } from "../components/ui/Toast";
import { EmptyState } from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Ionicons } from "@expo/vector-icons";

// ── Types ────────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  moduleId: string;
  title: string;
  lectureDate: string;
  currentVersionId: string | null;
  currentVersionNumber: number;
  isLocked: boolean;
  pendingProposalCount: number;
  currentVersion?: { id: string; content: string; versionNumber: number; isPinned: boolean };
}

interface Proposal {
  id: string;
  noteId: string;
  proposedBy: string;
  proposer?: { id: string; fullName: string };
  summary: string;
  upvoteCount: number;
  status: "pending" | "approved" | "rejected";
  isInline: boolean;
  originalText?: string;
  suggestedText?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface Comment {
  id: string;
  noteId: string;
  authorId: string;
  author: { id: string; fullName: string };
  authorRole?: string;
  parentCommentId?: string | null;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

interface Annotation {
  id: string;
  noteId: string;
  targetLine: number;
  annotationText: string;
  createdAt: string;
  lecturer?: { id: string; fullName: string };
}

// ── Notes Tab ────────────────────────────────────────────────────────────────

const NotesTab: React.FC<{
  note: Note;
  annotations: Annotation[];
  navigate: (screen: string, params?: any) => void;
}> = ({ note, annotations, navigate }) => {
  const { user } = useAuth();
  const [showAnnotation, setShowAnnotation] = useState<Annotation | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [suggestSheet, setSuggestSheet] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [changeDesc, setChangeDesc] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSubmitSuggest = async () => {
    if (!note.currentVersionId) return;
    try {
      await apiFetch(`/api/notes/${note.id}/proposals/inline`, {
        method: "POST",
        body: JSON.stringify({
          baseVersionId: note.currentVersionId,
          proposedContent: suggestion,
          summary: changeDesc,
          originalText: selectedText,
          suggestedText: suggestion,
        }),
      });
      setSuggestSheet(false);
      setSuggestion("");
      setChangeDesc("");
      setSelectedText("");
      showToast("Suggestion submitted!");
    } catch (e: any) {
      showToast(e.message || "Failed to submit suggestion");
    }
  };

  const plainContent = note.currentVersion?.content.replace(/<[^>]+>/g, " ") || "";

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.badgeBar}>
        <Badge label={fmtDate(note.lectureDate)} color="gray" />
        <Badge label={`v${note.currentVersionNumber}`} color="accent" />
        {note.currentVersion?.isPinned && <Badge label="Pinned" color="accent" />}
        {note.isLocked && <Badge label="Locked" color="gray" />}
        {note.pendingProposalCount > 0 && (
          <Badge label={`${note.pendingProposalCount} pending proposals`} color="warning" />
        )}
        <TouchableOpacity onPress={() => navigate("versions", { noteId: note.id })} style={styles.versionLink}>
          <Text style={styles.versionLinkText}>Version history ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {annotations.length > 0 && (
          <TouchableOpacity onPress={() => setShowAnnotation(annotations[0])} style={styles.annotationBanner}>
            <View style={styles.annotationBannerHeader}>
              <Ionicons name="pin" size={14} color={C.warning} />
              <Text style={styles.annotationBannerTitle}>{annotations.length} Lecturer Annotations</Text>
            </View>
            <Text style={styles.annotationBannerText} numberOfLines={2}>
              {annotations[0].annotationText.slice(0, 80)}…
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.noteContent}>
          <RNTextInput
            value={plainContent}
            multiline
            editable={false}
            selectTextOnFocus
            textAlignVertical="top"
            style={[styles.noteHtml, styles.noteReadOnlyInput]}
            onSelectionChange={(e) => {
              const { start, end } = e.nativeEvent.selection;
              setSelectedText(end > start ? plainContent.slice(start, end) : "");
            }}
          />
        </View>

        {selectedText ? (
          <View style={styles.suggestionBar}>
            <Text style={styles.suggestionLabel}>Selected text:</Text>
            <Text style={styles.suggestionPreview} numberOfLines={2}>"{selectedText}"</Text>
            {!note.isLocked && user?.role === "student" && (
              <Btn full onPress={() => setSuggestSheet(true)}>Suggest edit for selected text</Btn>
            )}
          </View>
        ) : (
          <View style={styles.selectHintRow}>
            <Ionicons name="bulb-outline" size={16} color={C.textMuted} />
            <Text style={styles.selectHint}>Tap and drag text above to suggest an edit</Text>
          </View>
        )}
      </View>

      {annotations.length > 0 && (
        <View style={styles.annotationsSection}>
          <Text style={styles.annotationsTitle}>ANNOTATIONS</Text>
          {annotations.map((a) => (
            <View key={a.id} style={styles.annotationItem}>
              <Text style={styles.annotationText}>{a.annotationText}</Text>
              <Text style={styles.annotationDate}>{fmtDate(a.createdAt)}</Text>
            </View>
          ))}
        </View>
      )}

      {!note.isLocked && (
        <View style={styles.actionButtons}>
          {user?.role === "student" ? (
            <Btn full onPress={() => navigate("editor", { noteId: note.id })}>Propose Edit</Btn>
          ) : (
            <Btn full variant="secondary" onPress={() => navigate("annotations", { noteId: note.id })}>
              Add Annotation
            </Btn>
          )}
        </View>
      )}

      <Sheet open={suggestSheet} onClose={() => setSuggestSheet(false)} title="Suggest an Edit">
        <Text style={styles.sheetLabel}>ORIGINAL</Text>
        <View style={styles.originalTextContainer}>
          <Text style={styles.originalText}>"{selectedText}"</Text>
        </View>
        <Text style={styles.sheetLabel}>YOUR SUGGESTION</Text>
        <Input value={suggestion} onChangeText={setSuggestion} multiline rows={3} />
        <View style={{ height: 10 }} />
        <Text style={styles.sheetLabel}>WHAT CHANGED?</Text>
        <Input value={changeDesc} onChangeText={setChangeDesc} placeholder="Brief description of your change" />
        <View style={{ height: 14 }} />
        <Btn onPress={handleSubmitSuggest} full disabled={!suggestion || !changeDesc}>Submit Suggestion</Btn>
      </Sheet>

      <Modal open={!!showAnnotation} onClose={() => setShowAnnotation(null)} title="Lecturer Annotation">
        {showAnnotation && (
          <>
            <Text style={styles.modalAnnotationText}>{showAnnotation.annotationText}</Text>
            <Text style={styles.modalAnnotationDate}>{fmtDate(showAnnotation.createdAt)}</Text>
          </>
        )}
      </Modal>

      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
    </ScrollView>
  );
};

// ── Proposals Tab ─────────────────────────────────────────────────────────────

const ProposalsTab: React.FC<{ note: Note }> = ({ note }) => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [rejectSheet, setRejectSheet] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const loadProposals = useCallback(async () => {
    try {
      const data = await apiFetch<Proposal[]>(`/api/notes/${note.id}/proposals`);
      setProposals([...data].sort((a, b) => {
        if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }));
    } catch { setProposals([]); }
  }, [note.id]);

  useFocusEffect(useCallback(() => { loadProposals(); }, [loadProposals]));

  const handleUpvote = async (id: string, hasUpvoted: boolean) => {
    try {
      if (hasUpvoted) {
        await apiFetch(`/api/proposals/${id}/upvote`, { method: "DELETE" });
      } else {
        await apiFetch(`/api/proposals/${id}/upvote`, { method: "POST" });
      }
      setProposals((ps) => ps?.map((p) =>
        p.id === id ? { ...p, hasUpvoted: !hasUpvoted, upvoteCount: hasUpvoted ? p.upvoteCount - 1 : p.upvoteCount + 1 } : p
      ) ?? null);
    } catch (e: any) { showToast(e.message); }
  };

  const handleApprove = (id: string) => {
    Alert.alert("Approve proposal?", "Apply this proposal as a new version.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve", onPress: async () => {
          try {
            await apiFetch(`/api/proposals/${id}/approve`, { method: "PATCH" });
            setProposals((ps) => ps?.map((p) => p.id === id ? { ...p, status: "approved" } : p) ?? null);
            showToast("Proposal approved ✓");
          } catch (e: any) { showToast(e.message); }
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!rejectSheet) return;
    try {
      await apiFetch(`/api/proposals/${rejectSheet}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectionReason: reason }),
      });
      setProposals((ps) => ps?.map((p) =>
        p.id === rejectSheet ? { ...p, status: "rejected", rejectionReason: reason } : p
      ) ?? null);
      setRejectSheet(null);
      setReason("");
      showToast("Proposal rejected.");
    } catch (e: any) { showToast(e.message); }
  };

  const FILTERS: Array<"all" | "pending" | "approved" | "rejected"> = ["all", "pending", "approved", "rejected"];
  const filtered = proposals?.filter((p) => filter === "all" || p.status === filter);
  const statusColor = (s: string) => s === "approved" ? "success" : s === "rejected" ? "danger" : "gray";

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.filterContainer}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterChip, filter === f && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.proposalsList}>
        {!proposals ? <ListSkeleton /> : !filtered?.length ? (
          <EmptyState iconName="clipboard-outline" title={`No ${filter} proposals`} />
        ) : (
          filtered.map((p) => {
            const authorName = p.proposer?.fullName || p.proposedBy;
            const hasUpvoted = false;
            return (
              <View key={p.id} style={styles.proposalCard}>
                <View style={styles.proposalHeaderRow}>
                  <Avatar name={authorName} size={36} />
                  <View style={styles.proposalAuthorBlock}>
                    <View style={styles.proposalAuthorTop}>
                      {p.isInline && <Ionicons name="location-outline" size={14} color={C.textMuted} style={styles.inlineIndicator} />}
                      <Text style={styles.proposalAuthor}>{authorName}</Text>
                      <Text style={styles.proposalTime}>{timeAgo(p.createdAt)}</Text>
                    </View>
                  </View>
                  <View style={styles.proposalActions}>
                    <TouchableOpacity onPress={() => handleUpvote(p.id, hasUpvoted)} style={styles.upvoteBtn}>
                      <Ionicons name={hasUpvoted ? "heart" : "heart-outline"} size={16} color={hasUpvoted ? C.accent : C.textMuted} />
                      <Text style={styles.upvoteCount}>{p.upvoteCount}</Text>
                    </TouchableOpacity>
                    <Badge label={p.status} color={statusColor(p.status)} small />
                  </View>
                </View>

                <Text style={styles.proposalSummary}>"{p.summary}"</Text>

                {p.isInline && p.originalText && (
                  <View style={styles.inlineDiff}>
                    <Text style={styles.originalTextInline}>{p.originalText}</Text>
                    <Ionicons name="arrow-forward" size={14} color={C.textMuted} />
                    <Text style={styles.suggestedTextInline}>{p.suggestedText}</Text>
                  </View>
                )}

                {!p.isInline && (
                  <TouchableOpacity onPress={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))} style={styles.viewDiffBtn}>
                    <View style={styles.viewDiffContent}>
                      <Ionicons name={expanded[p.id] ? "chevron-up" : "chevron-down"} size={14} color={C.textMuted} />
                      <Text style={styles.viewDiffText}>{expanded[p.id] ? "Hide diff" : "View diff"}</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {p.rejectionReason && (
                  <View style={styles.rejectionContainer}>
                    <Text style={styles.rejectionText}>Rejection reason: {p.rejectionReason}</Text>
                  </View>
                )}

                {user?.role === "lecturer" && p.status === "pending" && (
                  <View style={styles.reviewButtons}>
                    <Btn size="sm" variant="secondary" style={styles.approveBtn} onPress={() => handleApprove(p.id)}>✓ Approve</Btn>
                    <Btn size="sm" variant="danger" onPress={() => setRejectSheet(p.id)}>✗ Reject</Btn>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <Sheet open={!!rejectSheet} onClose={() => setRejectSheet(null)} title="Reject Proposal" half>
        <Input value={reason} onChangeText={setReason} placeholder="Reason for rejection (optional)" />
        <View style={{ height: 14 }} />
        <Btn full variant="danger" onPress={handleReject}>Reject Proposal</Btn>
      </Sheet>

      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
    </ScrollView>
  );
};

// ── Comments Tab ──────────────────────────────────────────────────────────────

const CommentsTab: React.FC<{ note: Note }> = ({ note }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Comment[]>(`/api/notes/${note.id}/comments`)
      .then((data) => {
        const top = data.filter((c) => !c.parentCommentId);
        const withReplies = top.map((c) => ({
          ...c,
          replies: data.filter((r) => r.parentCommentId === c.id),
        }));
        setComments(withReplies);
      })
      .catch(() => setComments([]));
  }, [note.id]);

  const handlePost = async () => {
    if (!input.trim()) return;
    try {
      const newC = await apiFetch<Comment>(`/api/notes/${note.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: input.trim(), parentCommentId: replyTo }),
      });
      if (replyTo) {
        setComments((cs) => cs?.map((c) =>
          c.id === replyTo ? { ...c, replies: [...(c.replies || []), newC] } : c
        ) ?? null);
      } else {
        setComments((cs) => [...(cs || []), { ...newC, replies: [] }]);
      }
      setInput("");
      setReplyTo(null);
    } catch { /* silent */ }
  };

  const CommentItem: React.FC<{ c: Comment; isReply?: boolean }> = ({ c, isReply }) => (
    <View style={[styles.commentItem, isReply && styles.replyComment]}>
      <Avatar name={c.author?.fullName || "?"} size={isReply ? 28 : 34} />
      <View style={[styles.commentBubble, c.author?.id === note.moduleId && styles.lecturerComment]}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{c.author?.fullName || "Unknown"}</Text>
          <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
        </View>
        <Text style={styles.commentContent}>{c.content}</Text>
        {!isReply && (
          <TouchableOpacity onPress={() => setReplyTo(c.id)} style={styles.replyBtn}>
            <Text style={styles.replyBtnText}>Reply</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.commentsContainer}>
      <ScrollView style={styles.commentsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.commentsList}>
          {!comments ? <ListSkeleton count={2} /> : comments.length === 0 ? (
            <EmptyState iconName="chatbubbles-outline" title="No comments yet" sub="Start the discussion" />
          ) : (
            comments.map((c) => (
              <View key={c.id}>
                <CommentItem c={c} />
                {c.replies?.map((r) => <CommentItem key={r.id} c={r} isReply />)}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {replyTo && (
        <View style={styles.replyingTo}>
          <Text style={styles.replyingToText}>Replying to comment…</Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Ionicons name="close" size={16} color={C.accent} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.commentInputBar}>
        <Avatar name={user?.fullName || "?"} size={32} />
        <RNTextInput
          value={input}
          onChangeText={setInput}
          placeholder="Write a comment…"
          onSubmitEditing={handlePost}
          style={styles.commentInput}
          placeholderTextColor={C.textMuted}
        />
        <TouchableOpacity onPress={handlePost} style={styles.sendBtn}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Main NoteDetailScreen ─────────────────────────────────────────────────────

interface NoteDetailScreenProps {
  id: string;
  navigate: (screen: string, params?: any) => void;
  onBack: () => void;
  initialTab?: "notes" | "proposals" | "comments";
}

export const NoteDetailScreen: React.FC<NoteDetailScreenProps> = ({
  id,
  navigate,
  onBack,
  initialTab = "notes",
}) => {
  const [tab, setTab] = useState<"notes" | "proposals" | "comments">(initialTab);
  const [note, setNote] = useState<Note | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [toast, setToast] = useState("");
  const { proposalToast, setProposalToast } = useNoteData();

  useEffect(() => { setTab(initialTab); }, [initialTab]);

  useEffect(() => {
    if (proposalToast?.noteId === id) {
      setToast(proposalToast.message);
      setProposalToast(null);
    }
  }, [proposalToast, id, setProposalToast]);

  const load = useCallback(async () => {
    try {
      const [noteData, annotationData] = await Promise.all([
        apiFetch<Note>(`/api/notes/${id}`),
        apiFetch<Annotation[]>(`/api/notes/${id}/annotations`),
      ]);
      setNote(noteData);
      setAnnotations(annotationData);
    } catch { /* keep existing state */ }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!note) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  const PILL_TABS: Array<{ id: "notes" | "proposals" | "comments"; label: string }> = [
    { id: "notes", label: "Notes" },
    { id: "proposals", label: `Proposals${note.pendingProposalCount > 0 ? ` (${note.pendingProposalCount})` : ""}` },
    { id: "comments", label: "Comments" },
  ];

  return (
    <View style={styles.container}>
      <Header
        title={note.title}
        onBack={onBack}
        right={
          <TouchableOpacity onPress={() => navigate("export", { noteId: id })}>
            <Text style={styles.exportBtn}>Export</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.tabsContainer}>
        {PILL_TABS.map((t) => (
          <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, tab === t.id && styles.activeTab]}>
            <Text style={[styles.tabText, tab === t.id && styles.activeTabText]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "notes" && <NotesTab note={note} annotations={annotations} navigate={navigate} />}
      {tab === "proposals" && <ProposalsTab note={note} />}
      {tab === "comments" && <CommentsTab note={note} />}

      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabsContainer: { flexDirection: "row", backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 20 },
  tab: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: C.accent },
  tabText: { fontSize: 14, color: C.textSecondary },
  activeTabText: { color: C.accent, fontWeight: "600" },
  tabContent: { flex: 1 },
  badgeBar: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12 },
  versionLink: { marginLeft: "auto" },
  versionLinkText: { fontSize: 12, color: C.accent },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  annotationBanner: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: C.warning, borderRadius: 10, padding: 10, marginBottom: 16 },
  annotationBannerHeader: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 4 },
  annotationBannerTitle: { fontSize: 12, fontWeight: "600", color: C.warning },
  annotationBannerText: { fontSize: 12, color: "#92400E" },
  noteContent: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 20 },
  noteHtml: { fontSize: 15, lineHeight: 26, color: C.textPrimary },
  noteReadOnlyInput: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, minHeight: 260, color: C.textPrimary },
  selectHintRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 },
  selectHint: { fontSize: 11, color: C.textMuted, textAlign: "center" },
  suggestionBar: { marginTop: 16, paddingHorizontal: 20, gap: 10 },
  suggestionLabel: { fontSize: 12, color: C.textSecondary },
  suggestionPreview: { fontSize: 13, color: C.textPrimary, backgroundColor: C.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border, minHeight: 56 },
  annotationsSection: { paddingHorizontal: 20, paddingBottom: 20 },
  annotationsTitle: { fontSize: 13, fontWeight: "600", color: C.textSecondary, marginBottom: 10 },
  annotationItem: { backgroundColor: C.warningLight, borderLeftWidth: 3, borderLeftColor: C.warning, borderRadius: 8, padding: 10, marginBottom: 8 },
  annotationText: { fontSize: 13, color: "#92400E", lineHeight: 20 },
  annotationDate: { fontSize: 11, color: C.warning, marginTop: 4 },
  actionButtons: { paddingHorizontal: 20, paddingBottom: 20 },
  sheetLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 8 },
  originalTextContainer: { backgroundColor: C.bg, borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  originalText: { fontSize: 13, color: C.textSecondary, fontStyle: "italic" },
  modalAnnotationText: { lineHeight: 24, color: C.textPrimary },
  modalAnnotationDate: { fontSize: 12, color: C.textMuted, marginTop: 12 },
  filterContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.accentLight, borderColor: C.accent },
  filterChipText: { fontSize: 13, color: C.textSecondary },
  filterChipTextActive: { color: C.accent, fontWeight: "600" },
  proposalsList: { paddingHorizontal: 20, gap: 12, paddingBottom: 20 },
  proposalCard: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14 },
  proposalHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  proposalAuthorBlock: { flex: 1 },
  proposalAuthorTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  inlineIndicator: { fontSize: 12, marginRight: 6 },
  proposalAuthor: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  proposalTime: { fontSize: 12, color: C.textMuted, marginLeft: 6 },
  proposalActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  upvoteBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  upvoteCount: { fontSize: 13, color: C.textMuted },
  proposalSummary: { fontSize: 14, color: C.textPrimary, marginBottom: 8 },
  inlineDiff: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  originalTextInline: { backgroundColor: C.dangerLight, color: C.danger, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 6, fontSize: 13, textDecorationLine: "line-through" },
  suggestedTextInline: { backgroundColor: C.successLight, color: C.success, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 6, fontSize: 13 },
  viewDiffBtn: { marginBottom: 8 },
  viewDiffContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  viewDiffText: { color: C.accent, fontSize: 13 },
  rejectionContainer: { backgroundColor: C.dangerLight, borderRadius: 8, padding: 8, marginBottom: 8 },
  rejectionText: { fontSize: 12, color: C.danger },
  reviewButtons: { flexDirection: "row", gap: 8, marginTop: 8 },
  approveBtn: { borderColor: C.success },
  commentsContainer: { flex: 1 },
  commentsScroll: { flex: 1 },
  commentsList: { padding: 12 },
  commentItem: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 12 },
  replyComment: { marginLeft: 40 },
  commentBubble: { flex: 1, backgroundColor: C.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border },
  lecturerComment: { borderLeftWidth: 4, borderLeftColor: C.accent, backgroundColor: C.accentLight, padding: 8, borderRadius: 8 },
  commentHeader: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 4 },
  commentAuthor: { fontWeight: "600", fontSize: 13, color: C.textPrimary },
  commentTime: { fontSize: 11, color: C.textMuted, marginLeft: "auto" },
  commentContent: { fontSize: 14, color: C.textPrimary, lineHeight: 22 },
  replyBtn: { marginTop: 6 },
  replyBtnText: { color: C.accent, fontSize: 12 },
  replyingTo: { backgroundColor: C.accentLight, borderRadius: 8, padding: 8, marginHorizontal: 16, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  replyingToText: { fontSize: 12, color: C.accent },
  commentInputBar: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, padding: 8, paddingHorizontal: 16 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: C.textPrimary },
  sendBtn: { backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  sendBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  exportBtn: { color: C.accent, fontSize: 13, fontWeight: "600" },
});
