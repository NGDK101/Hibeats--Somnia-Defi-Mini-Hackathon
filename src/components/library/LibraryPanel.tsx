import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAccount } from "wagmi";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Play, Pause, MoreHorizontal, Download, Share, ExternalLink, Search, Filter, ChevronLeft, ChevronRight, ShoppingCart, Plus, ListMusic, List, Info, FileMusic, Music4, Coins, RefreshCw, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { usePlaylist } from "@/hooks/usePlaylist";
import { useNFTManager } from "@/hooks/useNFTManager";
import { useNFTOperations } from "@/hooks/useNFTOperations";
import { useMarketplace } from "@/hooks/useMarketplace";
import { notificationDeduplicationService } from "@/services/notificationDeduplicationService";
import { useFactoryMint } from "@/hooks/useFactoryMint";
import { parseEther } from "viem";
import { ipfsService } from "@/services/ipfsService";
import { GeneratedMusic } from "@/types/music";
import { NFTMintRoadmapModal } from "@/components/nft/NFTMintRoadmapModal";
import { NFTActionButtons } from "@/components/ui/NFTActionButtons";
import { CreateListingModal } from "@/components/marketplace/CreateListingModal";
import { SongInteractions } from "@/components/social/SongInteractions";
import { toast } from "sonner";

interface LibraryPanelProps {
  onSongSelect?: (song: GeneratedMusic) => void;
  title?: string;
}

