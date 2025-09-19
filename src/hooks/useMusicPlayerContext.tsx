import React, { createContext, useContext, ReactNode } from "react";
import { useMusicPlayer } from "./useMusicPlayer";

// Create context
const MusicPlayerContext = createContext<ReturnType<typeof useMusicPlayer> | null>(null);

// Provider component
export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const musicPlayerHook = useMusicPlayer();
  
  return (
    <MusicPlayerContext.Provider value={musicPlayerHook}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

// Custom hook to use the context
export const useMusicPlayerContext = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayerContext must be used within MusicPlayerProvider");
  }
  return context;
};
