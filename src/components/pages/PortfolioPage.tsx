import { useState, useEffect, useMemo, useCallback } from "react";
import { useSocialContract } from '@/hooks/useSocialContract';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { NFTDetailPanel } from "@/components/details/NFTDetailPanel";
import { PortfolioAnalytics } from "@/components/portfolio/PortfolioAnalytics";
import { RealBlockchainActivity } from "@/components/portfolio/RealBlockchainActivity";
import { PortfolioPlaylist } from "@/components/portfolio/PortfolioPlaylist";
import { PortfolioSongs } from "@/components/portfolio/PortfolioSongs";
import { PortfolioActivitySimple } from "@/components/portfolio/PortfolioActivitySimple";
import { SocialProfileHeader } from "@/components/social/SocialProfileHeader";
import { FollowerList } from "@/components/social/FollowerList";
import {
  Music,
  Play,
  Pause,
  Users,
  MoreHorizontal,
  Heart,
  Share2,
  TrendingUp,
  Disc3,
  List,
  Filter,
  Grid3X3,
  Twitter,
  Instagram,
  Globe,
  AudioLines,
  Search,
  ShoppingCart,
  X
} from "lucide-react";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { useProfile } from "@/hooks/useProfile";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useSocial } from "@/hooks/useSocial";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { useNFTManager } from "@/hooks/useNFTManager";
import { NFTActionButtons } from "@/components/ui/NFTActionButtons";
import { GeneratedMusic } from "@/types/music";
import { useNFTOperations } from "@/hooks/useNFTOperations";
import { useSongStatus } from "@/hooks/useSongStatus";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useShannonExplorer } from "@/hooks/useShannonExplorer";
import { useMarketplace } from "@/hooks/useMarketplace";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useNFTListingData, useNFTListing } from "@/hooks/useNFTListingData";

interface PortfolioPageProps {
  onSongSelect?: (song: any) => void;
}

