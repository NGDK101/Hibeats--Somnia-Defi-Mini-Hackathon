import { useState, useCallback, useEffect } from "react";
import { GeneratedMusic } from "@/types/music";

export const useMusicPlayer = () => {
  const [currentSong, setCurrentSong] = useState<GeneratedMusic | null>(null);
  const [playlist, setPlaylist] = useState<GeneratedMusic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  // Sync playlist updates whenever generatedMusic changes
  useEffect(() => {
    if (currentSong && playlist.length > 0) {
      // Check if current song still exists in updated playlist
      const updatedIndex = playlist.findIndex(song => song.id === currentSong.id);
      if (updatedIndex === -1) {
        // Current song was removed, clear player
        setCurrentSong(null);
        setIsPlayerVisible(false);
        setCurrentIndex(0);
      } else {
        // Update index if song is still there
        setCurrentIndex(updatedIndex);
      }
    }
  }, [playlist, currentSong]);

  const playSong = useCallback((song: GeneratedMusic, songPlaylist?: GeneratedMusic[]) => {
    setCurrentSong(song);
    
    if (songPlaylist) {
      setPlaylist(songPlaylist);
      const index = songPlaylist.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      setPlaylist([song]);
      setCurrentIndex(0);
    }
    
    setIsPlayerVisible(true);
  }, []);

  const playNext = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentSong(playlist[nextIndex]);
    } else if (playlist.length > 0) {
      // Loop back to first song
      setCurrentIndex(0);
      setCurrentSong(playlist[0]);
    }
  }, [currentIndex, playlist]);

  const playPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSong(playlist[prevIndex]);
    } else if (playlist.length > 0) {
      // Loop to last song
      const lastIndex = playlist.length - 1;
      setCurrentIndex(lastIndex);
      setCurrentSong(playlist[lastIndex]);
    }
  }, [currentIndex, playlist]);

  const changeSong = useCallback((song: GeneratedMusic, index: number) => {
    setCurrentSong(song);
    setCurrentIndex(index);
  }, []);

  const closePlayer = useCallback(() => {
    setIsPlayerVisible(false);
    setCurrentSong(null);
  }, []);

  const stopAudio = useCallback(() => {
    // This will be handled by the MusicPlayer component
    // We just need to signal that audio should be stopped
    setCurrentSong(null);
    setPlaylist([]);
    setCurrentIndex(0);
    setIsPlayerVisible(false);
  }, []);

  const updatePlaylist = useCallback((newPlaylist: GeneratedMusic[]) => {
    setPlaylist(newPlaylist);
    
    // If current song is not in new playlist, reset
    if (currentSong && !newPlaylist.find(song => song.id === currentSong.id)) {
      setCurrentSong(null);
      setCurrentIndex(0);
      setIsPlayerVisible(false);
    } else if (currentSong) {
      // Update current index if song is still in playlist
      const newIndex = newPlaylist.findIndex(song => song.id === currentSong.id);
      if (newIndex >= 0) {
        setCurrentIndex(newIndex);
      }
    }
  }, [currentSong]);

  return {
    currentSong,
    playlist,
    currentIndex,
    isPlayerVisible,
    playSong,
    playNext,
    playPrevious,
    changeSong,
    closePlayer,
    stopAudio,
    updatePlaylist
  };
};
