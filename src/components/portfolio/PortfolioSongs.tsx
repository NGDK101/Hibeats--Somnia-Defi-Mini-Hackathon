import { useState, useMemo } from "react";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { useAccount } from "wagmi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { NFTActionButtons } from "@/components/ui/NFTActionButtons";
import { SongInteractions } from "@/components/social/SongInteractions";
import { GeneratedMusic } from "@/types/music";
import { 
  Search, 
  Play, 
  Pause, 
  Music,
  Clock,
  Calendar,
  MoreHorizontal,
  Filter,
  Grid3X3,
  List as ListIcon,
  Download,
  Share2,
  Plus,
  Coins,
  Info,
  CheckCircle,
  FileMusic
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface PortfolioSongsProps {
  onSongSelect?: (song: GeneratedMusic) => void;
}

export const PortfolioSongs = ({ onSongSelect }: PortfolioSongsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "recent" | "popular">("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);

  const { generatedMusic, isLoading, userCompletedTaskIds } = useGeneratedMusicContext();
  const { playSong, currentSong, isPlaying, togglePlayPause } = useMusicPlayerContext();
  const { address, isConnected } = useAccount();

  // Utility function to format address
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Filter and search songs
  const filteredSongs = useMemo(() => {
    if (!generatedMusic) return [];

    let filtered = generatedMusic.filter((song) => {
      const matchesSearch = 
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.genre?.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (song.displayName && song.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });

    // Apply additional filters
    switch (filterType) {
      case "recent":
        filtered = filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 20);
        break;
      case "popular":
        // Sort by some popularity metric (for now, just by title length as a placeholder)
        filtered = filtered.sort((a, b) => b.title.length - a.title.length);
        break;
      default:
        // All - no additional filtering
        break;
    }

    return filtered;
  }, [generatedMusic, searchQuery, filterType]);

  const handlePlay = (song: GeneratedMusic) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      playSong(song, filteredSongs);
      setCurrentPlaying(song.id);
    }
  };

  const handleSongSelect = (song: GeneratedMusic) => {
    onSongSelect?.(song);
  };

  // Handle download functionality
  const handleDownload = async (song: GeneratedMusic, format: 'mp3' | 'wav' = 'mp3') => {
    if (!song.audioUrl) {
      toast.error('Audio file not available');
      return;
    }

    try {
      const response = await fetch(song.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const artist = song.artist || song.displayName || formatAddress(address);
      a.style.display = 'none';
      a.href = url;
      a.download = `${song.title} - ${artist}.${format}`.replace(/[^a-z0-9\-\. ]/gi, '_');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${song.title} downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
    }
  };

  // Handle share functionality
  const handleShare = async (song: GeneratedMusic) => {
    const artist = song.artist || song.displayName || formatAddress(address);
    const shareData = {
      title: song.title,
      text: `Check out this song: ${song.title} by ${artist}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully');
      } catch (error) {
        // User cancelled sharing or error occurred
        fallbackShare(song);
      }
    } else {
      fallbackShare(song);
    }
  };

  const fallbackShare = (song: GeneratedMusic) => {
    const artist = song.artist || song.displayName || formatAddress(address);
    navigator.clipboard.writeText(`Check out this song: ${song.title} by ${artist} - ${window.location.href}`)
      .then(() => toast.success('Link copied to clipboard'))
      .catch(() => toast.error('Failed to copy link'));
  };

  // Handle add to playlist
  const handleAddToPlaylist = (song: GeneratedMusic) => {
    toast.info('Add to playlist feature coming soon');
  };

  // Handle add to queue
  const handleAddToQueue = (song: GeneratedMusic) => {
    playSong(song, [song]);
    toast.success(`${song.title} added to queue`);
  };

  // Handle song details
  const handleShowSongDetails = (song: GeneratedMusic) => {
    onSongSelect?.(song);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSongCard = (song: GeneratedMusic) => (
    <GlassCard 
      key={song.id} 
      className="group overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      onClick={() => handleSongSelect(song)}
    >
      <div className="relative aspect-square">
        <img
          src={song.imageUrl || '/api/placeholder/300/300'}
          alt={song.title}
          className="w-full h-full object-cover"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePlay(song);
            }}
            className="w-12 h-12 rounded-full bg-primary/80 hover:bg-primary text-black hover:scale-110 transition-all"
          >
            {currentSong?.id === song.id && isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
            <Music className="w-3 h-3 mr-1" />
            Song
          </Badge>
        </div>

        {/* Duration */}
        <div className="absolute bottom-3 right-3">
          <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {formatDuration(song.duration)}
          </Badge>
        </div>
      </div>

      {/* Song Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-white text-sm truncate">{song.title}</h3>
          <p className="text-white/70 text-xs truncate">
            {song.artist || song.displayName || formatAddress(address)}
          </p>
        </div>

        {/* Genre Tags */}
        {song.genre && song.genre.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {song.genre.slice(0, 2).map((genre, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className={cn(
                  "text-xs px-1.5 py-0.5 transition-all duration-300 bg-primary/20 text-primary border-primary/30 hover:scale-105"
                )}
              >
                {genre}
              </Badge>
            ))}
            {song.genre.length > 2 && (
              <Badge variant="outline" className="text-xs border-white/20 text-white/70 hover:scale-105">
                +{song.genre.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Date and Actions */}
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-xs flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDistanceToNow(new Date(song.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center space-x-1">
            {/* Song Interactions (Like, Comment) */}
            <div onClick={(e) => e.stopPropagation()}>
              <SongInteractions songId={song.id} compact />
            </div>
            
            {/* Download Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(song, 'mp3');
              }}
              className="w-8 h-8 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110 text-white/70 hover:text-white"
            >
              <Download className="w-3 h-3" />
            </Button>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleShare(song);
              }}
              className="w-8 h-8 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110 text-white/70 hover:text-white"
            >
              <Share2 className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* NFT Action Buttons */}
            <div onClick={(e) => e.stopPropagation()}>
              <NFTActionButtons 
                aiTrackId={song.id}
                songData={song}
                size="sm"
              />
            </div>

            {/* Three Dots Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110 text-white/70 hover:text-white"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl p-2"
              >
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToPlaylist(song);
                  }}
                >
                  <Plus className="mr-3 h-4 w-4 text-white" />
                  <span className="font-medium">Add to Playlist</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToQueue(song);
                  }}
                >
                  <ListIcon className="mr-3 h-4 w-4 text-white" />
                  <span className="font-medium">Add to Queue</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowSongDetails(song);
                  }}
                >
                  <Info className="mr-3 h-4 w-4 text-white" />
                  <span className="font-medium">Song Details</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/20 my-2" />
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(song);
                  }}
                >
                  <Share2 className="mr-3 h-4 w-4 text-white" />
                  <span className="font-medium">Share</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(song, 'mp3');
                  }}
                >
                  <Download className="mr-3 h-4 w-4 text-white" />
                  <span className="font-medium">Download MP3</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-white/5 text-white/50 rounded-lg px-3 py-2 transition-all duration-200"
                  disabled
                >
                  <FileMusic className="mr-3 h-4 w-4 text-white/30" />
                  <span className="font-medium">Download WAV (Coming Soon)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  const renderSongListItem = (song: GeneratedMusic, index: number) => (
    <GlassCard 
      key={song.id} 
      className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
      onClick={() => handleSongSelect(song)}
    >
      <div className="flex items-center space-x-4">
        {/* Index Number */}
        <div className="w-8 text-center">
          <span className="text-white/50 text-sm">{index + 1}</span>
        </div>

        {/* Album Art */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={song.imageUrl || '/api/placeholder/48/48'}
            alt={song.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePlay(song);
              }}
              className="w-6 h-6 p-0 rounded-full bg-white/20 hover:bg-white/30"
            >
              {currentSong?.id === song.id && isPlaying ? (
                <Pause className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3 ml-0.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{song.title}</h3>
          <p className="text-white/70 text-xs truncate">
            {song.artist || song.displayName || formatAddress(address)}
          </p>
        </div>

        {/* Genre Tags */}
        <div className="hidden md:flex items-center space-x-1">
          {song.genre?.slice(0, 1).map((genre, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className={cn(
                "text-xs px-1.5 py-0.5 transition-all duration-300 bg-primary/20 text-primary border-primary/30"
              )}
            >
              {genre}
            </Badge>
          ))}
        </div>

        {/* Duration */}
        <div className="w-16 text-right">
          <span className="text-white/50 text-xs">{formatDuration(song.duration)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          {/* Song Interactions (Like, Comment) */}
          <SongInteractions songId={song.id} compact />
          
          {/* Download Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(song, 'mp3');
            }}
            className="w-8 h-8 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110 text-white/70 hover:text-white"
          >
            <Download className="w-4 h-4" />
          </Button>

          {/* NFT Action Buttons */}
          <NFTActionButtons 
            aiTrackId={song.id}
            songData={song}
            size="sm"
          />

          {/* Three Dots Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110 text-white/50 hover:text-white"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl p-2"
            >
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToPlaylist(song);
                }}
              >
                <Plus className="mr-3 h-4 w-4 text-white" />
                <span className="font-medium">Add to Playlist</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToQueue(song);
                }}
              >
                <ListIcon className="mr-3 h-4 w-4 text-white" />
                <span className="font-medium">Add to Queue</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowSongDetails(song);
                }}
              >
                <Info className="mr-3 h-4 w-4 text-white" />
                <span className="font-medium">Song Details</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/20 my-2" />
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(song);
                }}
              >
                <Share2 className="mr-3 h-4 w-4 text-white" />
                <span className="font-medium">Share</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(song, 'mp3');
                }}
              >
                <Download className="mr-3 h-4 w-4 text-white" />
                <span className="font-medium">Download MP3</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-white/5 text-white/50 rounded-lg px-3 py-2 transition-all duration-200"
                disabled
              >
                <FileMusic className="mr-3 h-4 w-4 text-white/30" />
                <span className="font-medium">Download WAV (Coming Soon)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </GlassCard>
  );

  if (!isConnected) {
    return (
      <div className="text-center py-12 text-white/70">
        <Music className="w-16 h-16 mx-auto mb-4 text-white/30" />
        <h3 className="text-lg font-medium text-white mb-2">Wallet Not Connected</h3>
        <p className="text-sm">Please connect your wallet to view your songs</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="h-10 bg-white/10 rounded animate-pulse w-80" />
          <div className="flex space-x-2">
            <div className="h-10 bg-white/10 rounded animate-pulse w-24" />
            <div className="h-10 bg-white/10 rounded animate-pulse w-10" />
          </div>
        </div>

        {/* Loading Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <GlassCard key={i} className="overflow-hidden">
              <div className="aspect-square bg-white/10 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/10 rounded animate-pulse" />
                <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              placeholder="Search your songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 !bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 focus:!bg-white/20 focus:border-primary/50 transition-all duration-300"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-4 py-2 text-sm min-w-[120px] focus:bg-white/20 focus:border-primary/50 transition-all duration-300 cursor-pointer hover:bg-white/20"
              style={{
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-opacity='0.6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="all" className="bg-gray-900 text-white">All Songs</option>
              <option value="recent" className="bg-gray-900 text-white">Recent</option>
              <option value="popular" className="bg-gray-900 text-white">Popular</option>
            </select>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="w-10 h-10 p-0 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300"
          >
            {viewMode === 'grid' ? <ListIcon className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
            <Music className="w-3 h-3 mr-1" />
            {filteredSongs.length} Songs
          </Badge>
          {searchQuery && (
            <Badge variant="outline" className="border-white/20 text-white/70">
              <Search className="w-3 h-3 mr-1" />
              Filtered
            </Badge>
          )}
        </div>
      </div>

      {/* Songs Display */}
      {filteredSongs.length === 0 ? (
        <div className="text-center py-12 text-white/70">
          <Music className="w-16 h-16 mx-auto mb-4 text-white/30" />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchQuery ? 'No songs found' : 'No songs yet'}
          </h3>
          <p className="text-sm">
            {searchQuery 
              ? 'Try adjusting your search terms or filters' 
              : 'Start creating music to build your collection'
            }
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-2"
        }>
          {viewMode === 'grid' 
            ? filteredSongs.map(renderSongCard)
            : filteredSongs.map(renderSongListItem)
          }
        </div>
      )}
    </div>
  );
};