import React, { createContext, useContext, useState } from "react";
import {
  MOCK_NOTES,
  MOCK_PROPOSALS_INIT,
  MOCK_VERSIONS,
  Note,
  Proposal,
  Version,
} from "../data/mockData";

interface NoteDataContextValue {
  notes: Note[];
  versions: Version[];
  proposals: Proposal[];
  getNote: (id: string) => Note | undefined;
  getVersion: (id: string) => Version | undefined;
  getProposal: (id: string) => Proposal | undefined;
  getNotesByModule: (moduleId: string) => Note[];
  getVersionsForNote: (noteId: string) => Version[];
  getProposalsForNote: (noteId: string) => Proposal[];
  createVersion: (noteId: string, content: string, savedBy: string) => Version;
  createProposal: (
    noteId: string,
    proposedBy: string,
    summary: string,
    diff: {
      isInline: boolean;
      originalText?: string;
      suggestedText?: string;
    },
  ) => Proposal;
  proposalToast: { noteId: string; message: string } | null;
  clearProposalToast: () => void;
}

const NoteDataContext = createContext<NoteDataContextValue | undefined>(
  undefined,
);

export const useNoteData = () => {
  const context = useContext(NoteDataContext);
  if (!context) {
    throw new Error("useNoteData must be used within NoteDataProvider");
  }
  return context;
};

export const NoteDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [versions, setVersions] = useState<Version[]>(MOCK_VERSIONS);
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS_INIT);
  const [proposalToast, setProposalToast] = useState<{
    noteId: string;
    message: string;
  } | null>(null);

  const getNote = (id: string) => notes.find((note) => note.id === id);
  const getVersion = (id: string) =>
    versions.find((version) => version.id === id);
  const getProposal = (id: string) =>
    proposals.find((proposal) => proposal.id === id);
  const getNotesByModule = (moduleId: string) =>
    notes.filter((note) => note.moduleId === moduleId);
  const getVersionsForNote = (noteId: string) =>
    versions.filter((version) => version.noteId === noteId);
  const getProposalsForNote = (noteId: string) =>
    proposals.filter((proposal) => proposal.noteId === noteId);

  const createVersion = (noteId: string, content: string, savedBy: string) => {
    const previousVersions = versions.filter(
      (version) => version.noteId === noteId,
    );
    const nextVersionNumber =
      previousVersions.reduce(
        (max, version) => Math.max(max, version.versionNumber),
        0,
      ) + 1;
    const newVersion: Version = {
      id: `version-${Date.now()}`,
      noteId,
      content,
      versionNumber: nextVersionNumber,
      savedBy,
      savedAt: new Date().toISOString(),
      isPinned: false,
    };

    setVersions((prevVersions) => [...prevVersions, newVersion]);
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              currentVersionId: newVersion.id,
              currentVersionNumber: nextVersionNumber,
            }
          : note,
      ),
    );

    return newVersion;
  };

  const createProposal = (
    noteId: string,
    proposedBy: string,
    summary: string,
    diff: {
      isInline: boolean;
      originalText?: string;
      suggestedText?: string;
    },
  ) => {
    const newProposal: Proposal = {
      id: `proposal-${Date.now()}`,
      noteId,
      proposedBy,
      summary,
      upvoteCount: 0,
      hasUpvoted: false,
      status: "pending",
      createdAt: new Date().toISOString(),
      isInline: diff.isInline,
      diffType: diff.isInline ? "inline" : "full-doc",
      originalText: diff.originalText,
      suggestedText: diff.suggestedText,
    };

    setProposals((prevProposals) => [newProposal, ...prevProposals]);
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === noteId
          ? { ...note, pendingProposalCount: note.pendingProposalCount + 1 }
          : note,
      ),
    );
    setProposalToast({
      noteId,
      message: "Proposal submitted successfully.",
    });

    return newProposal;
  };

  const clearProposalToast = () => {
    setProposalToast(null);
  };

  return (
    <NoteDataContext.Provider
      value={{
        notes,
        versions,
        proposals,
        getNote,
        getVersion,
        getProposal,
        getNotesByModule,
        getVersionsForNote,
        getProposalsForNote,
        createVersion,
        createProposal,
        proposalToast,
        clearProposalToast,
      }}
    >
      {children}
    </NoteDataContext.Provider>
  );
};
