import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../constants/colors";
import { timeAgo } from "../utils/helpers";
import { apiFetch } from "../api/client";
import { Header } from "../components/layout/Header";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Btn } from "../components/ui/Btn";
import { EmptyState } from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Modal } from "../components/ui/Modal";
import { Sheet } from "../components/ui/Sheet";
import { Input } from "../components/ui/Input";
import { Toast } from "../components/ui/Toast";

interface Proposal {
  id: string;
  noteId: string;
  summary: string;
  isInline: boolean;
  originalText: string | null;
  suggestedText: string | null;
  upvoteCount: number;
  createdAt: string;
  status: string;
  proposer: { id: string; fullName: string };
  note: { id: string; title: string; module: { id: string; code: string; name: string } };
}

interface ProposalReviewQueueScreenProps {
  onBack: () => void;
}

const truncate = (text: string, max = 160) => (text.length > max ? `${text.slice(0, max)}…` : text);

export const ProposalReviewQueueScreen: React.FC<ProposalReviewQueueScreenProps> = ({ onBack }) => {
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [rejectingProposal, setRejectingProposal] = useState<Proposal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Proposal[]>("/api/proposals/pending");
      setProposals(data);
    } catch {
      setProposals([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const approveProposal = (proposal: Proposal) => {
    Alert.alert("Approve proposal?", proposal.summary, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          try {
            await apiFetch(`/api/proposals/${proposal.id}/approve`, { method: "PATCH" });
            setProposals((prev) => prev?.filter((p) => p.id !== proposal.id) ?? null);
            showToast("Proposal approved ✓");
          } catch (e: any) {
            showToast(e.message || "Failed to approve");
          }
        },
      },
    ]);
  };

  const rejectProposal = async () => {
    if (!rejectingProposal) return;
    try {
      await apiFetch(`/api/proposals/${rejectingProposal.id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() || undefined }),
      });
      setProposals((prev) => prev?.filter((p) => p.id !== rejectingProposal.id) ?? null);
      setRejectingProposal(null);
      setRejectionReason("");
      showToast("Proposal rejected.");
    } catch (e: any) {
      showToast(e.message || "Failed to reject");
    }
  };

  const renderDiffPreview = (proposal: Proposal) => {
    if (proposal.isInline) {
      return (
        <View style={styles.diffPreview}>
          <Text style={styles.diffLabel}>Inline change</Text>
          <Text style={styles.diffRemoved} numberOfLines={2}>- {proposal.originalText || "Original text unavailable"}</Text>
          <Text style={styles.diffAdded} numberOfLines={2}>+ {proposal.suggestedText || "Suggested text unavailable"}</Text>
        </View>
      );
    }
    return (
      <View style={styles.diffPreview}>
        <Text style={styles.diffLabel}>Full-document change</Text>
        <Text style={styles.fullDocPreview} numberOfLines={3}>Current: {truncate(proposal.originalText || "Original note content unavailable")}</Text>
        <Text style={styles.fullDocPreviewAlt} numberOfLines={3}>Proposed: {truncate(proposal.suggestedText || "Proposed note content unavailable")}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Proposal Review Queue" onBack={onBack} />

      <View style={styles.summaryRow}>
        <Badge label={`${proposals?.length ?? 0} pending`} color="warning" />
        <Badge label="Sorted by upvotes" color="gray" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {!proposals ? (
            <ListSkeleton />
          ) : proposals.length === 0 ? (
            <EmptyState iconName="clipboard-outline" title="No pending proposals" sub="Everything is up to date" />
          ) : (
            proposals.map((proposal) => (
              <View key={proposal.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Avatar name={proposal.proposer.fullName} size={40} />
                  <View style={styles.cardHeaderRight}>
                    <View style={styles.cardMetaRow}>
                      <Badge label={proposal.isInline ? "Inline" : "Full doc"} color={proposal.isInline ? "accent" : "gray"} small />
                      <Text style={styles.cardTitle} numberOfLines={1}>{proposal.note.title}</Text>
                    </View>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {proposal.note.module.code} · {proposal.proposer.fullName} · {timeAgo(proposal.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    accessible
                    accessibilityLabel={`Upvotes: ${proposal.upvoteCount}`}
                    onLongPress={() => Alert.alert("Upvotes", "Use lecturer review to apply changes.")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.votePill}
                  >
                    <Ionicons name="heart" size={14} color={C.accent} />
                    <Text style={styles.voteText}>{proposal.upvoteCount}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.summaryText}>{proposal.summary}</Text>
                {renderDiffPreview(proposal)}

                <View style={styles.actionsRow}>
                  <TouchableOpacity onPress={() => setSelectedProposal(proposal)} style={styles.linkBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.linkBtnText}>View diff</Text>
                  </TouchableOpacity>
                  <View style={styles.actionButtons}>
                    <Btn size="sm" variant="secondary" onPress={() => approveProposal(proposal)}>Approve</Btn>
                    <Btn size="sm" variant="danger" onPress={() => setRejectingProposal(proposal)}>Reject</Btn>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal open={!!selectedProposal} onClose={() => setSelectedProposal(null)} title="Proposal Diff">
        {selectedProposal && (
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{selectedProposal.summary}</Text>
            <Text style={styles.modalMeta}>{selectedProposal.note.module.code} · {selectedProposal.proposer.fullName}</Text>
            {selectedProposal.isInline ? (
              <View style={styles.modalDiffBlock}>
                <Text style={styles.modalDiffLabel}>Original</Text>
                <Text style={styles.modalDiffRemoved}>{selectedProposal.originalText || "Original text unavailable"}</Text>
                <Text style={styles.modalDiffLabel}>Suggested</Text>
                <Text style={styles.modalDiffAdded}>{selectedProposal.suggestedText || "Suggested text unavailable"}</Text>
              </View>
            ) : (
              <View style={styles.modalDiffBlock}>
                <Text style={styles.modalDiffLabel}>Current note</Text>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalDiffRemoved}>{selectedProposal.originalText || "Original note content unavailable"}</Text>
                </ScrollView>
                <Text style={styles.modalDiffLabel}>Proposed note</Text>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalDiffAdded}>{selectedProposal.suggestedText || "Proposed note content unavailable"}</Text>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </Modal>

      <Sheet open={!!rejectingProposal} onClose={() => { setRejectingProposal(null); setRejectionReason(""); }} title="Reject proposal" half>
        <Text style={styles.rejectLabel}>Reason for rejection</Text>
        <Input value={rejectionReason} onChangeText={setRejectionReason} placeholder="Optional note for the student" multiline rows={4} />
        <View style={{ height: 14 }} />
        <Btn full variant="danger" onPress={rejectProposal}>Reject proposal</Btn>
      </Sheet>

      {toast ? <Toast msg={toast} onClose={() => setToast("")} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1 },
  summaryRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, gap: 12 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  cardHeaderRight: { flex: 1, marginLeft: 12 },
  cardMetaRow: { flex: 1, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
  votePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.accentLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  voteText: { color: C.accent, fontWeight: "700", fontSize: 12 },
  cardSubtitle: { fontSize: 12, color: C.textMuted },
  summaryText: { fontSize: 14, color: C.textPrimary, lineHeight: 20 },
  diffPreview: { backgroundColor: C.bg, borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: C.border },
  diffLabel: { fontSize: 12, fontWeight: "700", color: C.textSecondary },
  diffRemoved: { color: C.danger, fontSize: 13, lineHeight: 20 },
  diffAdded: { color: C.success, fontSize: 13, lineHeight: 20 },
  fullDocPreview: { fontSize: 13, lineHeight: 20, color: C.textSecondary },
  fullDocPreviewAlt: { fontSize: 13, lineHeight: 20, color: C.textPrimary },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  actionButtons: { flexDirection: "row", gap: 8 },
  linkBtn: { paddingVertical: 8, paddingRight: 8 },
  linkBtnText: { color: C.accent, fontSize: 13, fontWeight: "700" },
  modalBody: { gap: 12 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
  modalMeta: { fontSize: 12, color: C.textMuted },
  modalDiffBlock: { gap: 10 },
  modalDiffLabel: { fontSize: 12, fontWeight: "700", color: C.textSecondary },
  modalDiffRemoved: { color: C.danger, fontSize: 13, lineHeight: 20 },
  modalDiffAdded: { color: C.success, fontSize: 13, lineHeight: 20 },
  modalScroll: { maxHeight: 120, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10 },
  rejectLabel: { fontSize: 13, color: C.textSecondary, marginBottom: 8 },
});
