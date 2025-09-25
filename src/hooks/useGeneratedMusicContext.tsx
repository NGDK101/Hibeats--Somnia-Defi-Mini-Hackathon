import React, { createContext, useContext, ReactNode } from "react";
import { useGeneratedMusic } from "./useGeneratedMusic";

// Create context
const GeneratedMusicContext = createContext<ReturnType<typeof useGeneratedMusic> | null>(null);

// Provider component
export const GeneratedMusicProvider = ({ children }: { children: ReactNode }) => {
  const generatedMusicHook = useGeneratedMusic();
  
  return (
    <GeneratedMusicContext.Provider value={generatedMusicHook}>
      {children}
    </GeneratedMusicContext.Provider>
  );
};

// Custom hook to use the context
export const useGeneratedMusicContext = () => {
  const context = useContext(GeneratedMusicContext);
  if (!context) {
    throw new Error("useGeneratedMusicContext must be used within GeneratedMusicProvider");
  }
  return context;
};
