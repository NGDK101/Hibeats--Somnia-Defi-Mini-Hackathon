import { useState } from 'react';
import { PortfolioPlaylist } from '@/components/portfolio/PortfolioPlaylist';
import { Navigation } from '@/components/layout/Navigation';
import { PlaylistSidebar } from '@/components/playlist/PlaylistSidebar';
import { SongDetailsPanel } from '@/components/details/SongDetailsPanel';
import { MusicPlayer } from '@/components/player/MusicPlayer';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useMusicPlayerContext } from '@/hooks/useMusicPlayerContext';

export const PlaylistPage = () => {
  const [selectedSong, setSelectedSong] = useState(null);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  const [showPlaylistSidebar, setShowPlaylistSidebar] = useState(true);
  const { currentSong, playlist, currentIndex, playNext, playPrevious, isPlayerVisible } = useMusicPlayerContext();

  const handleSongSelect = (song) => {
    setSelectedSong(song);
    setIsDetailsPanelVisible(true);
    setShowPlaylistSidebar(false);
  };

  const handleCloseDetails = () => {
    setIsDetailsPanelVisible(false);
    setShowPlaylistSidebar(true);
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation activeTab="playlist" onTabChange={() => {}} />
      
      <main className={`w-full transition-all duration-300 ${isPlayerVisible ? 'pb-32' : 'pb-8'}`}>
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-80px)]">
          {/* Main Content */}
          <ResizablePanel defaultSize={showPlaylistSidebar && !isDetailsPanelVisible ? 75 : 100}>
            <div className="h-full overflow-y-auto">
              <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-white mb-4">My Playlists</h1>
                  <p className="text-white/70 text-lg">Manage and enjoy your music collections</p>
                </div>
                
                <PortfolioPlaylist onSongSelect={handleSongSelect} />
              </div>
            </div>
          </ResizablePanel>

          {/* Resizable Handle */}
          {(showPlaylistSidebar || isDetailsPanelVisible) && (
            <ResizableHandle className="w-2 bg-glass-border/30 hover:bg-glass-border/50 transition-colors" />
          )}

          {/* Playlist Sidebar or Song Details */}
          {showPlaylistSidebar && !isDetailsPanelVisible && (
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <PlaylistSidebar />
            </ResizablePanel>
          )}

          {isDetailsPanelVisible && selectedSong && (
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <SongDetailsPanel
                song={selectedSong}
                onClose={handleCloseDetails}
                className="h-full"
              />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </main>

      {/* Music Player */}
      <MusicPlayer 
        currentSong={currentSong}
        playlist={playlist}
        currentIndex={currentIndex}
        onNext={playNext}
        onPrevious={playPrevious}
        className="fixed bottom-0 left-0 right-0 z-50"
      />
    </div>
  );
};