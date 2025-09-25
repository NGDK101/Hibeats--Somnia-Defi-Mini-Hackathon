import { useState, useMemo } from 'react';
import { PlaylistManager } from '@/components/playlist/PlaylistManager';
import { PlaylistDetailView } from '@/components/playlist/PlaylistDetailView';
import { PlaylistItem } from '@/hooks/usePlaylistManager';
import { GeneratedMusic } from '@/types/music';

interface PortfolioPlaylistProps {
  className?: string;
  onSongSelect?: (song: GeneratedMusic) => void;
}

export const PortfolioPlaylist = ({ className, onSongSelect }: PortfolioPlaylistProps) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistItem | null>(null);

  const handlePlaylistSelect = (playlist: PlaylistItem) => {
    setSelectedPlaylist(playlist);
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
  };

  return (
    <div className={className}>
      {selectedPlaylist ? (
        <PlaylistDetailView
          playlist={selectedPlaylist}
          onBack={handleBackToPlaylists}
          onSongSelect={onSongSelect}
        />
      ) : (
        <PlaylistManager onPlaylistSelect={handlePlaylistSelect} />
      )}
    </div>
  );
};