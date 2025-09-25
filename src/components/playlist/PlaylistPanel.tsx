import { useState, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Play,
  Pause,
  Plus,
  MoreHorizontal,
  Edit3,
  Trash2,
  Music,
  Clock,
  Calendar,
  Search,
  ListMusic,
  Heart,
  Share,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { usePlaylist } from "@/hooks/usePlaylist";
import { GeneratedMusic } from "@/types/music";

interface PlaylistPanelProps {
  onSongSelect?: (song: GeneratedMusic) => void;
}

export const PlaylistPanel = ({ onSongSelect }: PlaylistPanelProps = {}) => {
  const { generatedMusic } = useGeneratedMusicContext();
  const { playSong, currentSong, isPlayerVisible } = useMusicPlayerContext();
  const { playlists, createPlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist } = usePlaylist();

  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");

  // Filter playlists based on search
  const filteredPlaylists = useMemo(() => {
    if (!searchQuery) return playlists;
    return playlists.filter(playlist =>
      playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [playlists, searchQuery]);

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;

    createPlaylist(newPlaylistName.trim(), newPlaylistDescription.trim());
    setNewPlaylistName("");
    setNewPlaylistDescription("");
    setIsCreateDialogOpen(false);
  };

  const togglePlay = (song: GeneratedMusic, playlistSongs: GeneratedMusic[]) => {
    if (currentPlaying === song.id) {
      // If same song is playing, let the music player handle it
      return;
    } else {
      // Play new song with playlist
      playSong(song, playlistSongs);
      setCurrentPlaying(song.id);
    }
  };

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

  if (selectedPlaylist) {
    // Show playlist details view
    return (
      <GlassCard className="p-3 h-full flex flex-col">
        {/* Playlist Header */}
        <div className="flex-shrink-0 px-3 pt-3 pb-4 border-b border-glass-border/20">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPlaylist(null)}
              className="p-2"
            >
              ← Back
            </Button>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-secondary">
                <img
                  src={selectedPlaylist.coverImage}
                  alt={selectedPlaylist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{selectedPlaylist.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedPlaylist.songs.length} songs • {getTotalDuration(selectedPlaylist.songs)}
                </p>
                {selectedPlaylist.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedPlaylist.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Songs */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {selectedPlaylist.songs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No songs in this playlist</p>
              <p className="text-sm">Add songs from your library to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedPlaylist.songs.map((song, index) => (
                <div key={song.id} className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 text-center text-sm text-muted-foreground">
                    {index + 1}
                  </div>

                  <div className="relative w-12 h-12 rounded overflow-hidden bg-gradient-secondary flex-shrink-0">
                    <img
                      src={song.imageUrl}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full bg-white/90 hover:bg-white text-black opacity-0 group-hover:opacity-100"
                        onClick={() => togglePlay(song, selectedPlaylist.songs)}
                      >
                        {currentPlaying === song.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium text-sm truncate",
                      currentPlaying === song.id ? "text-green-400" : "text-foreground"
                    )}>
                      {song.title}
                    </h3>
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
                    onClick={() => removeSongFromPlaylist(selectedPlaylist.id, song.id)}
                    className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    );
  }

  // Show playlists list view
  return (
    <GlassCard className="p-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-glass-border/20 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Playlists</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-sm border-glass-border">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="playlist-name">Playlist Name</Label>
                  <Input
                    id="playlist-name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Enter playlist name..."
                    className="bg-input/50 border-glass-border"
                  />
                </div>
                <div>
                  <Label htmlFor="playlist-description">Description (Optional)</Label>
                  <Textarea
                    id="playlist-description"
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    placeholder="Enter playlist description..."
                    className="bg-input/50 border-glass-border resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePlaylist}
                    disabled={!newPlaylistName.trim()}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input/50 border-glass-border focus:border-primary/50"
          />
        </div>
      </div>

      {/* Playlists Grid */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="grid grid-cols-2 gap-4">
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="group cursor-pointer"
              onClick={() => setSelectedPlaylist(playlist)}
            >
              <GlassCard className="p-4 hover:bg-white/5 transition-colors">
                <div className="space-y-3">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-secondary">
                    <img
                      src={playlist.coverImage}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-12 h-12 p-0 rounded-full bg-white/90 hover:bg-white text-black opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (playlist.songs.length > 0) {
                            togglePlay(playlist.songs[0], playlist.songs);
                          }
                        }}
                      >
                        <Play className="w-6 h-6 ml-0.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm truncate">{playlist.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {playlist.songs.length} songs • {getTotalDuration(playlist.songs)}
                    </p>
                  </div>

                  {playlist.id !== "liked-songs" && playlist.id !== "recently-played" && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlaylist(playlist.id);
                        }}
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          ))}
        </div>

        {filteredPlaylists.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No playlists found</p>
            <p className="text-sm">Create your first playlist to get started</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