export const LibraryPanel = ({ onSongSelect, title = "My Library Song" }: LibraryPanelProps = {}) => {
  const { address } = useAccount();

  // Debug flag - set to false to disable debug logging
  const DEBUG_NFT_MATCHING = false; // Disabled for production
  
  // Get context values - always call hooks at the top level
  const contextValue = useGeneratedMusicContext();
  const { playSong, currentSong, isPlayerVisible } = useMusicPlayerContext();
  const { userPlaylists, addTrackToPlaylist } = usePlaylist();

  // Handle context error gracefully without early return
  if (!contextValue) {
    return (
      <div className="p-6 text-center text-white/70">
        <p>Loading library...</p>
      </div>
    );
  }

  const { generatedMusic, checkMissingTask, pendingTasks, updateSongWithIPFS, userCompletedTaskIds, userTaskIds, debugContractData, refetchUserTaskIds, refetchUserCompletedTaskIds, forceRefreshAllData, isGenerating, currentTaskId, fetchSongsFromSuno, isFetchingSongs, forceRefresh, taskStatuses, markTaskAsCompleted } = contextValue;

  // Ensure taskStatuses is always available - wrapped in useMemo to fix ESLint warning
  const safeTaskStatuses = useMemo(() => taskStatuses || new Map(), [taskStatuses]);

  // All other hooks must be called at the top level
  const nftManager = useNFTManager();
  const factoryMint = useFactoryMint();
  const { allTracks } = useNFTOperations();
  const {
    listNFT,
    createAuction,
    cancelListing,
    getListing,
    makeOffer,
    acceptOffer,
    cancelOffer,
    isLoading: isMarketplaceLoading,
    userListings
  } = useMarketplace();

  // All useState hooks must be at the top level
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "listed" | "unlisted">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<GeneratedMusic | null>(null);
  const [isSongDetailsOpen, setIsSongDetailsOpen] = useState(false);
  const [selectedSongForDetails, setSelectedSongForDetails] = useState<GeneratedMusic | null>(null);
  const [isNFTMintDialogOpen, setIsNFTMintDialogOpen] = useState(false);
  const [selectedSongForMinting, setSelectedSongForMinting] = useState<GeneratedMusic | null>(null);
  const [isFactoryCompletionDialogOpen, setIsFactoryCompletionDialogOpen] = useState(false);
  const [selectedSongForCompletion, setSelectedSongForCompletion] = useState<GeneratedMusic | null>(null);
  const [requestId, setRequestId] = useState<string>("");
  const [isListingDialogOpen, setIsListingDialogOpen] = useState(false);
  const [isListingModalVisible, setIsListingModalVisible] = useState(false);
  const [selectedSongForListing, setSelectedSongForListing] = useState<GeneratedMusic | null>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [listingCategory, setListingCategory] = useState("Music");
  const [listingTags, setListingTags] = useState("");
  const [listingDuration, setListingDuration] = useState("");
  const [listingType, setListingType] = useState<"fixed" | "auction" | "offers">("fixed");
  const [reservePrice, setReservePrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"native" | "beats">("native");
  const [activeTab, setActiveTab] = useState<"set_price" | "auction" | "offers">("set_price");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerExpiration, setOfferExpiration] = useState("7");
  const [manualTaskId, setManualTaskId] = useState("");
  const [isCheckingTask, setIsCheckingTask] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [progressToastId, setProgressToastId] = useState<string | null>(null);
  const [localForceRefresh, setLocalForceRefresh] = useState(0);

  // Track shown toast notifications to prevent spam - DEPRECATED: Now using global service
  // const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());

  // useRef hooks must be at the top level
  const previousMusicCount = React.useRef(0);
  const previousLibraryPageCount = React.useRef(0);

  // Callback untuk menandai task sebagai completed saat NFT berhasil di-mint
  const handleNFTMinted = useCallback((taskId: string) => {
    if (markTaskAsCompleted && taskId) {
      markTaskAsCompleted(taskId);
    }
  }, [markTaskAsCompleted]);

  // Debug logging for allTracks data
  useEffect(() => {
    if (DEBUG_NFT_MATCHING) {
      if (allTracks && allTracks[1] && allTracks[1].length > 0) {
        // NFT tracks available
      } else {
        // No NFT tracks
      }
    }
  }, [allTracks]);

  const itemsPerPage = 4;

  // Close modal function
  const closeListingModal = () => {
    setIsListingDialogOpen(false);
    setSelectedSongForListing(null);
    setListingPrice("");
    setListingTags("");
    setListingCategory("Music");
    setListingDuration("");
    setListingType("fixed");
    setReservePrice("");
    setPaymentMethod("native");
    setActiveTab("set_price");
    setOfferAmount("");
    setOfferExpiration("7");
  };

  // Function to check if a song is already minted as NFT
  const isSongMinted = useCallback((song: GeneratedMusic) => {
    if (!allTracks || !allTracks[1] || allTracks[1].length === 0) return false;

    // allTracks is a tuple: [tokenIds[], tracks[]]
    // tracks[1] contains the TrackInfo array
    const tracks = allTracks[1];

    const isMinted = tracks.some((track: any) => {
      // Check if there's an NFT with matching taskId + version
      // Convert both to string and trim to handle any data type issues
      const trackTaskId = String(track.taskId || '').trim();

      // Create the expected NFT taskId format: "originalTaskId_version"
      const expectedNFTTaskId = song.version ? `${song.taskId}_${song.version}` : song.taskId;
      const songTaskId = String(expectedNFTTaskId || '').trim();

      const isMatch = trackTaskId === songTaskId && trackTaskId.length > 0;
      if (DEBUG_NFT_MATCHING && isMatch) {
          // Removed invalid object literal block after console.log deletion
      }
      return isMatch;
    });

    if (DEBUG_NFT_MATCHING) {
    }
    return isMinted;
  }, [allTracks]);

  // Function to get NFT token ID for a song
  const getNFTTokenId = useCallback((song: GeneratedMusic) => {
    if (!allTracks || !allTracks[0] || !allTracks[1] || allTracks[1].length === 0) return null;

    // allTracks is a tuple: [tokenIds[], tracks[]]
    const tokenIds = allTracks[0];
    const tracks = allTracks[1];

    const trackIndex = tracks.findIndex((track: any) => {
      const trackTaskId = String(track.taskId || '').trim();

      // Create the expected NFT taskId format: "originalTaskId_version"
      const expectedNFTTaskId = song.version ? `${song.taskId}_${song.version}` : song.taskId;
      const songTaskId = String(expectedNFTTaskId || '').trim();

      return trackTaskId === songTaskId && trackTaskId.length > 0;
    });

    if (trackIndex === -1) return null;

    const tokenId = tokenIds[trackIndex];
    if (DEBUG_NFT_MATCHING) {
    }
    return tokenId;
  }, [allTracks]);

  // Function to check if a song is already listed in marketplace
  const isSongListed = useCallback((song: GeneratedMusic) => {
    const tokenId = getNFTTokenId(song);
    if (!tokenId || !userListings) return false;

    return userListings.includes(BigInt(tokenId));
  }, [userListings, getNFTTokenId]);

  // Get listing type for a song
  const getListingType = useCallback((song: GeneratedMusic): string => {
    const tokenId = getNFTTokenId(song);
    if (!tokenId) return '';

    // For now, return a generic "Listed" text since we can't call hooks inside useCallback
    // We'll improve this later with proper state management
    return 'Listed';
  }, [getNFTTokenId]);

  // Handle create listing
  const handleCreateListing = async () => {
    if (!selectedSongForListing) {
      toast.error('Please select a song to list');
      return;
    }

    const tokenId = getNFTTokenId(selectedSongForListing);
    if (!tokenId) {
      toast.error('NFT token ID not found. Please ensure the song is minted as an NFT first.');
      return;
    }

    // Check if already listed
    if (isSongListed(selectedSongForListing)) {
      toast.error('This song is already listed in the marketplace');
      return;
    }

    try {
      // Validate duration
      if (!listingDuration || parseInt(listingDuration) < 1) {
        toast.error('Please enter a valid duration (minimum 1 day)');
        return;
      }

      const durationInSeconds = BigInt(parseInt(listingDuration) * 24 * 60 * 60);
      const tagsArray = listingTags.split(',').map(tag => tag.trim()).filter(tag => tag);

      if (activeTab === "set_price") {
        // Fixed price listing validation
        if (!listingPrice || parseFloat(listingPrice) <= 0) {
          toast.error('Please enter a valid price greater than 0');
          return;
        }

        if (parseFloat(listingPrice) < 0.001) {
          toast.error('Minimum listing price is 0.001 STT');
          return;
        }

        const priceInWei = parseEther(listingPrice);

        await listNFT({
          tokenId: BigInt(tokenId),
          price: priceInWei,
          isBeatsToken: paymentMethod === "beats",
          duration: durationInSeconds,
          category: listingCategory,
          tags: tagsArray.length > 0 ? tagsArray : (Array.isArray(selectedSongForListing.genre) ? selectedSongForListing.genre : ['Electronic'])
        });

        toast.success('Fixed price listing created successfully!');

      } else if (activeTab === "auction") {
        // Auction listing validation
        if (!listingPrice || parseFloat(listingPrice) <= 0) {
          toast.error('Please enter a valid starting price greater than 0');
          return;
        }

        if (parseFloat(listingPrice) < 0.001) {
          toast.error('Minimum starting price is 0.001 STT');
          return;
        }

        if (reservePrice && parseFloat(reservePrice) > 0 && parseFloat(reservePrice) <= parseFloat(listingPrice)) {
          toast.error('Reserve price must be higher than starting price');
          return;
        }

        const startPriceInWei = parseEther(listingPrice);
        const reservePriceInWei = reservePrice && parseFloat(reservePrice) > 0 ? parseEther(reservePrice) : startPriceInWei;

        await createAuction({
          tokenId: BigInt(tokenId),
          startPrice: startPriceInWei,
          reservePrice: reservePriceInWei,
          duration: durationInSeconds,
          isBeatsToken: paymentMethod === "beats",
          category: listingCategory
        });

        toast.success('Auction created successfully!');

      } else if (activeTab === "offers") {
        // Offers only validation
        toast.info('Offers functionality will be available soon!');
        return;
      }

      closeListingModal();

    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create listing');
    }
  };

  // Handle unlist NFT
  const handleUnlist = async (song: GeneratedMusic) => {
    const tokenId = getNFTTokenId(song);
    if (!tokenId) {
      toast.error('NFT token ID not found');
      return;
    }

    try {
      await cancelListing(BigInt(tokenId));
      toast.success('NFT unlisted successfully!');
      
      // Refresh user listings
      if (contextValue?.forceRefreshAllData) {
        contextValue.forceRefreshAllData();
      }
    } catch (error) {
      console.error('Error unlisting NFT:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unlist NFT');
    }
  };

  // Constants for pagination
  const itemsPerPage2 = 4;

  // Unified refresh function - combines all checking and refreshing operations
  const handleUnifiedRefresh = useCallback(async (showToast: boolean = true) => {
    if (isRefreshing) {
      if (showToast) toast.info("Already refreshing...");
      return;
    }

    try {
      setIsRefreshing(true);

      if (showToast) {
        toast.info("Refreshing library data...");
      }

      // Check pending tasks that are still generating/processing
      if (pendingTasks.size > 0) {
        for (const taskId of pendingTasks) {
          // Only check tasks that are still in PENDING status
          const taskStatus = safeTaskStatuses?.get(taskId);
          if (taskStatus?.status === 'PENDING' || !taskStatus) {
            await checkMissingTask(taskId);
          }
        }
      }

      // Refresh all data from blockchain and Suno API
      await forceRefreshAllData();

      // Update last refresh time
      setLastRefreshTime(new Date());

      if (showToast) {
        toast.success("Library refreshed successfully!");
      }

    } catch (error) {
      console.error('Unified refresh error:', error);
      if (showToast) {
        toast.error(`Refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, pendingTasks, safeTaskStatuses, checkMissingTask, forceRefreshAllData]);

  // Manual check for missing task
  const handleCheckMissingTask = async (taskId: string) => {
    if (!taskId.trim()) {
      toast.error("Please enter a valid Task ID");
      return;
    }

    setIsCheckingTask(true);
    try {
      // Checking missing task
      await checkMissingTask(taskId);
      toast.success(`Checked task ${taskId} successfully`);
      // Clear the input after successful check
      setManualTaskId("");
    } catch (error) {
      console.error("Failed to check missing task:", error);
      toast.error(`Failed to check task: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCheckingTask(false);
    }
  };

  // Update currentPlaying when music player song changes
  useEffect(() => {
    setCurrentPlaying(currentSong?.id || null);
  }, [currentSong]);

  // Force re-render ketika generatedMusic berubah
  useEffect(() => {
    // Smart logging to avoid spam
    const musicCount = generatedMusic.length;
    const completedCount = generatedMusic.filter(song =>
      song.audioUrl && song.audioUrl !== "" && !song.audioUrl.includes('placeholder') && !song.id.startsWith('pending-')
    ).length;
    const pendingCount = pendingTasks.size;


    // Log detailed song info for debugging
    if (musicCount > 0) {
      //   id: song.id,
      //   title: song.title,
      //   taskId: song.taskId,
      //   hasAudio: !!song.audioUrl,
      //   isPending: song.id.startsWith('pending-')
      // })));
    }

    if (pendingCount > 0) {
    }
  }, [generatedMusic.length, generatedMusic, pendingTasks.size]);

  // Handle "Creating your AI music..." toast - same logic as "Generating Song..."
  useEffect(() => {
    if (isGenerating && currentTaskId && !progressToastId) {
      // Create unique toast ID to prevent conflicts
      const uniqueToastId = `ai-music-creation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Show initial loading toast that will be updated throughout the process
      toast.loading("Generating Song...", {
        id: uniqueToastId,
        description: "AI generation in progress...",
      });
      
      // Store unique toast ID for real-time updates
      setProgressToastId(uniqueToastId);
    } else if (!isGenerating && progressToastId) {
      // Clear the toast when generation is complete
      toast.dismiss(progressToastId);
      setProgressToastId(null);
    }
  }, [isGenerating, currentTaskId, progressToastId]);

  // Update toast based on task status - same logic as "Generating Song..."
  useEffect(() => {
    if (currentTaskId && progressToastId) {
      const taskStatus = safeTaskStatuses?.get(currentTaskId);
      
      if (taskStatus) {
        if (taskStatus.status === 'SUCCESS' && taskStatus.hasData) {
          // Show success toast only if not already shown for this task using global service
          // Use same 'completion' type as useGeneratedMusic to prevent duplicate alerts
          if (notificationDeduplicationService.shouldShowNotification(currentTaskId, 'completion')) {
            toast.success("AI Music Creation Complete!", {
              description: `${taskStatus.tracksCount} track(s) successfully created`,
              duration: 5000
            });

            // Mark this toast as shown using global service
            notificationDeduplicationService.markAsShown(currentTaskId, 'completion');
          }

          toast.dismiss(progressToastId);
          setProgressToastId(null);
        } else if (taskStatus.status === 'PENDING') {
          // Update loading toast with progress
          const progressPercent = 60; // Default progress for pending
          toast.loading("Generating Song...", {
            id: progressToastId,
            description: `AI generation in progress... (${progressPercent}% complete)`,
          });
        } else if (taskStatus.status === 'FAILED') {
          // Show error toast
          toast.error("AI Music Creation Failed", {
            id: progressToastId,
            description: "Failed to create your AI music"
          });
          setProgressToastId(null);
        }
      }
    }
  }, [taskStatuses, currentTaskId, progressToastId]);

  // Simple auto-refresh mechanism - runs every 2 minutes without UI clutter
  useEffect(() => {
    if (pendingTasks.size === 0) return;

    // Set up simple interval for periodic refresh (every 2 minutes)
    const intervalId = setInterval(() => {
      // Only refresh automatically if there are pending tasks and page is visible
      if (document.visibilityState === 'visible') {
        handleUnifiedRefresh(false); // Don't show toast for auto-refresh
      }
    }, 120000); // 2 minutes

    // Cleanup interval
    return () => clearInterval(intervalId);
  }, [pendingTasks.size, handleUnifiedRefresh]);

  // Page visibility detection for refresh optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pendingTasks.size > 0) {
        // Trigger refresh when page becomes visible (without toast)
        handleUnifiedRefresh(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pendingTasks.size, handleUnifiedRefresh]);

  // Auto-refresh when new songs are generated (via callback success)
  useEffect(() => {
    // When generatedMusic changes and there are new completed songs, force refresh
    const hasNewCompletedSongs = generatedMusic.some(song =>
      !song.id.startsWith('pending-') &&
      song.audioUrl &&
      song.audioUrl !== "" &&
      !song.audioUrl.includes('placeholder')
    );

    if (hasNewCompletedSongs) {
      // Use a small delay to allow state updates to settle
      setTimeout(() => {
        handleUnifiedRefresh(false); // Silent refresh
      }, 1000);
    }
  }, [generatedMusic.length, generatedMusic, handleUnifiedRefresh]);

  // Clear toast tracking when user changes or component mounts
  useEffect(() => {
    // Clear notification deduplication when user changes to prevent stale state
    // notificationDeduplicationService.clearAll(); // Uncomment if needed for user switching
  }, [address]);

  // Watch for task status changes from PENDING to SUCCESS for auto-refresh
  useEffect(() => {
    const completedTasks = Array.from(safeTaskStatuses.entries())
      .filter(([taskId, status]) => status.status === 'SUCCESS' && status.hasData)
      .map(([taskId]) => taskId);

    if (completedTasks.length > 0) {
      setTimeout(() => {
        handleUnifiedRefresh(false); // Silent refresh with delay
      }, 2000);
    }
  }, [safeTaskStatuses, handleUnifiedRefresh]);

  // Auto-refresh when songs are successfully added via callback (from useGeneratedMusic)
  useEffect(() => {
    // Check if new non-pending songs were added
    if (generatedMusic.length > previousMusicCount.current) {
      const newSongs = generatedMusic.filter(song => !song.id.startsWith('pending-'));
      if (newSongs.length > 0) {
        setTimeout(() => {
          setLocalForceRefresh(prev => prev + 1); // Force UI re-render
          handleUnifiedRefresh(false); // Silent refresh
        }, 500);
      }
    }

    previousMusicCount.current = generatedMusic.length;
  }, [generatedMusic, handleUnifiedRefresh]);

  // Handle modal animation
  useEffect(() => {
    try {
      if (isListingDialogOpen) {
        setIsListingModalVisible(true);
        // Small delay to ensure DOM is ready before animation
        const showTimer = setTimeout(() => {
          if (document.body) {
            document.body.style.overflow = 'hidden';
          }
        }, 10);

        return () => {
          clearTimeout(showTimer);
        };
      } else {
        if (document.body) {
          document.body.style.overflow = '';
        }
        // Delay hiding the modal to allow close animation
        const hideTimer = setTimeout(() => {
          setIsListingModalVisible(false);
        }, 300);

        return () => {
          clearTimeout(hideTimer);
        };
      }
    } catch (error) {
      console.error('Error in modal animation effect:', error);
    }
  }, [isListingDialogOpen]);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      try {
        if (document.body) {
          document.body.style.overflow = '';
        }
      } catch (error) {
        console.error('Error in cleanup effect:', error);
      }
    };
  }, []);

  // Filter and search music - include pending tasks as placeholder songs
  const filteredMusic = useMemo(() => {

    // Create placeholder songs for ALL pending tasks that aren't already in generatedMusic
    const pendingPlaceholders: GeneratedMusic[] = [];
    const existingTaskIds = new Set(generatedMusic.map(song => song.taskId));

    // Create placeholders for all pending tasks, not just currentTaskId
    for (const taskId of pendingTasks) {
      if (!existingTaskIds.has(taskId)) {
        // Get task status for progress information
        const taskStatus = safeTaskStatuses?.get(taskId);

        // Only create placeholder if task is NOT already SUCCESS with data
        if (!(taskStatus?.status === 'SUCCESS' && taskStatus?.hasData)) {
          const progressPercent = taskStatus?.status === 'SUCCESS' ? 100 :
                                 taskStatus?.status === 'PENDING' ? 60 :
                                 taskStatus?.status === 'FAILED' ? 0 : 30;

          // Create 2 placeholder songs for each pending task
          for (let i = 1; i <= 2; i++) {
            const isCurrentTask = taskId === currentTaskId;
            const placeholderSong: GeneratedMusic = {
              id: `pending-${taskId}-${i}`,
              taskId: taskId,
              title: taskStatus?.status === 'SUCCESS' && taskStatus?.hasData ?
                     `Generation Complete! (${i}/2)` :
                     isCurrentTask ? `Generating Song... (${i}/2)` : `In Progress... (${i}/2)`,
              artist: "HiBeats AI",
              audioUrl: "",
              imageUrl: taskStatus?.status === 'SUCCESS' && taskStatus?.hasData ?
                       "https://via.placeholder.com/400x400/22c55e/ffffff?text=Complete!" :
                       isCurrentTask ?
                       "https://via.placeholder.com/400x400/3b82f6/ffffff?text=Generating..." :
                       "https://via.placeholder.com/400x400/f59e0b/ffffff?text=In+Progress...",
              duration: 0,
              genre: ["AI Generated"],
              createdAt: new Date().toISOString(),
              metadata: {
                name: "AI Generated Music",
                description: taskStatus?.status === 'SUCCESS' && taskStatus?.hasData ?
                           `Your song ${i} is complete!` :
                           isCurrentTask ?
                           `AI is generating your music... (${progressPercent}% complete)` :
                           `Music generation in progress... (${progressPercent}% complete)`,
                image: "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music",
                external_url: "",
                attributes: [
                  { trait_type: "Type", value: "AI Generated" },
                  { trait_type: "Status", value: "Generating" }
                ],
                audio_url: "",
                duration: 0,
                genre: ["AI Generated"],
                created_by: address || "Unknown",
                model_used: "AI Music Generator",
                generation_date: new Date().toISOString(),
                prompt: taskStatus?.status === 'SUCCESS' && taskStatus?.hasData ?
                       "Generation completed successfully!" :
                       "Generating..."
              }
            };
            pendingPlaceholders.push(placeholderSong);
          }
        }
      }
    }

    // Combine generated music with pending placeholders
    const allMusic = [...generatedMusic, ...pendingPlaceholders];

    // Debug logging untuk contract data

    // Sort: pending tasks first, then completed songs by creation date
    return allMusic
      .filter((song) => {
        // VALIDATION: Hanya tampilkan lagu yang taskId-nya TERDAFTAR di contract
        const isTaskIdValid = userTaskIds && userTaskIds.includes(song.taskId);
        const isCompletedInContract = userCompletedTaskIds && userCompletedTaskIds.includes(song.taskId);
        const isPending = pendingTasks instanceof Set ? pendingTasks.has(song.taskId) : false;
        const isPlaceholder = song.id.startsWith('pending-');

        // Always show placeholders for any pending task
        if (isPlaceholder) {
          return true;
        }

        // VALIDATION UTAMA: TaskId harus terdaftar di contract
        if (!isTaskIdValid && !isCompletedInContract) {
          return false;
        }

        // Check if song has actual content (completed songs)
        const hasActualContent = song.audioUrl && song.audioUrl !== "" && !song.audioUrl.includes('placeholder');

        // Show songs that are:
        // - TaskId VALID di contract (blockchain recorded) OR
        // - Have actual audio content OR
        // - Are completed tasks in contract
        const shouldShow = isTaskIdValid || hasActualContent || isCompletedInContract;


        const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             song.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             song.genre.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === "all" ||
                             (statusFilter === "listed" && song.ipfsHash && song.ipfsHash.trim() !== "") ||
                             (statusFilter === "unlisted" && (!song.ipfsHash || song.ipfsHash.trim() === ""));

        const result = shouldShow && matchesSearch && matchesStatus;
        return result;
      })
      .sort((a, b) => {
        // Sort by priority: pending tasks first, then newly completed songs, then other completed songs by creation date
        const aIsPending = a.id.startsWith('pending-') || (pendingTasks instanceof Set ? pendingTasks.has(a.taskId) : false);
        const bIsPending = b.id.startsWith('pending-') || (pendingTasks instanceof Set ? pendingTasks.has(b.taskId) : false);

        // Placeholder untuk currentTaskId selalu di atas (prioritas tertinggi)
        const aIsCurrentPlaceholder = a.id.startsWith('pending-') && a.taskId === currentTaskId;
        const bIsCurrentPlaceholder = b.id.startsWith('pending-') && b.taskId === currentTaskId;

        if (aIsCurrentPlaceholder && !bIsCurrentPlaceholder) return -1;
        if (!aIsCurrentPlaceholder && bIsCurrentPlaceholder) return 1;

        // Pending tasks (yang bukan current placeholder) ditempatkan di atas completed songs
        if (aIsPending && !bIsPending) return -1;
        if (!aIsPending && bIsPending) return 1;

        // Untuk pending tasks yang sama levelnya, sort by taskId first, then by song number
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

        // Untuk completed songs, prioritaskan yang baru saja selesai berdasarkan taskId di userCompletedTaskIds
        const aIsNewlyCompleted = userCompletedTaskIds && userCompletedTaskIds.includes(a.taskId) && !a.id.startsWith('pending-');
        const bIsNewlyCompleted = userCompletedTaskIds && userCompletedTaskIds.includes(b.taskId) && !b.id.startsWith('pending-');

        if (aIsNewlyCompleted && !bIsNewlyCompleted) return -1;
        if (!aIsNewlyCompleted && bIsNewlyCompleted) return 1;

        // Jika keduanya newly completed atau tidak, sort by creation date (newest first) - PRIORITAS UTAMA
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();

        // Handle invalid dates
        if (isNaN(aDate) && isNaN(bDate)) return 0;
        if (isNaN(aDate)) return 1; // a is invalid, b comes first
        if (isNaN(bDate)) return -1; // b is invalid, a comes first

        // Newest first: higher timestamp comes first
        return bDate - aDate;
      });
  }, [generatedMusic, searchQuery, statusFilter, userTaskIds, pendingTasks, userCompletedTaskIds, forceRefresh, localForceRefresh]);

  // Pagination
  const totalPages = Math.ceil(filteredMusic.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMusic = filteredMusic.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const togglePlay = (song: any) => {
    // Library play button clicked
    
    if (currentPlaying === song.id) {
      // If same song is playing, let the music player handle it
      // Same song clicked, delegating to player
      return;
    } else {
      // Play new song with entire filtered playlist
      // Playing new song with playlist
      playSong(song, filteredMusic);
      setCurrentPlaying(song.id);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openIPFS = (hash?: string) => {
    if (hash) {
      window.open(`https://gateway.pinata.cloud/ipfs/${hash}`, '_blank');
    }
  };

  const handleAddToPlaylist = (song: GeneratedMusic) => {
    setSelectedSongForPlaylist(song);
    setIsPlaylistDialogOpen(true);
  };

  const handleAddToQueue = (song: GeneratedMusic) => {
    // Add to music player queue
    playSong(song, [song]);
    // Added to queue
  };

  // Complete music generation through Factory contract and mint NFT
  const handleCompleteMusicGeneration = async (song: GeneratedMusic, requestId: number) => {
    toast.info("🎉 Music generation completion is automatic! Rewards are given immediately on generation request.");
    toast.info("💡 You can now mint this song as NFT directly using the mint button.");
    return;
  };

  const handleMintNFT = async (song: GeneratedMusic) => {
    if (!song.metadata) {
      toast.error("Song metadata is required for minting NFT");
      return;
    }

    try {
      toast.info(`Uploading "${song.title}" to IPFS...`);
      
      // Upload audio file to IPFS
      const audioResponse = await ipfsService.uploadFromUrl(
        song.audioUrl,
        `${song.title.replace(/\s+/g, "_")}_${song.id}.mp3`,
        'audio'
      );
      
      // Upload image file to IPFS
      const imageResponse = await ipfsService.uploadFromUrl(
        song.imageUrl,
        `${song.title.replace(/\s+/g, "_")}_${song.id}_cover.jpg`,
        'image'
      );
      
      // Create updated metadata with IPFS URLs
      const ipfsMetadata = {
        ...song.metadata,
        image: `ipfs://${imageResponse.IpfsHash}`,
        external_url: `https://gateway.pinata.cloud/ipfs/${audioResponse.IpfsHash}`,
        audio_url: `ipfs://${audioResponse.IpfsHash}`,
        attributes: [
          ...(song.metadata.attributes || []),
          { trait_type: "Audio IPFS", value: audioResponse.IpfsHash },
          { trait_type: "Image IPFS", value: imageResponse.IpfsHash }
        ]
      };
      
      // Upload metadata to IPFS
      const metadataResponse = await ipfsService.uploadMetadata(ipfsMetadata);
      
      toast.success("Files uploaded to IPFS! Now minting NFT...");
      
      // Mint NFT via Factory (no authorization required)
      await nftManager.handleAction('mint', {
        aiTrackId: song.id,
        songData: {
          title: song.title || `Song ${song.id}`,
          artist: song.artist || 'AI Generated',
          imageUrl: song.imageUrl,
          audioUrl: song.audioUrl,
          genre: song.genre.join(", "),
          duration: song.duration,
          prompt: song.metadata?.description || "",
          modelUsed: song.metadata?.model_used || "unknown",
          taskId: song.taskId || "",
          createdAt: song.createdAt || new Date().toISOString(),
        }
      });
      
      // Update song with IPFS hash
      updateSongWithIPFS(song.id, metadataResponse.IpfsHash, ipfsMetadata);
      
      toast.success(`NFT minted successfully for "${song.title}"!`);
      
      // Mark task as completed since NFT was successfully minted
      if (song.taskId) {
        handleNFTMinted(song.taskId);
      }
      
    } catch (error) {
      console.error("Error minting NFT:", error);
      toast.error(`Failed to mint NFT: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleShowSongDetails = (song: GeneratedMusic) => {
    setSelectedSongForDetails(song);
    setIsSongDetailsOpen(true);
  };

  const handleShare = (song: GeneratedMusic) => {
    // Use original URL for sharing if available (more reliable for external sharing)
    const shareUrl = song.originalAudioUrl || song.audioUrl;
    
    if (navigator.share) {
      navigator.share({
        title: song.title,
        text: `Check out this AI-generated song: ${song.title} by ${song.artist}`,
        url: shareUrl,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      // Song URL copied to clipboard
    }
  };

  const handleDownload = async (song: GeneratedMusic, format: 'mp3' | 'wav' = 'mp3') => {
    if (format === 'wav') {
      // WAV download coming soon
      return;
    }
    
    try {
      // Starting download for
      
      // Try IPFS URL first, fallback to original URL if available
      let downloadUrl = song.audioUrl;
      if (song.audioUrl.includes('gateway.pinata.cloud') && song.originalAudioUrl && song.originalAudioUrl !== song.audioUrl) {
        // Using original audio URL for download
        downloadUrl = song.originalAudioUrl;
      }
      
      // Fetch the audio file
      const response = await fetch(downloadUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'audio/*',
        }
      });
      
      if (!response.ok) {
        // If IPFS URL failed and we have original URL, try original URL
        if (downloadUrl === song.audioUrl && song.originalAudioUrl && song.originalAudioUrl !== song.audioUrl) {
          // IPFS download failed, trying original URL for
          const fallbackResponse = await fetch(song.originalAudioUrl, {
            mode: 'cors',
            headers: {
              'Accept': 'audio/*',
            }
          });
          if (fallbackResponse.ok) {
            const blob = await fallbackResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${song.title} - ${song.artist}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            // Download completed for
            return;
          }
        }
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${song.title} - ${song.artist}.mp3`;
      
      // Add to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
      
      // Download completed for
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to opening in new tab if direct download fails
      const fallbackUrl = song.originalAudioUrl || song.audioUrl;
      window.open(fallbackUrl, '_blank');
    }
  };


  const handleOpenFactoryCompletion = (song: GeneratedMusic) => {
    setSelectedSongForCompletion(song);
    setIsFactoryCompletionDialogOpen(true);
    setRequestId(""); // Reset request ID
  };

  const handleFactoryCompletionSubmit = async () => {
    if (!selectedSongForCompletion || !requestId.trim()) {
      toast.error("Please enter a valid request ID");
      return;
    }

    const numericRequestId = parseInt(requestId.trim());
    if (isNaN(numericRequestId) || numericRequestId <= 0) {
      toast.error("Request ID must be a positive number");
      return;
    }

    await handleCompleteMusicGeneration(selectedSongForCompletion, numericRequestId);
    
    // Close dialog
    setIsFactoryCompletionDialogOpen(false);
    setSelectedSongForCompletion(null);
    setRequestId("");
  };

  // Load playlists on component mount
  useEffect(() => {
    // Playlists are now loaded automatically by the usePlaylist hook
  }, []);

  return (
    <GlassCard 
      className="p-3 h-full flex flex-col"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(220, 20%, 20%) transparent'
      }}
    >
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 px-2 pt-2 pb-1 border-b border-glass-border/20 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>
              {filteredMusic.length} song{filteredMusic.length !== 1 ? 's' : ''}
              {pendingTasks.size > 0 && (
                <span className="text-blue-400 ml-1">
                  ({pendingTasks.size} gen • {filteredMusic.filter(song => song.id.startsWith('pending-')).length} prog)
                </span>
              )}
            </span>
            {currentTaskId && (
              <span className="text-purple-400">
                • {currentTaskId.slice(0, 6)}...
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnifiedRefresh(true)}
              disabled={isRefreshing || isFetchingSongs}
              className="h-6 px-2 text-xs bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 ml-2"
            >
              {(isRefreshing || isFetchingSongs) ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
              ) : (
                <RefreshCw className="w-3 h-3 mr-1" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, or genre..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="pl-10 bg-input/50 border-glass-border focus:border-primary/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: "all" | "listed" | "unlisted") => {
          setStatusFilter(value);
          setCurrentPage(1); // Reset to first page when filtering
        }}>
          <SelectTrigger className="w-[180px] bg-input/50 border-glass-border">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Songs</SelectItem>
            <SelectItem value="listed">Listed (IPFS)</SelectItem>
            <SelectItem value="unlisted">Unlisted</SelectItem>
          </SelectContent>
        </Select>

        {/* Auto-refresh info - REMOVED */}
        {/* Manual Task Check - REMOVED */}
      </div>

      {/* Results Info */}
      {filteredMusic.length > 0 && (
        <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground">
          <span>
            {startIndex + 1}-{Math.min(endIndex, filteredMusic.length)} of {filteredMusic.length}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center space-x-0.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center px-1.5 py-0.5 text-xs h-6"
              >
                <ChevronLeft className="w-2.5 h-2.5" />
              </Button>
              
              <div className="flex space-x-0.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="w-5 h-5 p-0 text-xs"
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center px-1.5 py-0.5 text-xs h-6"
              >
                <ChevronRight className="w-2.5 h-2.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {currentMusic.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {filteredMusic.length === 0 && generatedMusic.length === 0 ? (
              userTaskIds && userTaskIds.length > 0 ? (
                <div>
                  <p className="text-lg mb-2">Songs available in contract</p>
                  <p className="text-sm mb-4">Found {userTaskIds.length} task ID(s). Click "Fetch from Suno" to load your songs.</p>
                  <Button
                    onClick={fetchSongsFromSuno}
                    disabled={isFetchingSongs}
                    className="bg-green-500/20 hover:bg-green-500/30 text-white border border-green-500/30"
                  >
                    {isFetchingSongs ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Fetching...
                      </>
                    ) : (
                      <>
                        🔄 Fetch from Suno
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-lg mb-2">No songs generated yet</p>
                  <p className="text-sm">Use the Create tab to create your first AI song</p>
                </>
              )
            ) : (() => {
              const hasGeneratingSongs = filteredMusic.some(song => 
                song.id.startsWith('pending-') || (pendingTasks instanceof Set ? pendingTasks.has(song.taskId) : false)
              );
              const hasCompletedSongs = filteredMusic.some(song => 
                !song.id.startsWith('pending-') && !(pendingTasks instanceof Set ? pendingTasks.has(song.taskId) : false)
              );
              
              if (hasGeneratingSongs && !hasCompletedSongs && filteredMusic.length > 0) {
                return (
                  <>
                    <p className="text-lg mb-2">All songs are being generated</p>
                    <p className="text-sm">Your AI music is being created. Each generation creates 2 songs. Please wait...</p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </>
                );
              } else {
                return (
                  <>
                    <p className="text-lg mb-2">No songs match your filters</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </>
                );
              }
            })()}
          </div>
        ) : (
          currentMusic.map((song) => (
            <div key={song.id} className="group">
              <GlassCard 
                className={cn(
                  "p-2 transition-all duration-500",
                  song.id.startsWith('pending-') 
                    ? "cursor-not-allowed opacity-75 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-400/20 animate-pulse" 
                    : "cursor-pointer hover:bg-white/5 animate-in fade-in-0 slide-in-from-bottom-2 duration-700"
                )} 
                onClick={() => {
                  if (!song.id.startsWith('pending-')) {
                    onSongSelect?.(song);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  {/* Album Cover */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-secondary flex-shrink-0">
                    {song.id.startsWith('pending-') ? (
                      // Loading animation for pending tasks
                      <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <img
                        src={song.imageUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // Try fallback to original URL if this is an IPFS URL and we have original URL
                          if (song.imageUrl.includes('gateway.pinata.cloud') && song.originalImageUrl && song.originalImageUrl !== song.imageUrl) {
                            // Trying original image URL as fallback for
                            target.src = song.originalImageUrl;
                          } else {
                            // Final fallback to placeholder
                            target.src = "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=" + encodeURIComponent(song.title || "Music");
                          }
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                      {!song.id.startsWith('pending-') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 rounded-full bg-white/90 hover:bg-white text-black hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100"
                          onClick={() => togglePlay(song)}
                        >
                          <div className="text-black">
                            {currentPlaying === song.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </div>
                        </Button>
                      )}
                      {song.id.startsWith('pending-') && (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <h3 className={cn(
                          "font-medium text-xs truncate",
                          song.id.startsWith('pending-') ? "text-blue-400" :
                          currentPlaying === song.id ? "text-green-400" : "text-foreground"
                        )}>
                          {song.title} {song.version && DEBUG_NFT_MATCHING ? `(${song.version})` : ''}
                        </h3>
                        {song.id.startsWith('pending-') && (
                          <div className="flex items-center gap-1 ml-2">
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-0.5">
                        {!song.id.startsWith('pending-') && (
                          <>
                            <SongInteractions songId={song.id} compact />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110"
                              onClick={() => handleDownload(song, 'mp3')}
                            >
                              <Download className="w-3 h-3 text-white hover:text-white/80" />
                            </Button>
                            <div className="h-6">
                              <NFTActionButtons
                                aiTrackId={song.id}
                                size="sm"
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
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-110 text-white"
                              disabled={song.id.startsWith('pending-')}
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
                              onClick={() => handleAddToPlaylist(song)}
                              disabled={song.id.startsWith('pending-')}
                            >
                              <Plus className="mr-3 h-4 w-4 text-white" />
                              <span className="font-medium">Add to Playlist</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                              onClick={() => handleMintNFT(song)}
                              disabled={nftManager.isLoading || !address || song.id.startsWith('pending-')}
                            >
                              <Coins className="mr-3 h-4 w-4 text-yellow-400" />
                              <span className="font-medium">
                                {nftManager.isLoading ? "Minting..." : "Mint as NFT"}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                              onClick={() => handleAddToQueue(song)}
                              disabled={song.id.startsWith('pending-')}
                            >
                              <List className="mr-3 h-4 w-4 text-white" />
                              <span className="font-medium">Add to Queue</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                              onClick={() => handleShowSongDetails(song)}
                              disabled={song.id.startsWith('pending-')}
                            >
                              <Info className="mr-3 h-4 w-4 text-white" />
                              <span className="font-medium">Song Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/20 my-2" />
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                              onClick={() => handleShare(song)}
                              disabled={song.id.startsWith('pending-')}
                            >
                              <Share className="mr-3 h-4 w-4 text-white" />
                              <span className="font-medium">Share</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-white/10 text-white rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-white/10"
                              onClick={() => handleDownload(song, 'mp3')}
                              disabled={song.id.startsWith('pending-')}
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
                            <DropdownMenuSeparator className="bg-white/20 my-2" />
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-green-500/20 text-green-300 rounded-lg px-3 py-2 transition-all duration-200 hover:scale-[1.02] focus:bg-green-500/20"
                              onClick={() => handleOpenFactoryCompletion(song)}
                              disabled={factoryMint.isLoading || !address || song.id.startsWith('pending-')}
                            >
                              <CheckCircle className="mr-3 h-4 w-4 text-green-400" />
                              <span className="font-medium">
                                {factoryMint.isLoading ? "Completing..." : "Complete Generation"}
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {song.id.startsWith('pending-') ? "HiBeats AI" : song.artist}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1">
                        {song.genre.slice(0, 2).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className={cn(
                              "text-xs px-1.5 py-0.5 transition-all duration-300",
                              song.id.startsWith('pending-') && "bg-blue-500/20 text-blue-300 border-blue-400/30 animate-pulse hover:scale-105"
                            )}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {song.ipfsHash && !song.id.startsWith('pending-') && (
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400/50 transition-all duration-300 hover:scale-105 animate-in fade-in-0 slide-in-from-right-2">
                            IPFS
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {(() => {
                          const isPending = pendingTasks instanceof Set ? pendingTasks.has(song.taskId) : false;
                          const isCompleted = song.audioUrl && song.audioUrl !== "" && !song.audioUrl.includes('placeholder') && !song.id.startsWith('pending-');
                          const isPlaceholder = song.id.startsWith('pending-');
                          const isCurrentTask = song.taskId === currentTaskId;

                          if (isPlaceholder && isCurrentTask) {
                            return (
                              <Badge
                                variant="outline"
                                className="text-xs text-blue-400 border-blue-400/50 animate-pulse"
                                title={`Generating music for task: ${song.taskId}`}
                              >
                                Generating
                              </Badge>
                            );
                          } else if (isPending && !isCurrentTask && !isCompleted) {
                            return (
                              <Badge
                                variant="outline"
                                className="text-xs text-yellow-400 border-yellow-400/50"
                                title={`Task ID: ${song.taskId} - Processing`}
                              >
                                Processing
                              </Badge>
                            );
                          } else if (isPending && isCurrentTask) {
                            return (
                              <Badge
                                variant="outline"
                                className="text-xs text-purple-400 border-purple-400/50 animate-pulse"
                                title={`Current task: ${song.taskId}`}
                              >
                                Current
                              </Badge>
                            );
                          }
                        })()}
                      </div>
                    </div>

                    {/* Progress Bar for Pending Songs */}
                    {song.id.startsWith('pending-') && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Progress</span>
                          <span className="text-xs text-muted-foreground">
                            {(() => {
                              const taskStatus = safeTaskStatuses?.get(song.taskId);
                              if (taskStatus?.status === 'SUCCESS') return '100% - Complete!';
                              if (taskStatus?.status === 'PENDING') return '~60% - Processing...';
                              if (taskStatus?.status === 'FAILED') return '0% - Failed';
                              return '~30% - Starting...';
                            })()}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out",
                            song.id.startsWith('pending-') ? "bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" : "bg-green-500 animate-in fade-in-0 slide-in-from-left-2"
                          )}
                               style={{
                                 width: (() => {
                                   const taskStatus = safeTaskStatuses?.get(song.taskId);
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
                              const taskStatus = safeTaskStatuses?.get(song.taskId);
                              if (taskStatus?.status === 'SUCCESS') return '🎉 Complete!';
                              if (taskStatus?.status === 'PENDING') return '~1-2 min remaining';
                              if (taskStatus?.status === 'FAILED') return '❌ Generation failed';
                              return '~2-3 min total';
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </GlassCard>
            </div>
          ))
        )}
      </div>

      {/* Playlist Dialog */}
      <Dialog open={isPlaylistDialogOpen} onOpenChange={setIsPlaylistDialogOpen}>
        <DialogContent className="bg-black/80 backdrop-blur-xl border border-white/20 max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Add to Playlist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSongForPlaylist && (
              <div className="flex items-center space-x-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <img
                  src={selectedSongForPlaylist.imageUrl}
                  alt={selectedSongForPlaylist.title}
                  className="w-12 h-12 rounded-lg object-cover shadow-lg"
                />
                <div>
                  <h4 className="font-semibold text-sm text-white">{selectedSongForPlaylist.title}</h4>
                  <p className="text-xs text-white/70">{selectedSongForPlaylist.artist}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/70">Select Playlist</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {userPlaylists.length === 0 ? (
                  <div className="text-center py-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <p className="text-sm text-white/70">
                      No playlists found. Create one first!
                    </p>
                  </div>
                ) : (
                  userPlaylists.map((playlistId) => (
                    <div
                      key={playlistId.toString()}
                      className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                      onClick={() => {
                        if (selectedSongForPlaylist) {
                          // For now, show message that NFT minting is needed first
                          toast.error("Please mint your song as an NFT first before adding to playlist");
                          setIsPlaylistDialogOpen(false);
                          setSelectedSongForPlaylist(null);
                        }
                      }}
                    >
                      <div>
                        <h4 className="font-semibold text-sm text-white group-hover:text-blue-300 transition-colors">Playlist #{playlistId.toString()}</h4>
                        <p className="text-xs text-white/70">
                          Loading song count...
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-white/70 group-hover:text-blue-300 transition-colors" />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPlaylistDialogOpen(false);
                  setSelectedSongForPlaylist(null);
                }}
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Song Details Dialog */}
      <Dialog open={isSongDetailsOpen} onOpenChange={setIsSongDetailsOpen}>
        <DialogContent className="bg-black/80 backdrop-blur-xl border border-white/20 max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Song Details
            </DialogTitle>
          </DialogHeader>
          {selectedSongForDetails && (
            <div className="space-y-6">
              {/* Song Cover and Basic Info */}
              <div className="flex items-start space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <img
                  src={selectedSongForDetails.imageUrl}
                  alt={selectedSongForDetails.title}
                  className="w-20 h-20 rounded-xl object-cover shadow-lg"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{selectedSongForDetails.title}</h3>
                  <p className="text-sm text-white/70 mb-3">{selectedSongForDetails.artist}</p>
                  <div className="flex items-center space-x-2 flex-wrap">
                    {selectedSongForDetails.genre.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Song Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <Label className="text-sm font-medium text-white/70 mb-2 block">Duration</Label>
                  <p className="text-sm text-white font-semibold">{formatDuration(selectedSongForDetails.duration)}</p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <Label className="text-sm font-medium text-white/70 mb-2 block">Status</Label>
                  <div className="flex items-center space-x-2">
                    {selectedSongForDetails.ipfsHash ? (
                      <Badge variant="outline" className="text-xs text-green-400 border-green-400/50 bg-green-400/10">
                        Listed (IPFS)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/50 bg-yellow-400/10">
                        Unlisted
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedSongForDetails.metadata?.description && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-white/70">Description</Label>
                  <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <p className="text-sm text-white leading-relaxed">
                      {selectedSongForDetails.metadata.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSongDetailsOpen(false);
                    setSelectedSongForDetails(null);
                  }}
                  className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (selectedSongForDetails) {
                      handleDownload(selectedSongForDetails, 'mp3');
                    }
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download MP3
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NFT Minting Roadmap Modal */}
      <NFTMintRoadmapModal
        isOpen={isNFTMintDialogOpen}
        onClose={() => {
          setIsNFTMintDialogOpen(false);
          setSelectedSongForMinting(null);
        }}
        selectedSong={selectedSongForMinting}
        onMintSuccess={(tokenId) => {
          setIsNFTMintDialogOpen(false);
          setSelectedSongForMinting(null);
          // Refresh the library to show updated NFT status
          handleUnifiedRefresh(false);
          // Also refresh NFT data to update the button state
          if (selectedSongForMinting?.taskId) {
            handleNFTMinted(selectedSongForMinting.taskId);
          }
          toast.success(`NFT minted successfully! Token ID: ${tokenId}`);
        }}
      />

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={isListingDialogOpen}
        onClose={closeListingModal}
        selectedSong={selectedSongForListing}
        tokenId={selectedSongForListing ? getNFTTokenId(selectedSongForListing) || BigInt(0) : BigInt(0)}
        onListingSuccess={() => {
          closeListingModal();
          // Refresh listings after successful listing
          if (contextValue?.forceRefreshAllData) {
            contextValue.forceRefreshAllData();
          }
        }}
      />
      
      {/* Factory Completion Dialog */}
      {isFactoryCompletionDialogOpen && selectedSongForCompletion && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4">
            <GlassCard className="p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Complete Generation</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFactoryCompletionDialogOpen(false)}
                  className="w-8 h-8 p-0 rounded-full hover:bg-white/10 text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="font-medium text-white mb-2">{selectedSongForCompletion.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete the music generation process and mint as NFT
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestId" className="text-sm font-medium text-white">
                    Request ID
                  </Label>
                  <Input
                    id="requestId"
                    value={requestId}
                    onChange={(e) => setRequestId(e.target.value)}
                    placeholder="Enter generation request ID"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    This should match the request ID from the music generation process
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={() => setIsFactoryCompletionDialogOpen(false)}
                  className="text-muted-foreground hover:text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleFactoryCompletionSubmit}
                  disabled={factoryMint.isLoading || !requestId.trim()}
                  className="bg-gradient-button hover:bg-gradient-button-hover text-black font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {factoryMint.isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      <span>Completing...</span>
                    </div>
                  ) : (
                    "Complete Generation"
                  )}
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>,
        document.body
      )}
      </div>
    </GlassCard>
  );
};