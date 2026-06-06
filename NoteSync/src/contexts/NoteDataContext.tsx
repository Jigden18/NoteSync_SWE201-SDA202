import React, { createContext, useContext, useState } from 'react';

interface NoteDataContextValue {
  proposalToast: { noteId: string; message: string } | null;
  setProposalToast: (toast: { noteId: string; message: string } | null) => void;
}

const NoteDataContext = createContext<NoteDataContextValue | undefined>(undefined);

export const useNoteData = () => {
  const ctx = useContext(NoteDataContext);
  if (!ctx) throw new Error('useNoteData must be used within NoteDataProvider');
  return ctx;
};

export const NoteDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [proposalToast, setProposalToast] = useState<{ noteId: string; message: string } | null>(null);

  return (
    <NoteDataContext.Provider value={{ proposalToast, setProposalToast }}>
      {children}
    </NoteDataContext.Provider>
  );
};
