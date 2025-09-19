import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Heart,
  MoreHorizontal,
  Clock,
  Music,
  ListMusic
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { usePlaylist } from "@/hooks/usePlaylist";
import { GeneratedMusic } from "@/types/music";
import { useAccount } from "wagmi";

interface PlaylistSidebarProps {
  className?: string;
}

export const PlaylistSidebar = ({ className }: PlaylistSidebarProps) => {
  const { currentSong, playlist, currentIndex, isPlayerVisible, playNext, playPrevious, changeSong, closePlayer, updatePlaylist } = useMusicPlayerContext();
  const { userPlaylists } = usePlaylist();
  const { isConnected } = useAccount();

  // Use mock data for now since the hook structure changed
  const playlists = userPlaylists || [];

  // Clear queue when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      closePlayer();
      updatePlaylist([]);
      
      // Stop any currently playing audio
      if ((window as any).stopAudioPlayback) {
        (window as any).stopAudioPlayback();
      }
    }
  }, [isConnected, closePlayer, updatePlaylist]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = (songs: GeneratedMusic[]) => {
    const totalSeconds = songs.reduce((acc, song) => acc + song.duration, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  const handlePlayPause = () => {
    if (!isConnected) {
      return; // Don't allow playback when wallet is disconnected
    }
    if (currentSong && playlist.length > 0) {
      changeSong(currentSong, currentIndex);
    }
  };

  const handleSongClick = (song: GeneratedMusic, index: number) => {
    if (!isConnected) {
      return; // Don't allow queue interactions when wallet is disconnected
    }
    changeSong(song, index);
  };

  return (
    <GlassCard className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-glass-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ListMusic className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Now Playing</h3>
          </div>
          <div className="flex items-center space-x-2">
            {currentSong && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // This will be handled by parent component to toggle to song details
                  if ((window as any).toggleToSongDetails) {
                    (window as any).toggleToSongDetails();
                  }
                }}
                className="w-6 h-6 p-0 rounded-full text-muted-foreground hover:text-white hover:bg-white/10"
                title="Show Song Details"
              >
                <Music className="w-4 h-4" />
              </Button>
            )}
            <Badge variant="outline" className="text-xs">
              {!isConnected ? "0" : playlist.length} songs
            </Badge>
          </div>
        </div>

        {/* Current Song Display */}
        {currentSong && (
          <div className="mt-3">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded overflow-hidden bg-gradient-secondary flex-shrink-0">
                <img
                  src={currentSong.imageUrl}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 rounded-full bg-white/90 hover:bg-white text-black opacity-0 group-hover:opacity-100"
                    onClick={handlePlayPause}
                    disabled={!isConnected}
                  >
                    {isPlayerVisible ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{currentSong.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex items-center justify-center space-x-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={playPrevious}
                disabled={currentIndex === 0 || !isConnected}
                className="w-8 h-8 p-0"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handlePlayPause}
                disabled={!isConnected}
                className="w-10 h-10 p-0 rounded-full"
              >
                {isPlayerVisible ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={playNext}
                disabled={currentIndex >= playlist.length - 1 || !isConnected}
                className="w-8 h-8 p-0"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {!currentSong && (
          <div className="mt-3 text-center py-6 text-muted-foreground">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {!isConnected ? "Connect wallet to play music" : "No song playing"}
            </p>
          </div>
        )}
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <h4 className="font-medium text-sm mb-3 flex items-center justify-between">
              <span>Queue</span>
              {playlist.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {getTotalDuration(playlist)}
                </span>
              )}
            </h4>

            {playlist.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListMusic className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">
                  {!isConnected ? "Connect wallet to view queue" : "No songs in queue"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {playlist.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className={cn(
                      "flex items-center space-x-3 p-2 rounded-lg transition-colors group",
                      currentIndex === index
                        ? "bg-primary/20 border border-primary/30"
                        : "hover:bg-white/5",
                      !isConnected ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    )}
                    onClick={() => handleSongClick(song, index)}
                  >
                    <div className="w-6 text-center">
                      {currentIndex === index ? (
                        <div className="flex items-center justify-center">
                          <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" />
                          <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse ml-0.5" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse ml-0.5" style={{ animationDelay: '0.2s' }} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                      )}
                    </div>

                    <div className="relative w-8 h-8 rounded overflow-hidden bg-gradient-secondary flex-shrink-0">
                      <img
                        src={song.imageUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className={cn(
                        "font-medium text-xs truncate",
                        currentIndex === index ? "text-primary" : "text-foreground"
                      )}>
                        {song.title}
                      </h5>
                      <p className="text-xs text-muted-foreground truncate">
                        {song.artist}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatDuration(song.duration)}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer - Quick Playlist Access */}
      <div className="flex-shrink-0 p-4 border-t border-glass-border/20">
        <h4 className="font-medium text-sm mb-3">Your Playlists</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {playlists.slice(0, 5).map((playlist) => (
            <div
              key={playlist.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs truncate">{playlist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {playlist.songs.length} songs
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {playlists.length > 5 && (
            <div className="text-center py-2">
              <Button variant="ghost" size="sm" className="text-xs">
                View All ({playlists.length})
              </Button>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