export const PortfolioPage = ({ onSongSelect }: PortfolioPageProps) => {
  const [activeTab, setActiveTab] = useState("songs");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);

  // Component error boundary with better error handling
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Portfolio Page Error:', error);
      setComponentError(error.message || 'An unexpected error occurred');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Portfolio Page Promise Rejection:', event.reason);
      setComponentError(`Promise rejection: ${event.reason?.message || 'Unknown error'}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  // Social states
  const [isFollowerListOpen, setIsFollowerListOpen] = useState(false);
  const [followerListType, setFollowerListType] = useState<'followers' | 'following'>('followers');


  const { generatedMusic, userCompletedTaskIds, userTaskIds } = useGeneratedMusicContext();
  const { playSong, currentSong } = useMusicPlayerContext();
  const { 
    userProfile: userProfileData, 
    createProfile, 
    hash: profileTxHash,
    isLoading: profileLoading,
    error: profileError,
    profileExists: hasProfileFromContract,
    forceRefresh: forceRefreshProfile
  } = useProfile();
  const { address } = useAccount();
  const nftManager = useNFTManager();
  
  // Social hooks
  const {
    getUserProfile,
    getProfileFromState,
    getSocialStats,
    followUser,
    unfollowUser,
    updateProfile,
    hasProfile,
    refreshProfileData,
    isLoading: socialLoading,
    transactionHash: updateTxHash
  } = useSocialContract();


  // Get NFT operations and data
  const { allTracks, userLibrary, userBalance } = useNFTOperations();

  // Wait for profile creation transaction to complete
  const { isSuccess: profileTxSuccess } = useWaitForTransactionReceipt({
    hash: profileTxHash,
  });

  // Wait for profile update transaction to complete
  const { isSuccess: updateTxSuccess } = useWaitForTransactionReceipt({
    hash: updateTxHash,
  });

  // Optimized profile refresh with reduced complexity
  const handleProfileTxSuccess = useCallback(async (isUpdate = false) => {
    // Dismiss any loading toasts
    toast.dismiss('profile-update');
    toast.dismiss('save-profile');

    // Show success notification
    toast.success(isUpdate ? '🎉 Profile updated successfully!' : '🎉 Profile created successfully!', {
      description: isUpdate ? 'Your changes have been saved to the blockchain.' : 'Your profile has been created and saved to the blockchain.',
      duration: 3000,
    });

    // Add delay to ensure blockchain state is updated
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Multiple refresh attempts with retry logic
    try {
      await refreshProfileData();

      // Additional delay and second refresh to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshProfileData();

    } catch (error) {
      console.error('❌ Profile refresh error:', error);

      // Retry once more after a delay
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refreshProfileData();
      } catch (retryError) {
        console.error('❌ Profile refresh retry failed:', retryError);
      }
    }
  }, [refreshProfileData]);

  // Combined useEffect for both profile creation and update
  useEffect(() => {
    if (profileTxSuccess && profileTxHash) {
      handleProfileTxSuccess(false);
    } else if (updateTxSuccess && updateTxHash) {
      handleProfileTxSuccess(true);
    }
  }, [profileTxSuccess, profileTxHash, updateTxSuccess, updateTxHash, handleProfileTxSuccess]);

  // Safety timeout to dismiss loading toasts if transaction takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      toast.dismiss('profile-update');
      toast.dismiss('save-profile');
    }, 30000); // 30 seconds timeout

    return () => clearTimeout(timer);
  }, [updateTxHash, profileTxHash]); // Reset timer when new transaction starts

  // Use analytics for real-time data
  const analytics = useAnalytics();

  // Use Shannon Explorer for real blockchain data
  const {
    userTransactions,
    nftTransfers,
    addressInfo,
    isLoading: explorerLoading,
    getNFTActivities,
    getRealPortfolioStats,
    formatValue,
    getTransactionUrl,
    getAddressUrl
  } = useShannonExplorer();

  // Use Marketplace for listing data
  const {
    userListings,
    getSongStatus,
    getListing,
    isLoading: marketplaceLoading
  } = useMarketplace();

  // Use NFT Listing Data hook for better data management
  const {
    listings: nftListings,
    getListingByTokenId,
    getUserActiveListings,
    isLoading: nftListingsLoading
  } = useNFTListingData();

  // Reduced debugging for performance (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && userListings) {
    }
  }, [userListings]);

  // Optimized minted song IDs computation
  const mintedSongIds = useMemo(() => {
    if (!allTracks) return new Set<string>();

    try {
      // Simplified structure checking
      let tracks: any[] = [];

      if (Array.isArray(allTracks)) {
        tracks = allTracks;
      } else if (allTracks[0] && Array.isArray(allTracks[0])) {
        tracks = allTracks[0];
      } else if (allTracks[1] && Array.isArray(allTracks[1])) {
        tracks = allTracks[1];
      }

      if (tracks.length === 0) return new Set<string>();

      // Optimized task ID extraction
      const taskIds = tracks
        .map(track => {
          const taskId = track?.taskId || track?.aiTrackId || track?.id || track?.sunoId;
          return taskId ? String(taskId).trim() : '';
        })
        .filter(Boolean);

      return new Set(taskIds);
    } catch (error) {
      console.error('Error processing minted song IDs:', error);
      return new Set<string>();
    }
  }, [allTracks]);

  // Helper function to get listing info for an NFT (REMOVED - causing async issues)
  // Moved logic to getListingInfoSync to prevent page crashes

  // Get real listing info from smart contract
  // Note: We'll primarily rely on userListings since it's already populated
  // and doing multiple useReadContract calls in render can cause performance issues

  // Optimized listing info cache
  const listingInfoCache = useMemo(() => new Map<string, any>(), [userListings]);

  // Enhanced function to get listing info with caching
  const getListingInfoEnhanced = useCallback((song: GeneratedMusic) => {
    const cacheKey = `${song.id}-${song.taskId}`;

    // Check cache first
    if (listingInfoCache.has(cacheKey)) {
      return listingInfoCache.get(cacheKey);
    }

    try {
      const result = getListingInfoSync(song);
      // Cache the result
      listingInfoCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error getting listing for "${song.title}":`, error);
      return null;
    }
  }, [listingInfoCache, userListings]);

  // Get listing info from userListings data
  const getListingInfoSync = useCallback((song: GeneratedMusic) => {
    try {
      // Check userListings data
      if (userListings && Array.isArray(userListings) && userListings.length > 0) {
        const listing = userListings.find((listing: any) => {
          try {
            // Try multiple matching strategies with more flexible matching
            const trackMatch = listing.aiTrackId && song.taskId &&
              String(listing.aiTrackId) === String(song.taskId);

            const songMatch = listing.songId && song.id &&
              String(listing.songId) === String(song.id);

            // Also try to match by title if no other match found
            const titleMatch = listing.title && song.title &&
              listing.title.toLowerCase() === song.title.toLowerCase();

            return trackMatch || songMatch || titleMatch;
          } catch (error) {
            return false;
          }
        });

        if (listing) {
          // Check if listing is active
          const isActive = listing.isActive === true || listing.isActive === 1;

          if (isActive && listing.price) {
            try {
              let price: number;
              let currency: string;

              // Handle different price formats
              let rawPrice = listing.price;
              if (typeof rawPrice === 'bigint') {
                rawPrice = Number(rawPrice);
              } else if (typeof rawPrice === 'string') {
                rawPrice = parseFloat(rawPrice);
              }

              if (listing.isBeatsToken) {
                // STT token
                price = rawPrice / 1e18;
                currency = 'STT';
              } else {
                // ETH
                price = rawPrice / 1e18;
                currency = 'ETH';
              }

              const result = {
                price: Math.max(0, price).toFixed(4),
                currency,
                isActive: isActive,
                isBeatsToken: listing.isBeatsToken || false,
                seller: listing.seller,
                listedAt: listing.listedAt || listing.timestamp || Date.now() / 1000,
                tokenId: listing.tokenId
              };

              return result;
            } catch (error) {
              // Silent error handling for performance
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error in getListingInfoSync:', error);
      return null;
    }
  }, [userListings]);

  const mintedSongs = useMemo(() => {
    if (!generatedMusic) return [];

    // Primary method: Use mintedSongIds from allTracks
    let songsFromAllTracks = generatedMusic.filter(song => {
      const baseTaskId = song.taskId;
      const versionTaskId = song.version ? `${song.taskId}_${song.version}` : song.taskId;
      return mintedSongIds.has(baseTaskId) || mintedSongIds.has(versionTaskId);
    });

    // Fallback method 1: Use userLibrary if allTracks method returns empty but userBalance > 0
    if (songsFromAllTracks.length === 0 && userBalance && Number(userBalance) > 0 && userLibrary) {

      // Extract task IDs from userLibrary
      let libraryTaskIds = new Set<string>();
      if (Array.isArray(userLibrary)) {
        libraryTaskIds = new Set(
          userLibrary.map((item: any) => {
            const taskId = item.taskId || item.aiTrackId || item.id || item.sunoId;
            return String(taskId || '').trim();
          }).filter(id => id.length > 0)
        );
      }


      songsFromAllTracks = generatedMusic.filter(song => {
        const baseTaskId = song.taskId;
        const versionTaskId = song.version ? `${song.taskId}_${song.version}` : song.taskId;
        return libraryTaskIds.has(baseTaskId) || libraryTaskIds.has(versionTaskId);
      });
    }

    // Fallback method 2: If still no results, try to find NFTs by checking if userBalance > 0
    // and assume the first few songs might be minted (this is just for troubleshooting)
    if (songsFromAllTracks.length === 0 && userBalance && Number(userBalance) > 0) {

      // Show first song(s) up to userBalance count as NFTs for debugging
      const possibleNFTCount = Math.min(Number(userBalance), generatedMusic.length);
      songsFromAllTracks = generatedMusic.slice(0, possibleNFTCount);
    }

    return songsFromAllTracks;
  }, [generatedMusic, mintedSongIds, userBalance, userLibrary]);

  const unmintedSongs = useMemo(() => {
    if (!generatedMusic) return [];

    return generatedMusic.filter(song => {
      // Check both the direct taskId and the version-specific taskId format
      const baseTaskId = song.taskId;
      const versionTaskId = song.version ? `${song.taskId}_${song.version}` : song.taskId;

      return !mintedSongIds.has(baseTaskId) && !mintedSongIds.has(versionTaskId);
    });
  }, [generatedMusic, mintedSongIds]);

  // Move debug logging after userProfile is defined
  
  // Use the new portfolio hook
  const {
    portfolioItems,
    portfolioStats,
    isLoading,
    filters,
    updateFilters,
    getPerformanceData
  } = usePortfolio();

  // Get real portfolio stats from blockchain with error handling
  const [realStats, setRealStats] = useState<any>(null);
  useEffect(() => {
    if (address) {
      getRealPortfolioStats(address)
        .then(stats => {
          if (stats) {
            setRealStats(stats);
          }
        })
        .catch(error => {
          // Set fallback/mock stats to prevent crashes
          setRealStats({
            totalValue: '0.00',
            totalNFTs: mintedSongs.length,
            totalTrades: 0,
            volume24h: '0.00'
          });
        });
    }
  }, [address, getRealPortfolioStats, mintedSongs.length]);

  // Load social profile
  useEffect(() => {
    if (address) {
      // Load profile into state on mount
      getUserProfile(address);
      getSocialStats(address);
    }
  }, [address, getUserProfile, getSocialStats]);

  // Get user profile directly from useSocial hook state
  const socialProfile = address ? getProfileFromState(address) : null;


  // Convert userProfileData array to object if it exists
  const profileFromContract = userProfileData ? (() => {
    // Smart contract Profile struct:
    // 0: creator (address), 1: username, 2: displayName, 3: bio, 4: profileImageUrl, 5: bannerImageUrl
    // 6: website, 7: twitter, 8: instagram, 9: spotify
    // 10: totalTracks, 11: totalEarnings, 12: followerCount, 13: followingCount, 14: joinedAt
    // 15: isVerified, 16: isActive

    const createdAtTimestamp = Number(userProfileData[14]);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const oneYearFromNow = currentTimestamp + (365 * 24 * 60 * 60);

    let joinedDate: string;
    if (createdAtTimestamp > 1000000000 && createdAtTimestamp < oneYearFromNow) {
      joinedDate = new Date(createdAtTimestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    } else {
      joinedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    }

    return {
      username: userProfileData[1] as string,
      displayName: userProfileData[2] as string,
      bio: userProfileData[3] as string,
      avatar: (userProfileData[4] as string) || "",
      coverImage: (userProfileData[5] as string) || "",
      website: (userProfileData[6] as string) || "",
      twitter: (userProfileData[7] as string) || "",
      instagram: (userProfileData[8] as string) || "",
      spotify: (userProfileData[9] as string) || "",
      youtube: "",
      verified: userProfileData[15] as boolean,
      location: "Unknown",
      joinedDate,
      followerCount: Number(userProfileData[12]),
      followingCount: Number(userProfileData[13]),
      trackCount: Number(userProfileData[10]),
      totalPlays: 0,
      creatorLevel: "RISING" as const,
      socialLinks: [
        {
          platform: 'website',
          url: (userProfileData[6] as string) || '',
          icon: '🌐'
        },
        {
          platform: 'twitter',
          url: (userProfileData[7] as string) ? `https://twitter.com/${userProfileData[7]}` : '',
          icon: '🐦'
        },
        {
          platform: 'instagram',
          url: (userProfileData[8] as string) ? `https://instagram.com/${userProfileData[8]}` : '',
          icon: '📷'
        },
        {
          platform: 'spotify',
          url: (userProfileData[9] as string) || '',
          icon: '🎵'
        }
      ]
    };
  })() : null;

  // Convert socialProfile to match ProfileData interface
  const normalizedSocialProfile = socialProfile ? (() => {
    const rawTimestamp = socialProfile.createdAt;
    
    let joinedDate: string;
    let timestampInMs: number;
    
    // Determine if timestamp is in seconds or milliseconds
    if (rawTimestamp > 1000000000 && rawTimestamp < 10000000000) {
      // It's in seconds (Unix timestamp)
      timestampInMs = rawTimestamp * 1000;
    } else if (rawTimestamp > 1000000000000) {
      // It's in milliseconds
      timestampInMs = rawTimestamp;
    } else {
      // Invalid timestamp
      timestampInMs = 0;
    }
    
    if (timestampInMs > 0) {
      joinedDate = new Date(timestampInMs).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    } else {
      joinedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    }
    
    return {
      displayName: socialProfile.displayName,
      username: socialProfile.username,
      bio: socialProfile.bio,
      avatar: socialProfile.avatar || "",
      coverImage: socialProfile.coverImage || "",
      website: socialProfile.website,
      twitter: socialProfile.twitter || "",
      instagram: socialProfile.instagram || "",
      spotify: socialProfile.spotify || "",
      youtube: "",
      location: "Unknown",
      joinedDate,
      verified: socialProfile.isVerified,
      followerCount: socialProfile.followerCount,
      followingCount: socialProfile.followingCount,
      trackCount: socialProfile.trackCount,
      totalPlays: socialProfile.totalPlays,
      creatorLevel: socialProfile.creatorLevel,
      socialLinks: [
        {
          platform: 'website',
          url: socialProfile.website || 'https://hibeats.app',
          icon: '🌐'
        },
        {
          platform: 'twitter',
          url: socialProfile.twitter ? `https://twitter.com/${socialProfile.twitter}` : '',
          icon: '🐦'
        },
        {
          platform: 'instagram',
          url: socialProfile.instagram ? `https://instagram.com/${socialProfile.instagram}` : '',
          icon: '📷'
        },
        {
          platform: 'spotify',
          url: socialProfile.spotify || '',
          icon: '🎵'
        }
      ]
    };
  })() : null;

  // Helper function to check if profile data is real (not just default/empty values)
  const isRealProfile = useCallback((profile: any) => {
    if (!profile) return false;
    
    // Check if username exists and is not just an address
    const hasRealUsername = profile.username && 
      profile.username !== '' && 
      !profile.username.match(/^0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}$/);
    
    // Check if displayName exists and is not just "Hibe" (default)
    const hasRealDisplayName = profile.displayName && 
      profile.displayName !== '' && 
      profile.displayName !== 'Hibe';
    
    // Check if bio exists and is not the default bio
    const hasRealBio = profile.bio && 
      profile.bio !== '' && 
      !profile.bio.includes('Passionate collector of AI-generated music NFTs');
    
    return hasRealUsername || hasRealDisplayName || hasRealBio;
  }, []);

  // Calculate if user actually has a profile - check both smart contract flag and actual meaningful profile data
  const actuallyHasProfile = hasProfile || 
    isRealProfile(normalizedSocialProfile) || 
    isRealProfile(profileFromContract);


  // Create user profile with actual dynamic data (with error handling)
  const userProfile = useMemo(() => {
    try {
      const baseProfile = normalizedSocialProfile || profileFromContract;

      // Always use actual song counts regardless of profile source
      const actualTrackCount = (unmintedSongs?.length || 0) + (mintedSongs?.length || 0);
      const actualTotalPlays = mintedSongs?.reduce((total, song) => total + (song.playCount || 0), 0) || 0;

      if (baseProfile) {
        return {
          ...baseProfile,
          trackCount: actualTrackCount,
          totalPlays: Math.max(baseProfile.totalPlays || 0, actualTotalPlays),
          // Ensure we have some reasonable numbers if contract data is empty
          followerCount: baseProfile.followerCount || 0,
          followingCount: baseProfile.followingCount || 0,
        };
      }

      // Fallback profile with dynamic data
      return {
        displayName: "Music Creator",
        username: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "0xf3...2266",
        bio: "AI music enthusiast and digital creator",
        avatar: "", // Empty string will trigger default avatar
        coverImage: "", // Empty string will trigger default gradient
        website: "https://hibeats.app",
        twitter: "hibeats",
        instagram: "hibeats",
        spotify: "https://open.spotify.com/artist/hibeats",
        youtube: "https://youtube.com/@hibeats",
        location: "Web3",
        verified: false,
        joinedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        }),
        followerCount: 0,
        followingCount: 0,
        trackCount: actualTrackCount,
        totalPlays: actualTotalPlays,
        creatorLevel: "NEWCOMER" as const,
        socialLinks: [
          {
            platform: 'website',
            url: 'https://hibeats.app',
            icon: '🌐'
          },
          {
            platform: 'twitter',
            url: 'https://twitter.com/hibeats',
            icon: '🐦'
          },
          {
            platform: 'instagram',
            url: 'https://instagram.com/hibeats',
            icon: '📷'
          },
          {
            platform: 'spotify',
            url: 'https://open.spotify.com/artist/hibeats',
            icon: '🎵'
          }
        ]
      };
    } catch (error) {
      console.error('Error creating user profile:', error);
      setComponentError('Failed to load profile data');

      // Return minimal fallback profile
      return {
        displayName: "User",
        username: "0x...0000",
        bio: "Digital creator",
        avatar: "/api/placeholder/150/150",
        coverImage: "/api/placeholder/1200/300",
        website: "",
        location: "Web3",
        verified: false,
        joinedDate: new Date().toLocaleDateString(),
        followerCount: 0,
        followingCount: 0,
        trackCount: 0,
        totalPlays: 0,
        creatorLevel: "NEWCOMER" as const,
        socialLinks: []
      };
    }
  }, [normalizedSocialProfile, profileFromContract, unmintedSongs, mintedSongs, address]);


  useEffect(() => {
    setCurrentPlaying(currentSong?.id || null);
  }, [currentSong]);

  const handlePlay = (item: any) => {
    // Simple play/pause toggle for NFT preview
    if (currentPlaying === item.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPlaying(item.id);
      setIsPlaying(true);
    }
    
    // Call onSongSelect if provided
    if (onSongSelect) {
      onSongSelect(item);
    }
  };

  const handleNFTClick = (item: any) => {
    setSelectedNFT(item);
    setIsDetailsPanelVisible(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsPanelVisible(false);
    setSelectedNFT(null);
  };

  // Social handlers
  const handleProfileUpdate = async (updatedData: any) => {
    try {
      const success = await updateProfile(updatedData);
      if (success) {
        return true; // Return success for the caller
      } else {
        console.error('❌ Profile update failed');
        throw new Error('Profile update failed');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw error; // Re-throw the error for the caller to handle
    }
  };

  // Handle profile creation with immediate refresh
  const handleProfileCreation = async (profileData: any) => {
    try {
      console.log('🚀 Profile created, starting refresh:', profileData);
      
      // PROFILE ALREADY CREATED in SocialProfileHeader - no need to create again
      // Just do the refresh logic here
      
      // Force immediate profile data refresh after successful creation
      setTimeout(async () => {
        try {
          console.log('🔄 Refreshing profile data after creation...');
          
          // Use the hook's force refresh method
          await forceRefreshProfile();
          
          // Also refresh social profile data
          await refreshProfileData();
          
          // Additional refresh after delay to catch blockchain updates
          setTimeout(async () => {
            await forceRefreshProfile();
            await refreshProfileData();
            console.log('✅ Profile data refreshed successfully');
            
            toast.success('🎉 Profile is now live and ready!', {
              description: 'Your profile has been created and updated successfully.'
            });
          }, 2000);
          
        } catch (refreshError) {
          console.error('❌ Profile refresh after creation failed:', refreshError);
          
          // If refresh fails, suggest page reload to user
          toast.info('Profile created! Please refresh the page to see changes.', {
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload()
            }
          });
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Profile creation error:', error);
      throw error; // Re-throw so overlay can handle the error
    }
  };

  const handleFollowersClick = () => {
    setFollowerListType('followers');
    setIsFollowerListOpen(true);
  };

  const handleFollowingClick = () => {
    setFollowerListType('following');
    setIsFollowerListOpen(true);
  };

  const handleFollow = async (targetAddress: string) => {
    await followUser(targetAddress);
  };

  const handleUnfollow = async (targetAddress: string) => {
    await unfollowUser(targetAddress);
  };


  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-400 border-gray-400';
      case 'Rare': return 'text-blue-400 border-blue-400';
      case 'Epic': return 'text-purple-400 border-purple-400';
      case 'Legendary': return 'text-yellow-400 border-yellow-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  // Filter minted songs based on search and filter type
  const filteredMintedSongs = useMemo(() => {
    if (!mintedSongs) return [];

    let filtered = mintedSongs.filter((song) => {
      const matchesSearch = 
        song.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        song.genre?.some(genre => genre.toLowerCase().includes(filters.searchQuery.toLowerCase())) ||
        (song.artist && song.artist.toLowerCase().includes(filters.searchQuery.toLowerCase()));
      
      return matchesSearch;
    });

    // Apply filter type logic (for now, just return all filtered)
    // You can add specific filter logic for listed/unlisted/sold here
    return filtered;
  }, [mintedSongs, filters.searchQuery, filters.filterType]);

  // Handle search and filter updates
  const handleSearchChange = (value: string) => {
    updateFilters({ searchQuery: value });
  };

  const handleFilterChange = (value: string) => {
    updateFilters({ filterType: value as any });
  };

  // Error fallback
  if (componentError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-white mb-4">Portfolio Error</h2>
          <p className="text-red-400 mb-4">{componentError}</p>
          <Button onClick={() => {
            setComponentError(null);
            window.location.reload();
          }} className="bg-primary hover:bg-primary/80 text-white">
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  const renderSongsGrid = () => (
    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
      {unmintedSongs.map((song: GeneratedMusic) => (
        <GlassCard
          key={song.id}
          className="group overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer"
          onClick={() => onSongSelect && onSongSelect(song)}
        >
          {/* Song Image */}
          <div className="relative aspect-square">
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center relative overflow-hidden">
              {song.imageUrl ? (
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className="w-full h-full bg-black/20 flex items-center justify-center">
                <Music className="w-16 h-16 text-white/60" />
              </div>

              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(song);
                  }}
                  className="w-16 h-16 p-0 rounded-full bg-primary/80 hover:bg-primary text-white"
                >
                  {currentPlaying === song.id && isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
              </div>

              {/* Duration badge */}
              <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-sm text-white">
                {Math.floor((song.duration || 0) / 60)}:{((song.duration || 0) % 60).toString().padStart(2, '0')}
              </div>

              {/* Status badge */}
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/80 text-white">
                Ready to Mint
              </div>
            </div>
          </div>

          {/* Song Info */}
          <div className="p-4">
            <h3 className="font-semibold text-white mb-1 truncate">{song.title}</h3>
            <p className="text-sm text-white/70 mb-2">{song.artist || 'AI Generated'}</p>
            <p className="text-sm text-white/60 mb-3 line-clamp-2">{song.genre ? `Genre: ${song.genre.join(', ')}` : 'AI-generated music track'}</p>

            {/* Genre tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {song.genre?.slice(0, 2).map((g, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {g}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-white/70 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    analytics.recordInteraction('like', 0, 1);
                  }}
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-white/70 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    analytics.recordInteraction('share', 0, 1);
                  }}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  Mint NFT
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Enhanced Social Profile Header */}
      <ErrorBoundary 
        fallback={
          <div className="text-center py-8 px-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-red-400 font-semibold mb-2">Profile Loading Error</h3>
              <p className="text-white/70 text-sm mb-4">
                There was an error loading the profile section. This might be due to:
              </p>
              <ul className="text-white/60 text-xs text-left space-y-1 mb-4">
                <li>• Wallet connection issues</li>
                <li>• Network connectivity problems</li>
                <li>• Smart contract interaction errors</li>
              </ul>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-primary text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }
      >
        <SocialProfileHeader
          profile={userProfile}
          isOwnProfile={true}
          hasProfile={hasProfileFromContract}
          onProfileUpdate={handleProfileUpdate}
          onProfileCreate={handleProfileCreation}
        />


      </ErrorBoundary>

      {/* Content Tabs */}
      <div className="px-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5 bg-glass-background border-glass-border">
            <TabsTrigger value="playlist" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black">
              <Music className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">My Music</span>
            </TabsTrigger>
            <TabsTrigger value="songs" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black">
              <AudioLines className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Songs</span>
            </TabsTrigger>
            <TabsTrigger value="nfts" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black">
              <Disc3 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">NFTs</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black">
              <List className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Playlists</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="playlist" className="m-0">
            <PortfolioPlaylist onSongSelect={onSongSelect} />
          </TabsContent>

          <TabsContent value="songs" className="m-0">
            <PortfolioSongs onSongSelect={onSongSelect} />
          </TabsContent>

          <TabsContent value="nfts" className="m-0">
            <div className="space-y-6">
              {/* NFT Stats Summary */}
              <GlassCard className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{mintedSongs.length}</div>
                    <div className="text-sm text-white/70">Total NFTs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{userBalance?.toString() || '0'}</div>
                    <div className="text-sm text-white/70">Owned NFTs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{realStats?.totalValue || '0.00'} ETH</div>
                    <div className="text-sm text-white/70">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{realStats?.totalTrades || 0}</div>
                    <div className="text-sm text-white/70">Total Trades</div>
                  </div>
                </div>
              </GlassCard>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      placeholder="Search your NFTs..."
                      value={filters.searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 !bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 focus:!bg-white/20 focus:border-primary/50 transition-all duration-300"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <select
                      value={filters.filterType}
                      onChange={(e) => handleFilterChange(e.target.value)}
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
                      <option value="all" className="bg-gray-900 text-white">All NFTs</option>
                      <option value="listed" className="bg-gray-900 text-white">Listed</option>
                      <option value="unlisted" className="bg-gray-900 text-white">Unlisted</option>
                      <option value="sold" className="bg-gray-900 text-white">Sold</option>
                    </select>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="w-10 h-10 p-0 text-white/70 hover:text-white"
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* NFT Grid */}
              {isLoading || !allTracks ? (
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
              ) : filteredMintedSongs.length > 0 ? (
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                  {filteredMintedSongs.map((song) => {
                    try {
                      const listingInfo = getListingInfoEnhanced(song);
                      
                      // Removed heavy debug logging for performance

                      return (
                        <GlassCard
                          key={song.id}
                          className="group overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer"
                          onClick={() => handleNFTClick(song)}
                        >
                      <div className="relative aspect-square">
                        <img
                          src={song.imageUrl || '/api/placeholder/300/300'}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlay(song);
                            }}
                            className="w-16 h-16 p-0 rounded-full bg-primary/80 hover:bg-primary text-white"
                          >
                            {currentPlaying === song.id && isPlaying ? (
                              <Pause className="w-8 h-8" />
                            ) : (
                              <Play className="w-8 h-8 ml-1" />
                            )}
                          </Button>
                        </div>

                        {/* NFT Status Badge */}
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-green-500/80 backdrop-blur-sm text-white">
                          <Disc3 className="w-3 h-3 mr-1 inline" />
                          MINTED
                        </div>

                        {/* Listing Price Badge with Currency */}
                        {listingInfo && listingInfo.isActive && (
                          <div className={`absolute top-12 left-2 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm text-white ${
                            listingInfo.isBeatsToken ? 'bg-yellow-500/90' : 'bg-blue-500/90'
                          }`}>
                            <ShoppingCart className="w-3 h-3 mr-1 inline" />
                            {listingInfo.price} {listingInfo.currency || (listingInfo.isBeatsToken ? 'STT' : 'ETH')}
                          </div>
                        )}

                        {/* Not Listed Badge - Only show if NO listing info AND no active listing */}
                        {(!listingInfo || !listingInfo.isActive) && (
                          <div className="absolute top-12 left-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/80 backdrop-blur-sm text-white">
                            NOT LISTED
                          </div>
                        )}

                        {/* Duration badge */}
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-sm text-white">
                          {Math.floor((song.duration || 0) / 60)}:{((song.duration || 0) % 60).toString().padStart(2, '0')}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white mb-1 truncate">
                              {song.title}
                            </h3>
                            <p className="text-sm text-white/70 mb-2">
                              {song.artist || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown')}
                            </p>
                          </div>
                          
                          {/* Price display on the right */}
                          {listingInfo && listingInfo.price && (
                            <div className="flex-shrink-0 ml-3 text-right">
                              <div className="text-lg font-bold text-white">
                                {listingInfo.price} {listingInfo.currency || (listingInfo.isBeatsToken ? 'STT' : 'ETH')}
                              </div>
                              <div className="text-xs text-white/60">
                                Listed Price
                              </div>
                            </div>
                          )}
                        </div>

                        {/* NFT-specific info */}
                        <div className="text-xs text-white/50 mb-2">
                          Duration: {Math.floor((song.duration || 0) / 60)}:{((song.duration || 0) % 60).toString().padStart(2, '0')}
                        </div>
                        
                        {/* Genre Tags */}
                        {song.genre && song.genre.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {song.genre.slice(0, 2).map((genre, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary border-primary/30"
                              >
                                {genre}
                              </Badge>
                            ))}
                            {song.genre.length > 2 && (
                              <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                                +{song.genre.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Listing Information - simplified */}
                        {listingInfo && (
                          <div className="mb-3 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded ${
                                listingInfo.isBeatsToken
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                Listed for Sale
                              </span>
                              {listingInfo.isBeatsToken && (
                                <span className="text-yellow-400">💎 STT</span>
                              )}
                            </div>
                            <div className="text-white/60">
                              {new Date((listingInfo.listedAt || Date.now() / 1000) * 1000).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-8 h-8 p-0 text-white/70 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                analytics.recordSocialInteraction('like', parseInt(song.id) || 0);
                              }}
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-8 h-8 p-0 text-white/70 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                analytics.recordSocialInteraction('share', parseInt(song.id) || 0);
                              }}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* NFT Action Buttons with Listing Status */}
                          <div onClick={(e) => e.stopPropagation()}>
                            {listingInfo && listingInfo.isActive ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-orange-500 text-orange-400 hover:bg-orange-500/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement unlist functionality
                                }}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Unlist
                              </Button>
                            ) : (
                              <NFTActionButtons
                                aiTrackId={song.id}
                                songData={song}
                                size="sm"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                        </GlassCard>
                      );
                    } catch (error) {
                      console.error('Error rendering NFT card:', error);
                      return (
                        <GlassCard key={song.id} className="p-4">
                          <div className="text-red-400 text-sm">Error loading NFT: {song.title}</div>
                        </GlassCard>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Disc3 className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No NFTs Found</h3>
                  <p className="text-white/60 mb-6">
                    {mintedSongIds.size === 0
                      ? "You haven't minted any songs as NFTs yet."
                      : "No NFTs match your current search criteria."}
                  </p>
                  <Button 
                    className="bg-primary hover:bg-primary/80 text-black"
                    onClick={() => setActiveTab('songs')}
                  >
                    View Your Songs
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="m-0">
            <PortfolioActivitySimple />
          </TabsContent>

          <TabsContent value="playlists" className="m-0">
            <div className="text-center py-12">
              <List className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Playlists Coming Soon</h3>
              <p className="text-white/60">Create and share custom playlists with your favorite tracks.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <NFTDetailPanel
        nft={selectedNFT}
        isVisible={isDetailsPanelVisible}
        onClose={handleCloseDetails}
        isPlaying={currentPlaying === selectedNFT?.id && isPlaying}
        onPlayPause={() => {
          if (selectedNFT) {
            handlePlay(selectedNFT);
          }
        }}
      />

      {/* Follower List Dialog */}
      <FollowerList
        isOpen={isFollowerListOpen}
        onClose={() => setIsFollowerListOpen(false)}
        type={followerListType}
        userAddress={address || ''}
        title={followerListType === 'followers' ? 'Followers' : 'Following'}
        count={followerListType === 'followers' ? (userProfile.followerCount || 0) : (userProfile.followingCount || 0)}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />

    </div>
  );
};