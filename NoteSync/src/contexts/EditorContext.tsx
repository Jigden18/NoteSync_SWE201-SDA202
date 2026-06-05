import React, { createContext, useContext, useState } from "react";

interface EditorContextType {
  insertImageUrl: string | null;
  setInsertImageUrl: (url: string | null) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [insertImageUrl, setInsertImageUrl] = useState<string | null>(null);

  return (
    <EditorContext.Provider value={{ insertImageUrl, setInsertImageUrl }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
};
