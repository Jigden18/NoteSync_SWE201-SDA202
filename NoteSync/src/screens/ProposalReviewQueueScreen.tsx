import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/colors";
import { timeAgo, User } from "../utils/helpers";
import { useNoteData } from "../contexts/NoteDataContext";
import { MOCK_MODULES, Proposal } from "../data/mockData";
import { Header } from "../components/layout/Header";
import { Badge } from "../components/ui/Badge";
import { Btn } from "../components/ui/Btn";
import { EmptyState } from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Modal } from "../components/ui/Modal";
import { Sheet } from "../components/ui/Sheet";
import { Input } from "../components/ui/Input";
import { Toast } from "../components/ui/Toast";

interface ProposalReviewQueueScreenProps {
  user: User;
  onBack: () => void;
}

const truncate = (text: string, maxLength = 160) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;

export const ProposalReviewQueueScreen: React.FC<
  ProposalReviewQueueScreenProps
> = ({ user, onBack }) => {
  const { proposals, getNote, setProposalStatus } = useNoteData();
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null,
  );
  const [rejectingProposal, setRejectingProposal] = useState<Proposal | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [toast, setToast] = useState("");

  const pendingProposals = useMemo(
    () =>
      [...proposals]
        .filter((proposal) => proposal.status === "pending")
        .sort((left, right) => {
          if (right.upvoteCount !== left.upvoteCount) {
            return right.upvoteCount - left.upvoteCount;
          }
          return (
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
          );
        }),
    [proposals],
  );

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const approveProposal = (proposal: Proposal) => {
    Alert.alert("Approve proposal?", proposal.summary, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: () => {
          setProposalStatus(proposal.id, "approved");
          showToast("Proposal approved ✓");
        },
      },
    ]);
  };

  const rejectProposal = () => {
    if (!rejectingProposal) {
      return;
    }

    setProposalStatus(
      rejectingProposal.id,
      "rejected",
      rejectionReason.trim() || undefined,
    );
    setRejectingProposal(null);
    setRejectionReason("");
    showToast("Proposal rejected.");
  };

  const renderDiffPreview = (proposal: Proposal) => {
    if (proposal.isInline) {
      return (
        <View style={styles.diffPreview}>
          <Text style={styles.diffLabel}>Inline change</Text>
          <Text style={styles.diffRemoved} numberOfLines={2}>
            - {proposal.originalText || "Original text unavailable"}
          </Text>
          <Text style={styles.diffAdded} numberOfLines={2}>
            + {proposal.suggestedText || "Suggested text unavailable"}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.diffPreview}>
        <Text style={styles.diffLabel}>Full-document change</Text>
        <Text style={styles.fullDocPreview} numberOfLines={3}>
          Current:{" "}
          {truncate(
            proposal.originalText || "Original note content unavailable",
          )}
        </Text>
        <Text style={styles.fullDocPreviewAlt} numberOfLines={3}>
          Proposed:{" "}
          {truncate(
            proposal.suggestedText || "Proposed note content unavailable",
          )}
        </Text>
      </View>
    );
  };

  const selectedNote = selectedProposal
    ? getNote(selectedProposal.noteId)
    : null;
  const selectedModule = selectedNote
    ? MOCK_MODULES.find((module) => module.id === selectedNote.moduleId)
    : undefined;

  return (
    <View style={styles.container}>
      <Header
        title="Proposal Review Queue"
        sub={user.fullName}
        onBack={onBack}
      />

      <View style={styles.summaryRow}>
        <Badge label={`${pendingProposals.length} pending`} color="warning" />
        <Badge label="Sorted by upvotes" color="gray" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {!proposals ? (
            <ListSkeleton />
          ) : pendingProposals.length === 0 ? (
            <EmptyState
              iconName="clipboard-outline"
              title="No pending proposals"
              sub="Everything is up to date"
            />
          ) : (
            pendingProposals.map((proposal) => {
              const note = getNote(proposal.noteId);
              const module = note
                ? MOCK_MODULES.find((item) => item.id === note.moduleId)
                : undefined;

              return (
                <View key={proposal.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardMeta}>
                      <Badge
                        label={
                          proposal.diffType === "inline" ? "Inline" : "Full doc"
                        }
                        color={
                          proposal.diffType === "inline" ? "accent" : "gray"
                        }
                        small
                      />
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {note?.title || "Untitled note"}
                      </Text>
                    </View>
                    <View style={styles.votePill}>
                      <Ionicons name="heart" size={14} color={C.accent} />
                      <Text style={styles.voteText}>
                        {proposal.upvoteCount}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardSubtitle}>
                    {module?.code || "Unknown module"} · {proposal.proposedBy} ·{" "}
                    {timeAgo(proposal.createdAt)}
                  </Text>

                  <Text style={styles.summaryText}>{proposal.summary}</Text>

                  {renderDiffPreview(proposal)}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => setSelectedProposal(proposal)}
                      style={styles.linkBtn}
                    >
                      <Text style={styles.linkBtnText}>View diff</Text>
                    </TouchableOpacity>
                    <View style={styles.actionButtons}>
                      <Btn
                        size="sm"
                        variant="secondary"
                        onPress={() => approveProposal(proposal)}
                      >
                        Approve
                      </Btn>
                      <Btn
                        size="sm"
                        variant="danger"
                        onPress={() => setRejectingProposal(proposal)}
                      >
                        Reject
                      </Btn>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        open={!!selectedProposal}
        onClose={() => setSelectedProposal(null)}
        title="Proposal Diff"
      >
        {selectedProposal && (
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{selectedProposal.summary}</Text>
            <Text style={styles.modalMeta}>
              {selectedModule?.code || "Module"} · {selectedProposal.proposedBy}
            </Text>
            {selectedProposal.isInline ? (
              <View style={styles.modalDiffBlock}>
                <Text style={styles.modalDiffLabel}>Original</Text>
                <Text style={styles.modalDiffRemoved}>
                  {selectedProposal.originalText || "Original text unavailable"}
                </Text>
                <Text style={styles.modalDiffLabel}>Suggested</Text>
                <Text style={styles.modalDiffAdded}>
                  {selectedProposal.suggestedText ||
                    "Suggested text unavailable"}
                </Text>
              </View>
            ) : (
              <View style={styles.modalDiffBlock}>
                <Text style={styles.modalDiffLabel}>Current note</Text>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalDiffRemoved}>
                    {selectedProposal.originalText ||
                      "Original note content unavailable"}
                  </Text>
                </ScrollView>
                <Text style={styles.modalDiffLabel}>Proposed note</Text>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalDiffAdded}>
                    {selectedProposal.suggestedText ||
                      "Proposed note content unavailable"}
                  </Text>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </Modal>

      <Sheet
        open={!!rejectingProposal}
        onClose={() => setRejectingProposal(null)}
        title="Reject proposal"
        half
      >
        <Text style={styles.rejectLabel}>Reason for rejection</Text>
        <Input
          value={rejectionReason}
          onChangeText={setRejectionReason}
          placeholder="Optional note for the student"
          multiline
          rows={4}
        />
        <View style={{ height: 14 }} />
        <Btn full variant="danger" onPress={rejectProposal}>
          Reject proposal
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
  content: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardMeta: {
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textPrimary,
  },
  votePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  voteText: {
    color: C.accent,
    fontWeight: "700",
    fontSize: 12,
  },
  cardSubtitle: {
    fontSize: 12,
    color: C.textMuted,
  },
  summaryText: {
    fontSize: 14,
    color: C.textPrimary,
    lineHeight: 20,
  },
  diffPreview: {
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  diffLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textSecondary,
  },
  diffRemoved: {
    color: C.danger,
    fontSize: 13,
    lineHeight: 20,
  },
  diffAdded: {
    color: C.success,
    fontSize: 13,
    lineHeight: 20,
  },
  fullDocPreview: {
    fontSize: 13,
    lineHeight: 20,
    color: C.textSecondary,
  },
  fullDocPreviewAlt: {
    fontSize: 13,
    lineHeight: 20,
    color: C.textPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  linkBtn: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  linkBtnText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  modalBody: {
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textPrimary,
  },
  modalMeta: {
    fontSize: 12,
    color: C.textMuted,
  },
  modalDiffBlock: {
    gap: 10,
  },
  modalDiffLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textSecondary,
  },
  modalScroll: {
    maxHeight: 120,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
  },
  rejectLabel: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 8,
  },
});
