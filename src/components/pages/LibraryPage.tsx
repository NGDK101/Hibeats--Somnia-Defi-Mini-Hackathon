import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GlassCard } from "@/components/ui/glass-card";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SongDetailsPanel } from "@/components/details/SongDetailsPanel";
import { PlaylistSidebar } from "@/components/playlist/PlaylistSidebar";
import { Search, Upload, MoreHorizontal, Play, Pause, Heart, MessageCircle, Share, Clock, Users, ThumbsUp, X } from "lucide-react";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { usePlaylist } from "@/hooks/usePlaylist";
import { GeneratedMusic } from "@/types/music";
import { toast } from "@/hooks/use-toast";
import { getCookie, setCookie } from "@/utils/cookies";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

// Import new NFT components
import NFTGrid from "@/components/ui/NFTGrid";
import NFTActionButtons from "@/components/ui/NFTActionButtons";
import IPFSConnectionTest from "@/components/debug/IPFSConnectionTest";
import FactoryMintTest from "@/components/debug/FactoryMintTest";

interface LibraryPageProps {
  onSongSelect?: (song: any) => void;
}

export const LibraryPage = ({ onSongSelect }: LibraryPageProps) => {
  const [activeTab, setActiveTab] = useState(getCookie("libraryActiveTab") || "songs");
  const [searchQuery, setSearchQuery] = useState(getCookie("librarySearchQuery") || "");
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  const [showPlaylistSidebar, setShowPlaylistSidebar] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const { generatedMusic, userCompletedTaskIds, userTaskIds, fetchSongsFromSuno, isFetchingSongs, cachedSongs, isLoadingCachedSongs, cachedSongsError, clearGeneratedMusic, pendingTasks, taskStatuses, checkAllPendingTasksStatus, debugContractData, isGenerating, currentTaskId, forceRefresh } = useGeneratedMusicContext();
  const { playSong, currentSong, closePlayer } = useMusicPlayerContext();
  const { address, isConnected } = useAccount();

  // Add togglePlayPause handler
  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };
  const { userPlaylists } = usePlaylist();

  // Mock data for liked playlists, following, followers, and history
  const [likedPlaylists] = useState([]);
  const [following] = useState([]);
  const [followers] = useState([]);
  const [history] = useState([]);

  useEffect(() => {
    setCurrentPlaying(currentSong?.id || null);
  }, [currentSong]);

  // Save activeTab to cookie when it changes
  useEffect(() => {
    setCookie("libraryActiveTab", activeTab, { expires: 7 }); // Expires in 7 days
  }, [activeTab]);

  // Save searchQuery to cookie when it changes
  useEffect(() => {
    setCookie("librarySearchQuery", searchQuery, { expires: 7 });
  }, [searchQuery]);

  // Use cached songs from React Query instead of manual fetching
  useEffect(() => {
    if (cachedSongs && cachedSongs.length > 0 && generatedMusic.length === 0) {
      // Update local state with cached songs
      // Note: This is handled by the context, but we can add additional logic here if needed
    }
  }, [cachedSongs, generatedMusic.length]);

  // Auto-fetch songs from Suno when there are task IDs but no songs (fallback)
  useEffect(() => {
    if (userTaskIds && userTaskIds.length > 0 && generatedMusic.length === 0 && !isFetchingSongs && !isLoadingCachedSongs) {
      fetchSongsFromSuno();
    }
  }, [userTaskIds, generatedMusic.length, isFetchingSongs, isLoadingCachedSongs, fetchSongsFromSuno]);

  // Auto-refresh pending tasks status every 30 seconds
  useEffect(() => {
    if (!pendingTasks || pendingTasks.size === 0 || !isConnected) {
      return;
    }

    const interval = setInterval(() => {
      if (!isFetchingSongs) {
        checkAllPendingTasksStatus();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [pendingTasks, isConnected, isFetchingSongs, checkAllPendingTasksStatus]);

  // Show toast when generation starts
  useEffect(() => {
    if (isGenerating && currentTaskId) {
      toast({
        title: "🎵 Song Generation Started",
        description: "Your AI music is being created. Check the In Progress tab for details.",
        duration: 5000,
      });
    }
  }, [isGenerating, currentTaskId]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to calculate progress based on task status and time
  const calculateProgress = (taskId: string, status: string) => {
    if (status === 'SUCCESS') return 100;
    if (status === 'FAILED' || status === 'ERROR') return 0;

    // For pending tasks, calculate based on estimated time
    // Assuming average generation time is 2-3 minutes
    const estimatedTotalTime = 180000; // 3 minutes in milliseconds
    const taskStatus = taskStatuses.get(taskId);

    if (taskStatus && taskStatus.lastChecked) {
      const elapsed = Date.now() - taskStatus.lastChecked;
      const progress = Math.min((elapsed / estimatedTotalTime) * 100, 90); // Cap at 90% until actually complete
      return Math.round(progress);
    }

    return 30; // Default progress if no timing data
  };

  // Function to get estimated time remaining
  const getEstimatedTimeRemaining = (taskId: string, status: string) => {
    if (status === 'SUCCESS') return 'Complete';
    if (status === 'FAILED' || status === 'ERROR') return 'Failed';

    const taskStatus = taskStatuses.get(taskId);
    if (taskStatus && taskStatus.lastChecked) {
      const elapsed = Date.now() - taskStatus.lastChecked;
      const estimatedTotalTime = 180000; // 3 minutes
      const remaining = Math.max(estimatedTotalTime - elapsed, 0);
      const minutes = Math.ceil(remaining / 60000);
      return `~${minutes} min remaining`;
    }

    return '~2-3 min remaining';
  };

  const handlePlay = (song: GeneratedMusic) => {
    if (!isConnected) {
      toast({
        title: "Wallet Disconnected",
        description: "Please connect your wallet to play music",
        variant: "destructive",
      });
      return;
    }

    if (currentPlaying === song.id) {
      togglePlayPause();
    } else {
      playSong(song, filteredSongs);
      setCurrentPlaying(song.id);
    }
  };

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

  const handlePublish = (song: GeneratedMusic) => {
    // TODO: Implement publish functionality
  };

  // Function to check status of pending tasks
  const checkPendingTasksStatus = async () => {
    if (!pendingTasks || pendingTasks.size === 0) {
      toast({
        title: "No pending tasks",
        description: "There are no songs currently being generated",
        variant: "default",
      });
      return;
    }

    const previousSongCount = generatedMusic.length;

    toast({
      title: "Checking status...",
      description: "Updating status of your generating songs",
    });

    try {
      // Fetch latest songs from Suno API
      await fetchSongsFromSuno();
      
      // Also refresh contract data
      if (debugContractData) {
        await debugContractData();
      }

      // Check if new songs were added
      const newSongCount = generatedMusic.length;
      const songsCompleted = newSongCount - previousSongCount;

      if (songsCompleted > 0) {
        toast({
          title: "🎵 Songs completed!",
          description: `${songsCompleted} song(s) have finished generating and are now available`,
        });
      } else {
        toast({
          title: "Status updated",
          description: "Checked all pending songs. Still generating...",
        });
      }
    } catch (error) {
      toast({
        title: "Status check failed",
        description: "Failed to update song status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Coming soon upload functionality
  const handleUploadClick = () => {
    toast({
      title: "Coming Soon!",
      description: "Audio upload feature is coming soon. Stay tuned for updates!",
    });
  };

  const filteredSongs = useMemo(() => {
    return generatedMusic.filter((song) => {
      // Only show songs when wallet is connected
      if (!isConnected) {
        return false;
      }

      // Only show songs that are saved in the smart contract (using userTaskIds only)
      const isInContract = userTaskIds && userTaskIds.includes(song.taskId);

      // Don't show songs that are still pending (in progress) AND not actually completed
      const isPending = pendingTasks && pendingTasks.has(song.taskId);
      const isActuallyCompleted = song.audioUrl && song.audioUrl !== "" && !song.audioUrl.includes('placeholder') && !song.id.startsWith('pending-');

      const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));

      // Show songs that are in contract OR have actual content (completed but contract not updated yet)
      return (isInContract || isActuallyCompleted) && (!isPending || isActuallyCompleted) && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by priority: pending tasks first, then by creation date (newest first)
      const aIsPending = a.id.startsWith('pending-') || (pendingTasks && pendingTasks.has(a.taskId));
      const bIsPending = b.id.startsWith('pending-') || (pendingTasks && pendingTasks.has(b.taskId));

      // Placeholder untuk currentTaskId selalu di atas
      const aIsCurrentPlaceholder = a.id.startsWith('pending-') && a.taskId === currentTaskId;
      const bIsCurrentPlaceholder = b.id.startsWith('pending-') && b.taskId === currentTaskId;

      if (aIsCurrentPlaceholder && !bIsCurrentPlaceholder) return -1;
      if (!aIsCurrentPlaceholder && bIsCurrentPlaceholder) return 1;

      // Pending tasks ditempatkan di atas completed songs
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;

      // Untuk pending tasks, sort by taskId first, then by song number
      if (aIsPending && bIsPending) {
        const aTaskId = a.taskId;
        const bTaskId = b.taskId;
        if (aTaskId !== bTaskId) {
          return aTaskId.localeCompare(bTaskId);
        }
        // Same taskId, sort by song number (1 before 2)
        const aNum = parseInt(a.id.split('-').pop() || '0');
        const bNum = parseInt(b.id.split('-').pop() || '0');
        return aNum - bNum;
      }

      // Untuk completed songs, sort by creation date (newest first) - PRIORITAS UTAMA
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();

      // Handle invalid dates
      if (isNaN(aDate) && isNaN(bDate)) return 0;
      if (isNaN(aDate)) return 1; // a is invalid, b comes first
      if (isNaN(bDate)) return -1; // b is invalid, a comes first

      // Newest first: higher timestamp comes first
      return bDate - aDate;
    });
  }, [generatedMusic, isConnected, userTaskIds, pendingTasks, searchQuery, forceRefresh, currentTaskId]);

  const renderSongItem = (song: GeneratedMusic, index: number) => (
    <div key={song.id} className="group">
      <GlassCard 
        className="p-3 cursor-pointer" 
        onClick={() => handleSongSelect(song)}
      >
        <div className="flex items-center space-x-3">
          {/* Album Cover */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-secondary flex-shrink-0">
            <img
              src={song.imageUrl || "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music"}
              alt={song.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music";
              }}
            />
            {/* Duration overlay */}
            <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-tl-md font-medium">
              {formatDuration(song.duration || 30)}
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className={`w-10 h-10 p-0 rounded-full bg-white/90 hover:bg-white text-black hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                  !isConnected ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay(song);
                }}
                disabled={!isConnected}
              >
                <div className="text-black">
                  {currentPlaying === song.id && isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </div>
              </Button>
            </div>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h3 className={`font-medium text-sm truncate ${
                  currentPlaying === song.id ? "text-green-400" : "text-foreground"
                }`}>
                  {song.title}
                </h3>
                {currentPlaying === song.id && isPlaying && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" />
                    <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {/* Replace static Publish button with dynamic NFT status button */}
                <div className="h-7">
                  <NFTActionButtons
                    aiTrackId={song.id}
                    songData={{
                      title: song.title,
                      artist: song.artist || song.displayName,
                      imageUrl: song.imageUrl,
                      audioUrl: song.audioUrl,
                      genre: song.genre,
                      duration: song.duration,
                      createdAt: song.createdAt,
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-7 h-7 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110"
                >
                  <Heart className="w-3.5 h-3.5 text-white hover:text-white/80" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-7 h-7 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white hover:text-white/80" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-7 h-7 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110"
                >
                  <Share className="w-3.5 h-3.5 text-white hover:text-white/80" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-7 h-7 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110 text-white"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56 bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl p-2"
                  >
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10">
                      <Share className="mr-3 h-4 w-4 text-white" />
                      <span className="font-medium">Share</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {song.artist || "AI Generated"}
            </p>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center space-x-1">
                {song.genre.slice(0, 2).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs px-1.5 py-0.5">
                    {genre}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Badge
                  variant="outline"
                  className="text-xs text-primary border-primary/50"
                >
                  Library
                </Badge>
              </div>
            </div>

            {/* Progress Bar for Pending Songs */}
            {song.id.startsWith('pending-') && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs text-muted-foreground">
                    {(() => {
                      const taskStatus = taskStatuses.get(song.taskId);
                      if (taskStatus?.status === 'SUCCESS') return '100%';
                      if (taskStatus?.status === 'PENDING') return '~60%';
                      if (taskStatus?.status === 'FAILED') return '0%';
                      return '~30%';
                    })()}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    song.id.startsWith('pending-') ? "bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" : "bg-green-500"
                  )}
                       style={{
                         width: (() => {
                           const taskStatus = taskStatuses.get(song.taskId);
                           if (taskStatus?.status === 'SUCCESS') return '100%';
                           if (taskStatus?.status === 'PENDING') return '60%';
                           if (taskStatus?.status === 'FAILED') return '0%';
                           return '30%';
                         })()
                       }}>
                    {/* Shimmer effect */}
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {song.metadata?.description || "Generating your AI music..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const taskStatus = taskStatuses.get(song.taskId);
                      if (taskStatus?.status === 'SUCCESS') return 'Complete!';
                      if (taskStatus?.status === 'PENDING') return '~2-3 min';
                      if (taskStatus?.status === 'FAILED') return 'Failed';
                      return '~2-3 min';
                    })()}
                  </p>
                </div>
              </div>
            )}

            {/* NFT Actions - only show for completed songs */}
            {!song.id.startsWith('pending-') && song.audioUrl && (
              <div className="mt-3 pt-2 border-t border-white/10">
                <NFTActionButtons 
                  aiTrackId={song.id}
                  songData={{
                    title: song.title,
                    artist: song.artist || song.displayName,
                    imageUrl: song.imageUrl,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );

  const renderLibraryContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-glass-border/10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Library</h1>
          
          {/* Generation Status Indicator */}
          {isGenerating && currentTaskId && (
            <div className="flex items-center space-x-4 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 min-w-[300px]">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-blue-400">Generating Song...</span>
                <span className="text-xs text-blue-300/70 mb-2">
                  Task: {currentTaskId.slice(0, 8)}...{currentTaskId.slice(-6)}
                </span>
                {/* Progress Bar */}
                <div className="w-full bg-blue-500/20 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"
                       style={{width: '60%'}}></div>
                </div>
                <span className="text-xs text-blue-300/70 mt-1">~2-3 min remaining</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent border-b border-glass-border/20 rounded-none h-auto p-0 space-x-8">
            <TabsTrigger 
              value="songs" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              Songs
            </TabsTrigger>
            <TabsTrigger 
              value="nfts" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              NFTs
            </TabsTrigger>
            <TabsTrigger 
              value="playlists" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              Playlists
            </TabsTrigger>
            <TabsTrigger 
              value="liked-playlists" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              Liked Playlists
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              Following
            </TabsTrigger>
            <TabsTrigger 
              value="followers" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              Followers
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              In Progress ({pendingTasks?.size || 0})
            </TabsTrigger>
            <TabsTrigger
              value="debug"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              Debug
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Debug Info & Fetch Button */}
        {/* <div className="mt-4 p-4 bg-glass-card/50 rounded-lg border border-glass-border/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">
              <div>Task IDs: {userTaskIds?.length || 0}</div>
              <div>Songs: {generatedMusic.length}</div>
              <div>Status: {isFetchingSongs ? 'Fetching...' : 'Ready'}</div>
            </div>
            <Button
              onClick={() => fetchSongsFromSuno()}
              disabled={isFetchingSongs || !userTaskIds || userTaskIds.length === 0}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
            >
              {isFetchingSongs ? 'Fetching...' : 'Fetch Songs from Suno'}
            </Button>
          </div>
        </div> */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          {/* Songs Tab */}
          <TabsContent value="songs" className="h-full m-0">
            <div className="p-6 h-full flex flex-col">
              {/* Search and Actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                    🔽 Filters (3)
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      placeholder="Search by song name, style or lyrics"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-input/20 border-glass-border/30 text-white placeholder:text-white/50 w-80"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleUploadClick}
                    className="bg-primary/20 hover:bg-primary/30 text-white border border-primary/30"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Audio
                  </Button>
                  {/* <Button 
                    onClick={fetchSongsFromSuno}
                    disabled={isFetchingSongs}
                    className="bg-green-500/20 hover:bg-green-500/30 text-white border border-green-500/30 disabled:opacity-50"
                  >
                    {isFetchingSongs ? "Fetching..." : "🔄 Fetch from Suno"}
                  </Button> */}
                </div>
              </div>

              {/* Songs List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {!isConnected ? (
                  <div className="text-center py-12 text-white/70">
                    <p className="text-lg mb-2">🔗 Wallet Disconnected</p>
                    <p className="text-sm mb-4">Please connect your wallet to view and play your music</p>
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div className="text-center py-12 text-white/70">
                    {isLoadingCachedSongs || isFetchingSongs ? (
                      <div>
                        <p className="text-lg mb-2">🔄 Loading your song list</p>
                      </div>
                    ) : userTaskIds && userTaskIds.length > 0 ? (
                      <div>
                        <p className="text-lg mb-2">Songs available in contract</p>
                        <p className="text-sm mb-4">Found {userTaskIds.length} task ID(s). Click "Fetch from Suno" to load your songs.</p>
                        <Button
                          onClick={fetchSongsFromSuno}
                          className="bg-green-500/20 hover:bg-green-500/30 text-white border border-green-500/30"
                        >
                          🔄 Fetch your song
                        </Button>
                      </div>
                    ) : cachedSongsError ? (
                      <div>
                        <p className="text-lg mb-2">❌ Error loading cached songs</p>
                        <p className="text-sm mb-4">Failed to load songs from cache. Please try again.</p>
                        <Button
                          onClick={() => window.location.reload()}
                          className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30"
                        >
                          🔄 Reload Page
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg mb-2">No songs found</p>
                        <p className="text-sm">Generate some music to get started</p>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredSongs.map((song, index) => renderSongItem(song, index))
                )}
              </div>
            </div>
          </TabsContent>

          {/* NFTs Tab */}
          <TabsContent value="nfts" className="h-full m-0">
            <div className="p-6 h-full flex flex-col">
              {/* Search and Actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      placeholder="Search NFTs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-input/20 border-glass-border/30 text-white placeholder:text-white/50 w-80"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {filteredSongs.length} Songs Available
                  </Badge>
                </div>
              </div>

              {/* NFT Grid */}
              <div className="flex-1 overflow-y-auto">
                {!isConnected ? (
                  <div className="text-center py-12 text-white/70">
                    <p className="text-lg mb-2">🔗 Wallet Disconnected</p>
                    <p className="text-sm mb-4">Please connect your wallet to view and manage your NFTs</p>
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div className="text-center py-12 text-white/70">
                    <p className="text-lg mb-2">🎵 No Songs to Mint</p>
                    <p className="text-sm">Generate some music first to mint as NFTs</p>
                  </div>
                ) : (
                  <NFTGrid
                    songs={filteredSongs.map(song => ({
                      aiTrackId: song.id,
                      title: song.title,
                      artist: song.displayName || 'Unknown Artist',
                      imageUrl: song.imageUrl,
                      audioUrl: song.audioUrl,
                      genre: song.tags?.join(', ') || 'Music',
                      duration: song.duration,
                      createdAt: song.createdAt,
                    }))}
                    loading={isLoadingCachedSongs || isFetchingSongs}
                    emptyMessage="Create some songs to start minting NFTs"
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* In Progress Tab */}
          <TabsContent value="in-progress" className="h-full m-0">
            <div className="p-6 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold text-white">Songs In Progress</h2>
                  <Badge variant="secondary" className="text-xs">
                    {pendingTasks?.size || 0} generating
                  </Badge>
                </div>
                <Button 
                  onClick={checkAllPendingTasksStatus}
                  disabled={isFetchingSongs || !pendingTasks || pendingTasks.size === 0}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-white border border-blue-500/30"
                >
                  {isFetchingSongs ? "🔄 Checking..." : "🔍 Check Status"}
                </Button>
              </div>

              {/* In Progress Songs List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {!isConnected ? (
                  <div className="text-center py-12 text-white/70">
                    <p className="text-lg mb-2">🔗 Wallet Disconnected</p>
                    <p className="text-sm mb-4">Please connect your wallet to view generation progress</p>
                  </div>
                ) : !pendingTasks || pendingTasks.size === 0 ? (
                  <div className="text-center py-12 text-white/70">
                    <p className="text-lg mb-2">✨ No songs in progress</p>
                    <p className="text-sm">Your music generation requests will appear here</p>
                    {/* Debug info */}
                    <div className="mt-4 p-4 bg-white/5 rounded-lg text-xs">
                      <p>Debug Info:</p>
                      <p>User Task IDs: {userTaskIds?.length || 0}</p>
                      <p>Completed Task IDs: {userCompletedTaskIds?.length || 0}</p>
                      <p>Pending Tasks: {pendingTasks?.size || 0}</p>
                      <p>Task Statuses: {taskStatuses?.size || 0}</p>
                      {Array.from(taskStatuses.entries()).map(([taskId, status]) => (
                        <p key={taskId} className="ml-2">
                          {taskId.slice(0, 8)}...: {status.status} ({status.tracksCount} tracks)
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  Array.from(pendingTasks)
                    .filter((taskId) => {
                      // Don't show tasks that have actual songs (completed)
                      const hasActualSongs = generatedMusic.some(song => 
                        song.taskId === taskId && 
                        song.audioUrl && 
                        song.audioUrl !== "" && 
                        !song.audioUrl.includes('placeholder') && 
                        !song.id.startsWith('pending-')
                      );
                      return !hasActualSongs;
                    })
                    .map((taskId) => {
                    const taskStatus = taskStatuses.get(taskId);
                    const status = taskStatus?.status || 'UNKNOWN';
                    const hasData = taskStatus?.hasData || false;
                    const tracksCount = taskStatus?.tracksCount || 0;

                    // Determine status color and message
                    let statusColor = 'text-blue-400';
                    let statusBg = 'bg-blue-500/20';
                    let statusMessage = 'Checking status...';
                    let progressPercent = calculateProgress(taskId, status);

                    if (status === 'SUCCESS') {
                      statusColor = 'text-green-400';
                      statusBg = 'bg-green-500/20';
                      statusMessage = hasData ? `${tracksCount} track(s) ready` : 'Completed - processing data';
                      progressPercent = 100;
                    } else if (status === 'PENDING') {
                      statusColor = 'text-yellow-400';
                      statusBg = 'bg-yellow-500/20';
                      statusMessage = 'AI is generating...';
                    } else if (status === 'FAILED' || status === 'ERROR') {
                      statusColor = 'text-red-400';
                      statusBg = 'bg-red-500/20';
                      statusMessage = 'Generation failed';
                      progressPercent = 0;
                    }

                    return (
                      <GlassCard key={taskId} className="p-4">
                        <div className="flex items-center space-x-4">
                          {/* Status Icon */}
                          <div className={`relative w-12 h-12 rounded-lg bg-gradient-secondary flex-shrink-0 flex items-center justify-center ${statusBg} transition-all duration-500 hover:scale-105`}>
                            {status === 'SUCCESS' ? (
                              <div className="w-6 h-6 text-green-400 animate-bounce">✓</div>
                            ) : status === 'FAILED' || status === 'ERROR' ? (
                              <div className="w-6 h-6 text-red-400 animate-pulse">✗</div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            )}
                            {/* Progress ring overlay */}
                            {status !== 'SUCCESS' && status !== 'FAILED' && status !== 'ERROR' && (
                              <div className="absolute inset-0 rounded-lg border-2 border-blue-400/30 animate-ping"></div>
                            )}
                          </div>

                          {/* Song Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm text-white truncate">
                                  {status === 'SUCCESS' && hasData ? 'Generation Complete!' : 'Generating Song...'}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  Task ID: {taskId.slice(0, 8)}...{taskId.slice(-6)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className={`text-xs border ${statusColor} ${statusBg} transition-all duration-300 hover:scale-105`}>
                                  <div className={`w-2 h-2 rounded-full mr-1 ${status === 'SUCCESS' ? 'bg-green-400 animate-pulse' : status === 'FAILED' || status === 'ERROR' ? 'bg-red-400 animate-pulse' : 'bg-blue-400 animate-pulse'}`}></div>
                                  {status === 'SUCCESS' ? 'Complete' : status === 'PENDING' ? 'Generating' : status === 'FAILED' ? 'Failed' : 'Checking'}
                                </Badge>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Progress</span>
                                <span className="text-xs text-muted-foreground">{progressPercent}%</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div className={`h-2 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 to-purple-600 ${status === 'SUCCESS' ? 'animate-in fade-in-0 slide-in-from-left-2' : 'animate-pulse'}`}
                                     style={{width: `${progressPercent}%`}}>
                                  {/* Shimmer effect */}
                                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {statusMessage}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {status === 'SUCCESS' ? 'Ready to play' : getEstimatedTimeRemaining(taskId, status)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          {/* Debug Tab */}
          <TabsContent value="debug" className="h-full m-0">
            <div className="p-6 h-full">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Debug & Diagnostics</h2>
                  <p className="text-white/70 text-sm mb-6">
                    Test IPFS connectivity and troubleshoot NFT minting issues
                  </p>
                </div>

                <IPFSConnectionTest />

                <FactoryMintTest />
              </div>
            </div>
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="h-full m-0">
            <div className="p-6 h-full">
              {(!userPlaylists || userPlaylists.length === 0) ? (
                <div className="text-center py-12 text-white/70">
                  <p className="text-lg mb-2">No playlists created yet</p>
                  <p className="text-sm">Create your first playlist to organize your music</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPlaylists.map((playlist: any) => (
                    <GlassCard key={playlist.id || playlist.name} className="p-4 cursor-pointer hover:bg-white/5">
                      <h3 className="font-semibold text-white mb-2">{playlist.name}</h3>
                      <p className="text-sm text-white/70 mb-2">{playlist.description || "No description"}</p>
                      <p className="text-xs text-white/50">{playlist.songs ? playlist.songs.length : 0} songs</p>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="liked-playlists" className="h-full m-0">
            <div className="p-6 h-full text-center text-white/70">
              <p className="text-lg mb-2">No liked playlists yet</p>
              <p className="text-sm">Like playlists to see them here</p>
            </div>
          </TabsContent>

          <TabsContent value="following" className="h-full m-0">
            <div className="p-6 h-full text-center text-white/70">
              <p className="text-lg mb-2">Not following anyone yet</p>
              <p className="text-sm">Follow creators to see their latest music</p>
            </div>
          </TabsContent>

          <TabsContent value="followers" className="h-full m-0">
            <div className="p-6 h-full text-center text-white/70">
              <p className="text-lg mb-2">No followers yet</p>
              <p className="text-sm">Share your music to gain followers</p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="h-full m-0">
            <div className="p-6 h-full text-center text-white/70">
              <p className="text-lg mb-2">No listening history</p>
              <p className="text-sm">Your recently played music will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-6rem)]">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Library Content - Left Panel */}
        <ResizablePanel 
          defaultSize={(isDetailsPanelVisible || showPlaylistSidebar) ? 80 : 100} 
          minSize={60}
          className={`${(isDetailsPanelVisible || showPlaylistSidebar) ? 'border-r border-glass-border/10' : ''} overflow-hidden`}
        >
          <div className="h-full p-2">
            <div className="h-full rounded-lg border backdrop-blur-xl bg-glass/80 border-glass-border shadow-card">
              {renderLibraryContent()}
            </div>
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
