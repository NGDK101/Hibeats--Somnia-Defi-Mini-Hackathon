import { useState, useEffect } from "react";
import { GeneratePanel } from "@/components/generate/GeneratePanel";
import { LibraryPanel } from "@/components/library/LibraryPanel";
import { SongDetailsPanel } from "@/components/details/SongDetailsPanel";
import { PlaylistSidebar } from "@/components/playlist/PlaylistSidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";

interface CreatePageProps {
  onSongSelect?: (song: any) => void;
}

export const CreatePage = ({ onSongSelect }: CreatePageProps) => {
  const [selectedSong, setSelectedSong] = useState(null);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  const [showPlaylistSidebar, setShowPlaylistSidebar] = useState(true);
  const { currentSong, isPlayerVisible } = useMusicPlayerContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const { userTaskIds, generatedMusic, fetchSongsFromSuno, isFetchingSongs, isLoadingCachedSongs } = useGeneratedMusicContext();

  // Auto-fetch songs from Suno when there are task IDs but no songs (fallback)
  // Only fetch if we don't have cached data and not currently fetching
  useEffect(() => {
    if (userTaskIds && userTaskIds.length > 0 && generatedMusic.length === 0 && !isFetchingSongs && !isLoadingCachedSongs) {
      console.log('🔄 CreatePage: Auto-fetching songs from Suno API');
      fetchSongsFromSuno();
    }
  }, [userTaskIds, generatedMusic.length, isFetchingSongs, isLoadingCachedSongs, fetchSongsFromSuno]);

  const handleSongSelect = (song: any) => {
    setSelectedSong(song);
    setIsDetailsPanelVisible(true);
    setShowPlaylistSidebar(false);
    onSongSelect?.(song);
  };

  const handleCloseDetails = () => {
    setIsDetailsPanelVisible(false);
    setShowPlaylistSidebar(true);
    setSelectedSong(null);
  };

  const handleShowPlaylist = () => {
    setIsDetailsPanelVisible(false);
    setShowPlaylistSidebar(true);
    setSelectedSong(null);
  };

  return (
    <div className="h-[calc(100vh-6rem)]">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Generate Panel - Left Column */}
        <ResizablePanel 
          defaultSize={25} 
          minSize={20} 
          maxSize={35}
          className="border-r border-glass-border/10 overflow-hidden"
        >
          <div className="h-full p-2">
            <GeneratePanel />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="w-2 bg-glass-border/20 hover:bg-glass-border/40 transition-colors" />

        {/* My Workspace - Middle Column */}
        <ResizablePanel 
          defaultSize={(isDetailsPanelVisible || showPlaylistSidebar) ? 55 : 75} 
          minSize={35}
          className={`${(isDetailsPanelVisible || showPlaylistSidebar) ? 'border-r border-glass-border/10' : ''} overflow-hidden`}
        >
          <div className="h-full p-2">
            <LibraryPanel onSongSelect={handleSongSelect} title="My Workspace" />
          </div>
        </ResizablePanel>

        {/* Right Panel - Song Details or Playlist Sidebar */}
        {(isDetailsPanelVisible || showPlaylistSidebar) && (
          <>
            <ResizableHandle withHandle className="w-2 bg-glass-border/20 hover:bg-glass-border/40 transition-colors" />
            <ResizablePanel 
              defaultSize={20} 
              minSize={15} 
              maxSize={30}
              className="overflow-hidden"
            >
              <div className="h-full p-2">
                {isDetailsPanelVisible ? (
                  <SongDetailsPanel 
                    song={selectedSong}
                    isVisible={isDetailsPanelVisible}
                    onClose={handleCloseDetails}
                    onShowPlaylist={handleShowPlaylist}
                    isPlaying={currentSong === selectedSong && isPlaying}
                    onPlayPause={() => {
                      if (selectedSong) {
                        setIsPlaying(!isPlaying);
                      }
                    }}
                  />
                ) : (
                  <PlaylistSidebar />
                )}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};
