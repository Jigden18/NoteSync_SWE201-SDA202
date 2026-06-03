import React, { createContext, useContext, useState } from "react";
import { MOCK_NOTES, MOCK_VERSIONS, Note, Version } from "../data/mockData";

interface NoteDataContextValue {
  notes: Note[];
  versions: Version[];
  getNote: (id: string) => Note | undefined;
  getVersion: (id: string) => Version | undefined;
  getNotesByModule: (moduleId: string) => Note[];
  getVersionsForNote: (noteId: string) => Version[];
  createVersion: (noteId: string, content: string, savedBy: string) => Version;
}

const NoteDataContext = createContext<NoteDataContextValue | undefined>(undefined);

export const useNoteData = () => {
  const context = useContext(NoteDataContext);
  if (!context) {
    throw new Error("useNoteData must be used within NoteDataProvider");
  }
  return context;
};

export const NoteDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [versions, setVersions] = useState<Version[]>(MOCK_VERSIONS);

  const getNote = (id: string) => notes.find((note) => note.id === id);
  const getVersion = (id: string) => versions.find((version) => version.id === id);
  const getNotesByModule = (moduleId: string) => notes.filter((note) => note.moduleId === moduleId);
  const getVersionsForNote = (noteId: string) => versions.filter((version) => version.noteId === noteId);

  const createVersion = (noteId: string, content: string, savedBy: string) => {
    const previousVersions = versions.filter((version) => version.noteId === noteId);
    const nextVersionNumber = previousVersions.reduce((max, version) => Math.max(max, version.versionNumber), 0) + 1;
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
          : note
      )
    );

    return newVersion;
  };

  return (
    <NoteDataContext.Provider
      value={{
        notes,
        versions,
        getNote,
        getVersion,
        getNotesByModule,
        getVersionsForNote,
        createVersion,
      }}
    >
      {children}
    </NoteDataContext.Provider>
  );
};
