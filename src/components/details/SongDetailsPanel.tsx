import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  X, 
  Play, 
  Pause, 
  Heart, 
  Share2, 
  Calendar, 
  Clock,
  Music,
  User,
  Tag,
  Volume2,
  ChevronRight,
  ChevronDown,
  Edit3,
  Save,
  X as CloseIcon,
  Loader2,
  EyeOff,
  Plus,
  ListMusic,
  Trash2,
  MoreVertical,
  Coins,
  Download
} from "lucide-react";
import { GeneratedMusic } from "@/types/music";
import { cn } from "@/lib/utils";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { NFTMintPanel } from "@/components/nft/NFTMintPanel";
import { usePlaylist } from "@/hooks/usePlaylistNew";

interface SongDetailsPanelProps {
  song?: GeneratedMusic;
  isVisible: boolean;
  onClose: () => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onShowPlaylist?: () => void;
  className?: string;
}

export const SongDetailsPanel = ({ 
  song, 
  isVisible, 
  onClose, 
  isPlaying = false, 
  onPlayPause,
  onShowPlaylist,
  className 
}: SongDetailsPanelProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [lyricsText, setLyricsText] = useState("");
  const [isAutoConverting, setIsAutoConverting] = useState(false);
  const [isNFTMintDialogOpen, setIsNFTMintDialogOpen] = useState(false);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const { updateSongLyrics } = useGeneratedMusicContext();
  const { userPlaylists, createPlaylist, deletePlaylist, addTrackToPlaylist, isLoading: playlistLoading } = usePlaylist();

  // Define playlists from the hook
  const playlists = userPlaylists || [];

  // Auto-convert description to lyrics when song changes
  useEffect(() => {
    if (song && song.id && song.metadata?.description && (!song.lyrics || song.lyrics.trim() === '')) {
      // Only auto-convert if the description is different from current lyrics
      const formattedDescription = formatLyrics(song.metadata.description);
      if (formattedDescription !== song.lyrics) {
        setIsAutoConverting(true);
        // Simulate async operation for better UX
        setTimeout(() => {
          updateSongLyrics(song.id, formattedDescription);
          setIsAutoConverting(false);
        }, 500);
      }
    }
  }, [song?.id, song?.metadata?.description, song?.lyrics, updateSongLyrics]);

  // Handle edit lyrics
  const handleEditLyrics = () => {
    if (song) {
      setLyricsText(song.lyrics || "");
      setIsEditingLyrics(true);
    }
  };

  // Function to format/clean up lyrics
  const formatLyrics = (lyrics: string): string => {
    return lyrics
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n'); // Replace multiple line breaks with double line breaks
  };

  const handleSaveLyrics = () => {
    if (song && song.id) {
      const formattedLyrics = formatLyrics(lyricsText);
      updateSongLyrics(song.id, formattedLyrics);
      setIsEditingLyrics(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingLyrics(false);
    setLyricsText("");
  };

  // Handle adding song to playlist
  const handleAddSongToPlaylist = async (playlistId: bigint) => {
    if (!song?.id) return;
    
    try {
      await addTrackToPlaylist(playlistId, BigInt(song.id));
      setIsPlaylistDialogOpen(false);
    } catch (error) {
      console.error('Error adding song to playlist:', error);
    }
  };

  // Handle creating new playlist
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      await createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        coverImageURI: "",
        isPublic: true,
        tags: [],
        genre: song?.metadata?.genre || ""
      });
      
      setIsCreatePlaylistOpen(false);
      setNewPlaylistName("");
      setNewPlaylistDescription("");
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  // Handle deleting playlist
  const handleDeletePlaylist = async (playlistId: bigint) => {
    try {
      await deletePlaylist(playlistId);
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  // Genre mapping function for familiar genre names
  const getFamiliarGenre = (genre: string): string => {
    const genreMap: { [key: string]: string } = {
      // Electronic & Dance
      'electronic': 'Electronic',
      'electro': 'Electronic',
      'edm': 'EDM',
      'dance': 'Dance',
      'house': 'House',
      'techno': 'Techno',
      'trance': 'Trance',
      'dubstep': 'Dubstep',
      'ambient': 'Ambient',
      'synthwave': 'Synthwave',
      'vaporwave': 'Vaporwave',
      
      // Rock & Metal
      'rock': 'Rock',
      'indie': 'Indie Rock',
      'alternative': 'Alternative',
      'punk': 'Punk',
      'metal': 'Metal',
      'hard rock': 'Hard Rock',
      'soft rock': 'Soft Rock',
      'grunge': 'Grunge',
      'garage rock': 'Garage Rock',
      
      // Hip Hop & Rap
      'hip-hop': 'Hip Hop',
      'hip hop': 'Hip Hop',
      'rap': 'Rap',
      'trap': 'Trap',
      'drill': 'Drill',
      
      // Pop
      'pop': 'Pop',
      'indie pop': 'Indie Pop',
      'dream pop': 'Dream Pop',
      'chamber pop': 'Chamber Pop',
      
      // Jazz & Blues
      'jazz': 'Jazz',
      'blues': 'Blues',
      'funk': 'Funk',
      'soul': 'Soul',
      'r&b': 'R&B',
      'neo soul': 'Neo Soul',
      
      // Classical & Orchestral
      'classical': 'Classical',
      'orchestral': 'Orchestral',
      'piano': 'Piano',
      'violin': 'Classical',
      
      // World & Ethnic
      'world': 'World',
      'folk': 'Folk',
      'reggae': 'Reggae',
      'latin': 'Latin',
      'bossa nova': 'Bossa Nova',
      'salsa': 'Salsa',
      
      // Other genres
      'country': 'Country',
      'bluegrass': 'Bluegrass',
      'gospel': 'Gospel',
      'disco': 'Disco',
      'new wave': 'New Wave',
      'post-punk': 'Post-Punk',
      'experimental': 'Experimental',
      'lo-fi': 'Lo-Fi',
      'chillhop': 'Chillhop'
    };
    
    const lowerGenre = genre.toLowerCase();
    return genreMap[lowerGenre] || genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase();
  };

  if (!isVisible) return null;

  return (
    <div className={cn("h-full", className)}>
      <GlassCard className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-glass-border/30">
          <div className="flex items-center gap-3 group">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-6 h-6 p-0 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Hide Now Playing"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Toggle to playlist sidebar
                onShowPlaylist?.();
              }}
              className="w-6 h-6 p-0 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Show Playlist"
            >
              <ListMusic className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold text-white">
              {song ? (song.genre && song.genre.length > 0 ? getFamiliarGenre(song.genre[0]) : 'Genre Lagu') : 'Genre Lagu'}
            </h2>
          </div>
        </div>

        {song ? (
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Song Cover & Basic Info */}
              <div className="text-center space-y-4">
                <div className="relative w-48 h-48 mx-auto rounded-xl overflow-hidden bg-gradient-to-br from-primary/40 to-accent/40">
                  {song.imageUrl ? (
                    <img 
                      src={song.imageUrl} 
                      alt={song.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Try fallback to original URL if this is an IPFS URL and we have original URL
                        if (song.imageUrl.includes('gateway.pinata.cloud') && song.originalImageUrl && song.originalImageUrl !== song.imageUrl) {
                          // console.log('🔄 Trying original image URL as fallback for:', song.title);
                          target.src = song.originalImageUrl;
                        } else {
                          // Final fallback to placeholder
                          target.src = "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=" + encodeURIComponent(song.title || "Music");
                        }
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-blue-500/30 flex items-center justify-center">
                      <Music className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">{song.title}</h3>
                  <p className="text-muted-foreground flex items-center justify-center gap-1">
                    <User className="w-4 h-4" />
                    {song.artist}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={onPlayPause}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary-glow hover:scale-105 transition-transform"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLiked(!isLiked)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-colors",
                      isLiked ? "text-red-400 hover:text-red-300" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 rounded-full text-muted-foreground hover:text-white"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>

                  <Dialog open={isNFTMintDialogOpen} onOpenChange={setIsNFTMintDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-10 h-10 rounded-full text-muted-foreground hover:text-yellow-400"
                        title="Mint as NFT"
                      >
                        <Coins className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Mint Music as NFT</DialogTitle>
                      </DialogHeader>
                      <NFTMintPanel
                        selectedSong={song}
                        onMintSuccess={(tokenId) => {
                          setIsNFTMintDialogOpen(false);
                          // You could add additional success handling here
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Separator className="bg-glass-border/30" />

              {/* Song Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white uppercase tracking-wide">Information</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration
                    </span>
                    <span className="text-white">{song.duration}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created
                    </span>
                    <span className="text-white">
                      {song.createdAt ? new Date(song.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Quality
                    </span>
                    <Badge variant="outline" className="text-primary border-primary/50">
                      HD Audio
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Type
                    </span>
                    <Badge variant="outline" className="text-primary border-primary/50">
                      Listing
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="bg-glass-border/30" />

              {/* Lyrics */}
              {song && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white uppercase tracking-wide">Lyrics</h4>
                        {isAutoConverting && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Converting...
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {song.lyrics && song.lyrics.trim() !== '' && !isEditingLyrics && (
                          <>
                            <Button
                              onClick={() => {
                                if (song && song.id && song.lyrics) {
                                  updateSongLyrics(song.id, formatLyrics(song.lyrics));
                                }
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-muted-foreground hover:text-white"
                            >
                              Format
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleEditLyrics}
                              className="h-6 px-2 text-xs text-muted-foreground hover:text-white"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {isEditingLyrics ? (
                      <div className="space-y-3">
                        <Textarea
                          value={lyricsText}
                          onChange={(e) => setLyricsText(e.target.value)}
                          placeholder="Enter lyrics here..."
                          className="min-h-[200px] bg-muted/10 border-glass-border/20 text-foreground resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveLyrics}
                            size="sm"
                            className="h-8 px-3 text-xs"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            onClick={() => setLyricsText(formatLyrics(lyricsText))}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                          >
                            Format
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                          >
                            <CloseIcon className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : song.lyrics && song.lyrics.trim() !== '' ? (
                      <div className="bg-muted/10 rounded-lg p-4 border border-glass-border/20">
                        <div className="text-foreground text-sm leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                          {song.lyrics}
                        </div>
                      </div>
                    ) : isAutoConverting ? (
                      <div className="bg-muted/10 rounded-lg p-4 border border-glass-border/20">
                        <div className="flex items-center justify-center py-8">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Converting description to lyrics...</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/10 rounded-lg p-4 border border-glass-border/20 border-dashed">
                        <div className="text-center text-muted-foreground">
                          <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No lyrics available</p>
                          <p className="text-xs mt-1">Lyrics will be automatically generated from description</p>
                          <Button
                            onClick={handleEditLyrics}
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-8 px-3 text-xs"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Add Lyrics
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <Separator className="bg-glass-border/30" />
                </>
              )}
              {/* Description fallback */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white uppercase tracking-wide">Description</h4>
                  {song && song.metadata?.description && (
                    <Button
                      onClick={() => {
                        if (song && song.id && song.metadata?.description) {
                          const formattedLyrics = formatLyrics(song.metadata.description);
                          updateSongLyrics(song.id, formattedLyrics);
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-white"
                    >
                      Use as Lyrics
                    </Button>
                  )}
                </div>
                <div className="text-muted-foreground text-sm leading-relaxed bg-muted/5 rounded-lg p-3 border border-glass-border/10">
                  {song.metadata?.description || "AI-generated music track with unique sound and style."}
                </div>
              </div>

              <Separator className="bg-glass-border/30" />

              {/* Related Actions */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white uppercase tracking-wide">Actions</h4>
                <div className="space-y-2">
                  <Dialog open={isPlaylistDialogOpen} onOpenChange={setIsPlaylistDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5"
                      >
                        <ListMusic className="w-4 h-4 mr-3" />
                        Add to Playlist
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card/95 backdrop-blur-sm border-glass-border max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add to Playlist</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {playlists.length === 0 ? (
                          <div className="text-center py-8">
                            <ListMusic className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground mb-4">No playlists yet</p>
                            <Button 
                              onClick={() => {
                                setIsPlaylistDialogOpen(false);
                                setIsCreatePlaylistOpen(true);
                              }}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Create First Playlist
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {playlists.map(playlist => (
                              <Button
                                key={playlist.id}
                                variant="ghost"
                                className="w-full justify-between text-left"
                                onClick={() => handleAddSongToPlaylist(playlist.id)}
                              >
                                <div>
                                  <div className="font-medium text-white">{playlist.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {playlist.songs.length} songs
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            ))}
                          </div>
                        )}
                        {playlists.length > 0 && (
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsPlaylistDialogOpen(false);
                              setIsCreatePlaylistOpen(true);
                            }}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Playlist
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Create Playlist Dialog */}
                  <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
                    <DialogContent className="bg-card/95 backdrop-blur-sm border-glass-border max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create New Playlist</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">
                            Playlist Name
                          </label>
                          <Input
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            placeholder="Enter playlist name..."
                            className="bg-input/50 border-glass-border"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">
                            Description (Optional)
                          </label>
                          <Textarea
                            value={newPlaylistDescription}
                            onChange={(e) => setNewPlaylistDescription(e.target.value)}
                            placeholder="Describe your playlist..."
                            className="bg-input/50 border-glass-border resize-none"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleCreatePlaylist}
                            disabled={!newPlaylistName.trim()}
                            className="flex-1"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Playlist
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsCreatePlaylistOpen(false);
                              setNewPlaylistName("");
                              setNewPlaylistDescription("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5"
                  >
                    <Share2 className="w-4 h-4 mr-3" />
                    Share Track
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5"
                  >
                    <Download className="w-4 h-4 mr-3" />
                    Download
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>
              </div>

              <Separator className="bg-glass-border/30" />

              {/* My Playlists */}
              {playlists.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-white uppercase tracking-wide">My Playlists</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {playlists.map(playlist => (
                      <div key={playlist.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/5 border border-glass-border/10">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate">{playlist.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {playlist.songs.length} songs
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddSongToPlaylist(playlist.id)}
                            className="w-6 h-6 p-0 text-muted-foreground hover:text-white"
                            title="Add current song to this playlist"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePlaylist(playlist.id)}
                            className="w-6 h-6 p-0 text-muted-foreground hover:text-red-400"
                            title="Delete playlist"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatePlaylistOpen(true)}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Playlist
                  </Button>
                </div>
              )}

            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/20 flex items-center justify-center">
                <Music className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-medium">No song selected</h3>
                <p className="text-muted-foreground text-sm">Select a song to view details</p>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
