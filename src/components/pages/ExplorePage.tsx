import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Search, Filter, Grid, List, Volume2, Play, Heart, Share2, Music, Eye, X, Clock, Calendar, Download, MoreHorizontal, Pause, Copy, Zap, TrendingUp, Sparkles, Star, Users, User, UserPlus, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { ListedSongCard } from '@/components/marketplace/ListedSongCard';
import ActiveListingCard from '@/components/marketplace/ActiveListingCard';
import CreatorCard from '@/components/profile/CreatorCard';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useProfile } from '@/hooks/useProfile';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { HIBEATS_PROFILE_ABI } from '@/contracts/HiBeatsProfileABI';
import { CONTRACT_ADDRESSES } from '@/config/web3';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import banner from '@/images/banner.png';
import footerBg from '@/images/assets/footer.png';
import defaultAvatar from '@/images/assets/defaultprofile.gif';
import { useGeneratedMusicContext } from '@/hooks/useGeneratedMusicContext';
import { useMusicPlayerContext } from '@/hooks/useMusicPlayerContext';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useNFTOperations } from '@/hooks/useNFTOperations';
import { useActiveListings } from '@/hooks/useActiveListings';
import { useAccount } from 'wagmi';
import { MetadataStrategy, type HybridTrackData } from '@/utils/MetadataStrategy';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { FollowButton } from '@/components/ui/FollowButton';
import { useNFTMetadata } from '@/hooks/useNFTMetadata-optimized';

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
  }
`;

// Types for better TypeScript support
interface SelectedSong {
  id: string;
  tokenId?: number;
  title: string;
  artist?: string;
  genre?: string;
  price?: string;
  priceInWei?: string;
  priceInETH?: string;
  seller?: string;
  imageUrl?: string;
  audioUrl?: string;
  createdAt: string;
}

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { address } = useAccount();
  const { buyNFT, isLoading: isMarketplaceLoading } = useMarketplace();
  const { followUser, unfollowUser, isFollowing, profileExists, error: profileError, hash: profileHash, getProfileByAddress } = useProfile();

  // Search states (moved up to avoid reference errors)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Initialize loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200); // Show skeleton for 1.2s

    return () => clearTimeout(timer);
  }, []);

  // Sync search query with URL params
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl && searchFromUrl !== searchQuery) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);

  // Update URL when search query changes
  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
  }, [searchQuery, setSearchParams]);
  const { writeContract } = useWriteContract();
  const { isSuccess: isFollowSuccess } = useWaitForTransactionReceipt({ hash: profileHash });

  // Get Top Creators from HiBeatsProfile (Unified)
  const { data: topCreatorsData, isLoading: isLoadingTopCreators, refetch: refetchTopCreators } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'getTopCreators',
    args: [20n], // Get top 20 creators
  });

  // Get specific featured creator profile (edisonalpha)
  const { data: featuredCreatorProfile } = getProfileByAddress('0xFc8Cb8fc33e6120e48A1d6cD15DAb5B0c3d9101a');

  // Extract data from marketplace
  const marketplaceCreators = topCreatorsData?.[1] || []; // CreatorProfile[]
  const marketplaceAddresses = topCreatorsData?.[0] || []; // address[]
  const marketplaceStats = topCreatorsData?.[2] || []; // CreatorStats[]

  // Convert marketplace data to featured creators format
  const featuredCreators = marketplaceCreators.map((profile: any, index: number) => ({
    address: marketplaceAddresses[index],
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatar: profile.profileImageUrl,
    coverImage: profile.bannerImageUrl,
    website: profile.website,
    twitter: profile.twitter,
    instagram: profile.instagram,
    spotify: profile.spotify,
    followerCount: Number(profile.followerCount),
    followingCount: Number(profile.followingCount),
    trackCount: Number(profile.totalTracks),
    totalPlays: Number(marketplaceStats[index]?.totalPlays || 0),
    totalEarnings: Number(profile.totalEarnings),
    isVerified: profile.isVerified,
    isActive: profile.isActive,
  }));

  const isLoadingCreators = isLoadingTopCreators;
  const creatorsError = null;
  const totalStats = {
    totalActiveUsers: featuredCreators.length,
    totalTracks: featuredCreators.reduce((sum: number, c: any) => sum + c.trackCount, 0),
  };
  const refetchAllCreators = refetchTopCreators;

  // Fallback to old data for compatibility
  const activeCreators = featuredCreators;
  const recentCreators = featuredCreators;
  const topCreatorsByTracks = featuredCreators;

  // Track last followed creator for logging
  const [lastFollowedCreator, setLastFollowedCreator] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'popular' | 'alphabetical'>('recent');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(null);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'new' | 'featured' | 'all'>('all');
  
  // Mouse tracking for footer interactive text
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const footerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  
  // Initialize MetadataStrategy with useRef to prevent recreation
  const metadataStrategyRef = useRef<MetadataStrategy>();
  if (!metadataStrategyRef.current) {
    metadataStrategyRef.current = new MetadataStrategy();
  }
  const metadataStrategy = metadataStrategyRef.current;
  const [hybridTracks, setHybridTracks] = useState<HybridTrackData[]>([]);
  const [isLoadingHybridData, setIsLoadingHybridData] = useState(false);
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sorting function (moved before useMemo to fix initialization order)
  const sortTracks = useCallback((tracks: any[], sortType: string) => {
    const sortedTracks = [...tracks];

    switch (sortType) {
      case 'price-low':
        return sortedTracks.sort((a, b) => {
          const priceA = parseFloat(a.priceInETH || a.price || '0');
          const priceB = parseFloat(b.priceInETH || b.price || '0');
          return priceA - priceB;
        });
      case 'price-high':
        return sortedTracks.sort((a, b) => {
          const priceA = parseFloat(a.priceInETH || a.price || '0');
          const priceB = parseFloat(b.priceInETH || b.price || '0');
          return priceB - priceA;
        });
      case 'alphabetical':
        return sortedTracks.sort((a, b) =>
          (a.title || a.name || '').localeCompare(b.title || b.name || '')
        );
      case 'popular':
        return sortedTracks.sort((a, b) => {
          const viewsA = parseInt(a.views || a.totalPlays || '0');
          const viewsB = parseInt(b.views || b.totalPlays || '0');
          return viewsB - viewsA;
        });
      case 'recent':
      default:
        return sortedTracks.sort((a, b) => {
          const dateA = new Date(a.createdAt || Date.now()).getTime();
          const dateB = new Date(b.createdAt || Date.now()).getTime();
          return dateB - dateA;
        });
    }
  }, []);
  
  // Discovery hooks
  const {
    trendingTracks,
    newReleases,
    featuredTracks,
    discoveryFeed,
    recommendations,
    platformMetrics,
    isLoadingTrending,
    isLoadingNewReleases,
    isLoadingFeatured,
    getTracksByGenre,
    generateDiscoveryFeed,
    refetchTrending,
    refetchNewReleases,
    refetchFeatured
  } = useDiscovery();

  // NFT Operations for getting track details
  const { allTracks } = useNFTOperations();
  
  // Access all active listings from new marketplace contract
  const { 
    allActiveListings, 
    isLoading: isActiveListingsLoading, 
    totalListings,
    refetch: refetchActiveListings 
  } = useActiveListings();
  const { playSong, currentSong } = useMusicPlayerContext();

  // Genre-based tracks hook - only fetch when category changes and not 'All'
  const shouldFetchGenreTracks = selectedCategory !== 'All';
  const { data: genreTracks, isLoading: isLoadingGenreTracks } = getTracksByGenre(
    shouldFetchGenreTracks ? selectedCategory : '',
    BigInt(50) // Get more tracks for genre filtering
  );


  // Handle transaction success
  useEffect(() => {
    if (isFollowSuccess && lastFollowedCreator) {
      setLastFollowedCreator(null);
    }
  }, [isFollowSuccess, lastFollowedCreator]);


  // Optimized track conversion using hybrid strategy
  const convertDiscoveryTracksToDisplayFormat = useCallback((trackIds: readonly bigint[] | undefined) => {
    if (!trackIds || trackIds.length === 0) return [];
    
    // Convert to onchain metadata format for MetadataStrategy
    const onChainData = trackIds.map(tokenId => {
      const trackIndex = allTracks?.[0]?.findIndex(id => id === tokenId) ?? -1;
      const trackData = trackIndex !== -1 ? allTracks?.[1]?.[trackIndex] : null;
      
      return {
        tokenId,
        creator: trackData?.creator || '0x0000000000000000000000000000000000000000' as `0x${string}`,
        price: BigInt(1), // Default price
        ipfsHash: trackData?.aiTrackId || `track-${tokenId}`, // Use aiTrackId as IPFS hash
        createdAt: BigInt(trackData?.createdAt || Math.floor(Date.now() / 1000)),
        isListed: true,
        genre: trackData?.genre || 'Unknown',
        duration: Number(trackData?.duration) || 0
      };
    });

    // Use MetadataStrategy for optimized loading
    return onChainData.map(track => metadataStrategy.getDisplayData(track as any));
  }, [allTracks, metadataStrategy]);

  // Memoize current tracks to prevent unnecessary re-renders
  const getCurrentTracks = useCallback(() => {
    switch (activeTab) {
      case 'trending':
        return convertDiscoveryTracksToDisplayFormat(trendingTracks as readonly bigint[]);
      case 'new':
        return convertDiscoveryTracksToDisplayFormat(newReleases as readonly bigint[]);
      case 'featured':
        return convertDiscoveryTracksToDisplayFormat(featuredTracks as readonly bigint[]);
      case 'all':
      default:
        return allActiveListings.sort((a, b) => {
          const aDate = new Date(a.createdAt).getTime();
          const bDate = new Date(b.createdAt).getTime();
          return isNaN(aDate) ? 1 : isNaN(bDate) ? -1 : bDate - aDate;
        });
    }
  }, [activeTab, convertDiscoveryTracksToDisplayFormat, trendingTracks, newReleases, featuredTracks, allActiveListings]);

  // Enhanced search with multiple strategies
  const getFilteredTracks = useMemo(() => {
    let baseTracks: any[] = getCurrentTracks();

    // Apply genre filter if not 'All'
    if (selectedCategory !== 'All') {
      if (activeTab === 'all') {
        // For 'all' tab, use discovery contract genre filtering
        return convertDiscoveryTracksToDisplayFormat(genreTracks as readonly bigint[]);
      } else {
        // For other tabs, filter by genre
        baseTracks = baseTracks.filter(track => {
          const genre = Array.isArray(track.genre) ? track.genre.join(' ') : (track.genre || '');
          return genre.toLowerCase().includes(selectedCategory.toLowerCase());
        });
      }
    }

    // Apply enhanced search using MetadataStrategy
    if (debouncedSearchQuery.trim()) {
      // Convert to MetadataStrategy format for better search
      const searchableData = baseTracks.map(track => ({
        tokenId: BigInt(track.tokenId || track.id || 0),
        creator: track.seller || track.creator || '',
        price: BigInt(track.price || 0),
        ipfsHash: track.id || track.ipfsHash || '',
        createdAt: BigInt(Math.floor(new Date(track.createdAt || Date.now()).getTime() / 1000)),
        isListed: true,
        genre: Array.isArray(track.genre) ? track.genre.join(' ') : (track.genre || 'Unknown'),
        duration: track.duration || 0,
        ipfsMetadata: track.metadata || track.ipfsMetadata || null,
        isLoading: false
      }));

      // Use enhanced search from MetadataStrategy
      const searchResults = metadataStrategy.searchTracks(searchableData, debouncedSearchQuery);

      return searchResults.map(track => {
        // Find original track data to preserve all properties
        const originalTrack = baseTracks.find(orig =>
          orig.id === track.tokenId.toString() ||
          orig.tokenId?.toString() === track.tokenId.toString()
        );

        // Return enhanced data with original properties
        return {
          ...originalTrack,
          ...metadataStrategy.getDisplayData(track),
          // Preserve original track properties that might not be in MetadataStrategy
          priceInETH: originalTrack?.priceInETH,
          priceInWei: originalTrack?.priceInWei,
          seller: originalTrack?.seller,
          imageUrl: originalTrack?.imageUrl || track.ipfsMetadata?.image,
          audioUrl: originalTrack?.audioUrl || track.ipfsMetadata?.audio,
        };
      });
    }

    // Apply price filter
    if (priceRange.min || priceRange.max) {
      baseTracks = baseTracks.filter(track => {
        const price = parseFloat(track.priceInETH || track.price || '0');
        const minPrice = parseFloat(priceRange.min || '0');
        const maxPrice = parseFloat(priceRange.max || '999999');
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Apply sorting
    baseTracks = sortTracks(baseTracks, sortBy);

    return baseTracks;
  }, [getCurrentTracks, selectedCategory, activeTab, convertDiscoveryTracksToDisplayFormat, genreTracks, debouncedSearchQuery, metadataStrategy, priceRange, sortBy]);

  // Use memoized filtered tracks
  const filteredTracks = getFilteredTracks;

  // Search suggestions based on existing tracks
  const getSearchSuggestions = useCallback(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const suggestions = new Set<string>();
    const currentTracks = getCurrentTracks();
    const lowerQuery = searchQuery.toLowerCase();

    // Add genre suggestions
    currentTracks.forEach(track => {
      const genre = Array.isArray(track.genre) ? track.genre.join(' ') : (track.genre || '');
      if (genre.toLowerCase().includes(lowerQuery)) {
        suggestions.add(genre);
      }
    });

    // Add artist/creator suggestions
    currentTracks.forEach(track => {
      const artist = track.artist || track.seller || '';
      if (artist.toLowerCase().includes(lowerQuery)) {
        suggestions.add(`by ${artist.slice(0, 10)}...`);
      }
    });

    // Add search history suggestions
    searchHistory.forEach(term => {
      if (term.toLowerCase().includes(lowerQuery)) {
        suggestions.add(term);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }, [searchQuery, getCurrentTracks, searchHistory]);

  // Handle search with history
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setShowSearchSuggestions(false);

    if (query.trim() && !searchHistory.includes(query.trim())) {
      setSearchHistory(prev => [query.trim(), ...prev.slice(0, 4)]);
    }
  }, [searchHistory]);

  // Discovery feed generation removed - no auto-trigger on page load
  // Users can manually trigger it if needed

  // Track loaded metadata to prevent spam loading
  const loadedTrackIdsRef = useRef<Set<string>>(new Set());
  const isPreloadingRef = useRef(false);
  const lastPreloadTimeRef = useRef(0);
  const preloadTimeoutRef = useRef<NodeJS.Timeout>();

  // Background metadata preloader with proper debouncing
  const preloadMetadataInBackground = useCallback(() => {
    if (!trendingTracks || trendingTracks.length === 0 || isPreloadingRef.current) {
      return;
    }

    const now = Date.now();
    // Debounce preload calls (minimum 10 seconds between calls)
    if ((now - lastPreloadTimeRef.current) < 10000) {
      return;
    }

    // Check if we already have these tracks loaded
    const trackIds = trendingTracks.map(id => id.toString());
    const hasNewTracks = trackIds.some(id => !loadedTrackIdsRef.current.has(id));

    if (!hasNewTracks) {
      return;
    }

    isPreloadingRef.current = true;
    lastPreloadTimeRef.current = now;

    // Clear any existing timeout
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    // Delay preload to prevent immediate spam
    preloadTimeoutRef.current = setTimeout(async () => {
      try {
        // Get actual IPFS hashes from allTracks data
        const tracksToPreload = trendingTracks
          .map(tokenId => {
            const trackIndex = allTracks?.[0]?.findIndex(id => id === tokenId) ?? -1;
            const trackData = trackIndex !== -1 ? allTracks?.[1]?.[trackIndex] : null;
            return trackData?.aiTrackId || `track-${tokenId}`;
          })
          .filter(hash => hash && !loadedTrackIdsRef.current.has(hash));

        if (tracksToPreload.length > 0) {
          await metadataStrategy.preloadPopularTracks(tracksToPreload as any);
          // Mark tracks as loaded
          tracksToPreload.forEach(hash => loadedTrackIdsRef.current.add(hash));
        }
      } catch (error) {
        // Silent fail in background
        // Background preload failed silently
      } finally {
        isPreloadingRef.current = false;
      }
    }, 2000); // 2 second delay
  }, [trendingTracks, allTracks, metadataStrategy]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
      if (hybridLoadTimeoutRef.current) {
        clearTimeout(hybridLoadTimeoutRef.current);
      }
    };
  }, []);

  // Background hybrid data loader
  const isLoadingHybridDataRef = useRef(false);
  const hybridLoadTimeoutRef = useRef<NodeJS.Timeout>();

  const loadHybridDataInBackground = useCallback(() => {
    if (!allActiveListings || allActiveListings.length === 0 || isLoadingHybridDataRef.current) {
      return;
    }

    // Check if we have new listings that haven't been loaded yet
    const hasNewListings = allActiveListings.some(listing => !loadedTrackIdsRef.current.has(listing.id));

    if (!hasNewListings && hybridTracks.length > 0) {
      // All listings are already loaded, skip
      return;
    }

    isLoadingHybridDataRef.current = true;

    // Clear any existing timeout
    if (hybridLoadTimeoutRef.current) {
      clearTimeout(hybridLoadTimeoutRef.current);
    }

    // Delay loading to prevent immediate spam
    hybridLoadTimeoutRef.current = setTimeout(async () => {
      try {
        // Convert active listings to onchain metadata format
        const onChainData = allActiveListings.map(listing => ({
          tokenId: BigInt(listing.tokenId),
          creator: listing.seller as `0x${string}`,
          price: BigInt(listing.price),
          ipfsHash: listing.id, // Use listing.id as the unique identifier
          createdAt: BigInt(Math.floor(new Date(listing.createdAt).getTime() / 1000)),
          isListed: true,
          genre: listing.genre || 'Unknown',
          duration: listing.duration || 0
        }));

        // Use MetadataStrategy for optimized loading
        const hybridData = await metadataStrategy.getExplorerData(onChainData);
        setHybridTracks(hybridData);

        // Mark these tracks as loaded
        allActiveListings.forEach(listing => loadedTrackIdsRef.current.add(listing.id));
      } catch (error) {
        // Silent fail in background
        // Background hybrid data loading failed silently
      } finally {
        isLoadingHybridDataRef.current = false;
      }
    }, 1000); // 1 second delay
  }, [allActiveListings, metadataStrategy, hybridTracks.length]);

  // Load hybrid data when active listings change
  useEffect(() => {
    loadHybridDataInBackground();
  }, [loadHybridDataInBackground]);

  // Mouse tracking for footer interactive text
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (footerRef.current) {
        const rect = footerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const footerElement = footerRef.current;
    if (footerElement) {
      footerElement.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (footerElement) {
        footerElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Update letter colors based on mouse position
  useEffect(() => {
    letterRefs.current.forEach((letterEl, index) => {
      if (letterEl && footerRef.current) {
        const letterRect = letterEl.getBoundingClientRect();
        const footerRect = footerRef.current.getBoundingClientRect();

        const letterCenterX = letterRect.left + letterRect.width / 2 - footerRect.left;
        const letterCenterY = letterRect.top + letterRect.height / 2 - footerRect.top;

        const distance = Math.sqrt(
          Math.pow(mousePosition.x - letterCenterX, 2) +
          Math.pow(mousePosition.y - letterCenterY, 2)
        );

        // If mouse is within 80px of the letter, highlight it
        if (distance < 80) {
          letterEl.style.color = 'white';
        } else {
          letterEl.style.color = 'rgba(163, 230, 53, 0.8)'; // lime-400/80
        }
      }
    });
  }, [mousePosition]);

  // Helper function to get track info by tokenId
  const getTrackInfo = (tokenId: bigint | number) => {
    const id = typeof tokenId === 'bigint' ? Number(tokenId) : tokenId;
    return allTracks?.[1]?.find((_, index) => Number(allTracks[0][index]) === id);
  };

  const currentTracks = getCurrentTracks();
  
  // Use all active listings from marketplace, sorted by newest first
  const contractSongs = allActiveListings.sort((a, b) => {
    // Sort by creation date (newest first)
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();

    // Handle invalid dates
    if (isNaN(aDate) && isNaN(bDate)) return 0;
    if (isNaN(aDate)) return 1;
    if (isNaN(bDate)) return -1;

    // Newest first: higher timestamp comes first
    return bDate - aDate;
  });

  // Find featured song from edisonalpha creator
  const featuredSong = contractSongs.find(song => 
    song.seller?.toLowerCase() === '0xFc8Cb8fc33e6120e48A1d6cD15DAb5B0c3d9101a'.toLowerCase()
  ) || contractSongs[0]; // Fallback to first song if creator has no listings

  // Get metadata for featured song (same as ActiveListingCard)
  const { metadata: featuredSongMetadata, isLoading: isLoadingFeaturedMetadata } = useNFTMetadata(featuredSong?.tokenId || 0);

  const categories = ['All', 'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Reggae', 'Folk'];

  // Handle song detail panel with debouncing
  const [isOpening, setIsOpening] = useState(false);

  const handleSongClick = useCallback(async (song: any) => {
    if (isOpening) return; // Prevent multiple clicks

    try {
      setIsOpening(true);

      // Small delay to prevent rapid clicking
      setTimeout(() => {
        setSelectedSong(song as SelectedSong);
        setIsDetailsPanelVisible(true);
        setIsOpening(false);
      }, 100);

    } catch (error) {
      setIsOpening(false);
    }
  }, [isOpening]);

  const handleCloseDetails = useCallback(() => {
    try {
      setIsDetailsPanelVisible(false);
      setSelectedSong(null);
    } catch (error) {
    }
  }, []);

  // Buy NFT handler with STT only
  const handleBuyNFT = useCallback(async (song: SelectedSong) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!song?.tokenId && song.tokenId !== 0) {
      toast.error('Invalid NFT token ID');
      return;
    }

    try {
      setIsBuying(true);

      const tokenId = BigInt(song.tokenId);
      const price = BigInt(song.price || song.priceInWei || 0);

      if (price <= 0) {
        toast.error('Invalid NFT price');
        return;
      }

      toast.loading('Preparing STT transaction...');
      await buyNFT(tokenId, price);
      toast.success(`NFT purchase initiated! Paying ${song.priceInETH || '1'} STT. Check your wallet to confirm.`);

      // Close modals after successful purchase
      handleCloseDetails();
      setShowBuyModal(false);

    } catch (error: unknown) {

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('User rejected')) {
        toast.error('Transaction was cancelled by user');
      } else if (errorMessage.includes('insufficient funds')) {
        toast.error('Insufficient STT balance to complete purchase');
      } else if (errorMessage.includes('Token not for sale')) {
        toast.error('This NFT is no longer available for purchase');
      } else {
        toast.error('Failed to buy NFT. Please try again.');
      }
    } finally {
      setIsBuying(false);
      toast.dismiss(); // Clear loading toast
    }
  }, [address, buyNFT, handleCloseDetails]);

  // Show buy modal
  const handleShowBuyModal = useCallback((song: SelectedSong) => {
    setSelectedSong(song);
    setShowBuyModal(true);
  }, []);

  // Handle follow/unfollow creator
  const handleFollowCreator = useCallback(async (creatorAddress: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!address) {
      toast.error('Please connect your wallet to follow creators');
      return;
    }

    if (creatorAddress === address) {
      toast.error('You cannot follow yourself');
      return;
    }

    if (!profileExists) {
      toast.error('You need to create a profile first to follow creators');
      return;
    }

    try {
      setLastFollowedCreator(creatorAddress);
      followUser(creatorAddress);
    } catch (error) {
      toast.error('Failed to follow creator');
      setLastFollowedCreator(null);
    }
  }, [address, followUser, profileExists]);

  // Handle view creator profile
  const handleViewCreatorProfile = useCallback((creatorAddress: string) => {
    if (creatorAddress) {
      navigate(`/creator/${creatorAddress}`);
    }
  }, [navigate]);

  // Get hot songs from listed NFTs (most recently listed or most popular)
  const hotSongs = contractSongs.slice(0, 21); // Take top 21 listed songs

  // Show skeleton loading
  if (isInitialLoading) {
    return <PageSkeleton type="explore" />;
  }

  return (
    <div className="min-h-screen bg-black">
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      {/* Hero Featured Collection */}
      <div className="relative h-[600px] overflow-hidden">
        <img 
          src={featuredCreatorProfile?.bannerImageUrl || banner} 
          alt="Featured Collection" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent">
          {/* Collection Info */}
          <div className="absolute bottom-8 left-8 max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-4xl font-bold text-white">
                {featuredSongMetadata?.name || featuredSong?.title || 'Featured Track'}
              </h1>
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <p className="text-gray-300 mb-4">By {featuredCreatorProfile?.displayName || 'edisonalpha'}</p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">PRICE</div>
                <div className="text-white font-bold">{featuredSong?.priceInETH || '1'} STT</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">GENRE</div>
                <div className="text-white font-bold">{featuredSongMetadata?.genre || featuredSong?.genre || 'Electronic'}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">DURATION</div>
                <div className="text-white font-bold">
                  {featuredSongMetadata?.duration ? 
                    `${Math.floor(featuredSongMetadata.duration / 60)}:${(featuredSongMetadata.duration % 60).toString().padStart(2, '0')}` : 
                    featuredSong?.duration ? 
                      `${Math.floor(featuredSong.duration / 60)}:${(featuredSong.duration % 60).toString().padStart(2, '0')}` : 
                      '3:00'
                  }
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">ROYALTY</div>
                <div className="text-white font-bold">{featuredSong?.royaltyRate ? (Number(featuredSong.royaltyRate) / 100).toFixed(1) : 0}%</div>
              </div>
            </div>
          </div>
          
          {/* Thumbnail Grid - Show Featured Song and Other Music Images */}
          <div className="absolute bottom-8 right-8 flex gap-4">
            {/* Show featured song first, then other songs */}
            {[featuredSong, ...contractSongs.filter(song => song.id !== featuredSong?.id)].filter(song => song).slice(0, 2).map((song, index) => (
              <div key={song.id} className="relative group cursor-pointer">
                <div className="relative w-24 h-24 rounded-xl shadow-lg overflow-hidden">
                  {/* Animated Border Progress */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 p-0.5 animate-pulse">
                    <div className="w-full h-full bg-black rounded-xl overflow-hidden">
                      {song.id === featuredSong?.id && featuredSongMetadata?.image ? (
                        <img 
                          src={featuredSongMetadata.image} 
                          alt={featuredSongMetadata.name || song.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : song.imageUrl ? (
                        <img 
                          src={song.imageUrl} 
                          alt={song.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          <Music className="w-8 h-8 text-white/80" />
                        </div>
                      )}
                      <div className="hidden w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Music className="w-8 h-8 text-white/80" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                
                {/* NFT Card Info Overlay */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 min-w-max opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-white text-xs font-medium truncate max-w-20">
                    {song.id === featuredSong?.id && featuredSongMetadata?.name ? featuredSongMetadata.name : song.title}
                  </div>
                  <div className="text-green-400 text-xs">
                    {song.priceInETH || '1'} STT
                  </div>
                </div>
              </div>
            ))}
            
            {/* Fallback thumbnails if less than 2 generated songs */}
            {Array.from({ length: Math.max(0, 2 - contractSongs.length) }).map((_, index) => (
              <div key={`fallback-${index}`} className="relative group cursor-pointer">
                <div className="relative w-24 h-24 rounded-xl shadow-lg overflow-hidden">
                  {/* Animated Border Progress */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gray-500 via-gray-400 to-gray-600 p-0.5 animate-pulse">
                    <div className="w-full h-full bg-black rounded-xl overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                        <Music className="w-8 h-8 text-white/80" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="absolute top-1 right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 min-w-max opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-white text-xs font-medium">
                    Coming Soon
                  </div>
                  <div className="text-green-400 text-xs">
                    1 STT
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Search and Category Filters */}
        <div className="mb-8">
          {/* Enhanced Search Bar */}
          <div className="mb-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <Input
                  type="text"
                  placeholder="Search tracks, genres, artists... (try 'electronic', 'hip hop', or token ID)"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  className="pl-10 pr-20 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                />

                {/* Search Actions */}
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSearch('')}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`p-1 ${showAdvancedFilters ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search Suggestions Dropdown */}
                {showSearchSuggestions && getSearchSuggestions().length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-gray-900 border border-white/20 rounded-lg mt-1 z-50">
                    {getSearchSuggestions().map((suggestion, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-2 text-white hover:bg-white/10 text-sm first:rounded-t-lg last:rounded-b-lg"
                        onClick={() => handleSearch(suggestion)}
                      >
                        <Search className="w-3 h-3 inline mr-2 text-gray-400" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white/5 border border-white/20 rounded text-white text-sm px-3 py-2 focus:border-white/40"
                >
                  <option value="recent">Recent</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                  <option value="alphabetical">A-Z</option>
                </select>
              </div>

              {/* Results Counter */}
              <div className="text-gray-400 text-sm whitespace-nowrap">
                {filteredTracks.length} {filteredTracks.length === 1 ? 'track' : 'tracks'}
                {debouncedSearchQuery && (
                  <span className="text-white"> for "{debouncedSearchQuery}"</span>
                )}
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Advanced Filters</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Price Range Filter */}
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Price Range (STT)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                        className="bg-white/5 border-white/20 text-white text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                        className="bg-white/5 border-white/20 text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Search History */}
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Recent Searches</label>
                    <div className="flex flex-wrap gap-1">
                      {searchHistory.slice(0, 3).map((term, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSearch(term)}
                          className="text-xs bg-white/5 text-gray-300 hover:text-white border border-white/10 px-2 py-1 h-auto"
                        >
                          {term}
                        </Button>
                      ))}
                      {searchHistory.length === 0 && (
                        <span className="text-gray-500 text-xs">No recent searches</span>
                      )}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleSearch('');
                        setSelectedCategory('All');
                        setPriceRange({ min: '', max: '' });
                        setSortBy('recent');
                      }}
                      className="text-gray-400 hover:text-white border-gray-600"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {['All','Electronic', 'Hip Hop', 'Pop', 'Rock', 'Jazz', 'Classical'].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 transition-all duration-300 ease-in-out ${
                    selectedCategory === category
                      ? 'bg-white text-black shadow-lg scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-white/20 hover:shadow-md hover:scale-105 border border-transparent hover:border-white/30'
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {selectedCategory !== 'All' && (
                <Badge variant="outline" className="border-white/20 text-white">
                  {selectedCategory}
                  {genreTracks && ` (${genreTracks.length})`}
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Collections */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Featured Collections</h2>
              <p className="text-gray-400">This week's curated collections</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-4 relative overflow-hidden h-48 shadow-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold mb-1">Electronic Beats</h3>
                <p className="text-white/80 text-sm">Floor price: 659.5 STT 6%</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-4 relative overflow-hidden h-48 shadow-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold mb-1">Hip Hop Chronicles</h3>
                <p className="text-white/80 text-sm">Floor price: 150 STT 6%</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-4 relative overflow-hidden h-48 shadow-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold mb-1">Pop Sensations</h3>
                <p className="text-white/80 text-sm">Floor price: 32.8 STT -4.1%</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl p-4 relative overflow-hidden h-48 shadow-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold mb-1">Rock Legends</h3>
                <p className="text-white/80 text-sm">Floor price: 2 STT -4.5%</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-4 relative overflow-hidden h-48 shadow-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold mb-1">Jazz Masters</h3>
                <p className="text-white/80 text-sm">Floor price: 21.4 STT -8.3%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Creators */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">🎵 Featured Creators</h2>
            </div>
            {featuredCreators.length > 6 && (
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                View All ({featuredCreators.length})
              </Button>
            )}
          </div>

          {/* Featured Creators Horizontal Slider */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={() => {
                const container = document.getElementById('creators-slider');
                if (container) {
                  container.scrollBy({ left: -320, behavior: 'smooth' });
                }
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                const container = document.getElementById('creators-slider');
                if (container) {
                  container.scrollBy({ left: 320, behavior: 'smooth' });
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Creators Container */}
            <div
              id="creators-slider"
              className="group flex gap-4 overflow-x-auto pb-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none' }
              }}
            >
              {isLoadingCreators ? (
                // Loading state
                Array.from({ length: 8 }).map((_, index) => (
                  <div key={`loading-creator-${index}`} className="group cursor-pointer animate-pulse flex-shrink-0 w-64">
                    <div className="relative bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">

                    {/* Banner Background */}
                    <div className="h-20 bg-gray-700 relative"></div>

                    {/* Avatar overlapping banner */}
                    <div className="relative px-4 pb-4">
                      <div className="flex justify-center">
                        <div className="relative -mt-8">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white/10 bg-gray-700">
                            <img
                              src={defaultAvatar}
                              alt="Loading Avatar"
                              className="w-full h-full object-cover opacity-30"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Creator Info */}
                      <div className="text-center mt-3 mb-4">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>

                        {/* Simple stats in one line */}
                        <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto"></div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <div className="flex-1 h-7 bg-gray-700 rounded-full"></div>
                        <div className="flex-1 h-7 bg-gray-700 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : featuredCreators.length > 0 ? (
              // Real creators from smart contract
              featuredCreators.map((creator, index) => (
                <div
                  key={creator.address || `creator-${index}`}
                  className="group cursor-pointer flex-shrink-0 w-64"
                  onClick={() => handleViewCreatorProfile(creator.address)}
                >
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-white/30 transition-all duration-200 hover:scale-[1.02]">

                    {/* Banner Background */}
                    <div className="h-20 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-blue-600/20 relative">
                      {creator.coverImage ? (
                        <ImageWithFallback
                          src={creator.coverImage}
                          alt="Creator banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-700 to-gray-600"></div>
                      )}
                    </div>

                    {/* Avatar overlapping banner */}
                    <div className="relative px-4 pb-4">
                      <div className="flex justify-center">
                        <div className="relative -mt-8">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white/20 bg-gradient-to-br from-purple-600 to-pink-600">
                            {creator.avatar && creator.avatar.trim() !== '' ? (
                              <ImageWithFallback
                                src={creator.avatar}
                                alt={creator.displayName}
                                className="w-full h-full object-cover"
                                fallbackSrc={defaultAvatar}
                              />
                            ) : (
                              <img
                                src={defaultAvatar}
                                alt="Default Avatar"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          {/* Verified badge */}
                          {creator.isVerified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Creator Info */}
                      <div className="text-center mt-3 mb-4">
                        <h3 className="text-white font-medium text-sm mb-1 truncate" title={creator.displayName}>
                          {creator.displayName || creator.username || 'Anonymous Creator'}
                        </h3>

                        {/* Simple stats in one line */}
                        <div className="text-xs text-gray-400 space-x-3">
                          <span>{creator.followerCount || 0} followers</span>
                          <span>•</span>
                          <span>{creator.trackCount || 0} tracks</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {/* Follow Button */}
                        {address && creator.address !== address && (
                          <FollowButton
                            creatorAddress={creator.address}
                            currentUserAddress={address}
                            onFollow={handleFollowCreator}
                            onUnfollow={unfollowUser}
                            transactionHash={profileHash}
                          />
                        )}

                        {/* View Profile Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className={`${address && creator.address !== address ? 'flex-1' : 'w-full'} h-7 text-xs rounded-full border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-white/5`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCreatorProfile(creator.address);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>

                    {/* Source badge for debugging */}
                    {/* Removed creator.source as it does not exist on the creator object */}
                  </div>
                </div>
              ))
            ) : (
              // Fallback when no creators found
              Array.from({ length: 8 }).map((_, index) => (
                <div key={`fallback-creator-${index}`} className="group cursor-pointer flex-shrink-0 w-64">
                  <div className="relative bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">

                    {/* Banner Background */}
                    <div className="h-20 bg-gradient-to-r from-gray-700/50 to-gray-600/50 relative"></div>

                    {/* Avatar overlapping banner */}
                    <div className="relative px-4 pb-4">
                      <div className="flex justify-center">
                        <div className="relative -mt-8">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white/10 bg-gradient-to-br from-gray-700 to-gray-800">
                            <img
                              src={defaultAvatar}
                              alt="Default Avatar"
                              className="w-full h-full object-cover opacity-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Creator Info */}
                      <div className="text-center mt-3 mb-4">
                        <h3 className="text-gray-400 font-medium text-sm mb-1">
                          Creator Slot {index + 1}
                        </h3>

                        {/* Simple stats in one line */}
                        <div className="text-xs text-gray-500 space-x-3">
                          <span>0 followers</span>
                          <span>•</span>
                          <span>0 tracks</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs rounded-full border-gray-600 text-gray-500 cursor-not-allowed"
                          disabled
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Join as Creator
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        </div>
        {/* Dynamic Music Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-white">
                {activeTab === 'trending' && <><TrendingUp className="w-8 h-8 mr-2 inline" />Trending Now</>}
                {activeTab === 'new' && <><Star className="w-8 h-8 mr-2 inline" />New Releases</>}
                {activeTab === 'featured' && <><Sparkles className="w-8 h-8 mr-2 inline" />Featured Tracks</>}
                {activeTab === 'all' && <><Music className="w-8 h-8 mr-2 inline" />All Music NFT Listed</>}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Grid className="w-4 h-4 mr-2" />
                Grid View
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Show filtered tracks without loading indicators */}
            {filteredTracks.length > 0 ? (
              filteredTracks.slice(0, 21).map((song, index) => (
                <div key={song.id || `track-${index}`} className="relative">
                  {/* Use ActiveListingCard for 'all' tab to get real NFT metadata */}
                  {activeTab === 'all' ? (
                    <ActiveListingCard
                      listing={song}
                      onClick={handleSongClick}
                      onBuy={handleShowBuyModal}
                    />
                  ) : (
                    <ListedSongCard
                      song={song}
                      onClick={handleSongClick}
                    />
                  )}
                </div>
              ))
            ) : (
              /* Show empty state only - no loading indicators */
              <div className="col-span-full text-center py-8">
                <div className="text-gray-400 text-lg mb-2">
                  {debouncedSearchQuery ? `No results for "${debouncedSearchQuery}"` :
                   selectedCategory !== 'All' ? `No ${selectedCategory} tracks found` :
                   activeTab === 'trending' ? 'No Trending Tracks' :
                   activeTab === 'new' ? 'No New Releases' :
                   activeTab === 'featured' ? 'No Featured Tracks' :
                   'No Tracks Found'}
                </div>
                <p className="text-gray-500 text-sm">
                  {debouncedSearchQuery ? 'Try searching for different keywords.' :
                   selectedCategory !== 'All' ? `${selectedCategory} tracks will appear here when available.` :
                   activeTab === 'trending' ? 'Tracks will appear here as they gain popularity.' :
                   activeTab === 'new' ? 'New releases will appear here.' :
                   activeTab === 'featured' ? 'Featured tracks will be curated here.' :
                   'No music NFTs are currently available.'}
                </p>
              </div>
            )}
          </div>

          {/* Show personalized recommendations - always visible when user is connected */}
          {address && (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-white">Recommended for You</h3>
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  Personal
                </Badge>
              </div>
              
              {/* Always show content when wallet is connected */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {(() => {
                  // Handle different data structures from discovery feed
                  const recommendedTracks = recommendations && typeof recommendations === 'object' && 'recommendedTracks' in recommendations
                    ? recommendations.recommendedTracks as readonly bigint[]
                    : Array.isArray(recommendations) 
                      ? recommendations as readonly bigint[]
                      : [];
                  
                  // If we have recommendations from the contract, use them
                  if (recommendedTracks && recommendedTracks.length > 0) {
                    return convertDiscoveryTracksToDisplayFormat(recommendedTracks).slice(0, 7).map((song) => (
                      <ListedSongCard
                        key={`rec-${song.id}`}
                        song={song as any}
                        onClick={handleSongClick}
                      />
                    ));
                  }
                  
                  // Fallback: Show popular/recent tracks from active listings
                  if (allActiveListings.length > 0) {
                    const fallbackRecommendations = allActiveListings
                      .sort((a, b) => {
                        // Sort by creation date (newest first) 
                        const aDate = new Date(a.createdAt).getTime();
                        const bDate = new Date(b.createdAt).getTime();
                        return bDate - aDate;
                      })
                      .slice(0, 7);
                    
                    return fallbackRecommendations.map((song) => (
                      <ListedSongCard
                        key={`fallback-rec-${song.id}`}
                        song={song as any}
                        onClick={handleSongClick}
                      />
                    ));
                  }
                  
                  // Show empty state message
                  return (
                    <div className="col-span-full text-center py-8">
                      <div className="text-gray-400 text-lg mb-2">No recommendations available</div>
                      <p className="text-gray-500 text-sm">
                        Recommendations will appear here based on your listening history.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          
          {/* Show debug info when wallet is not connected */}
          {!address && (
            <div className="mt-8 text-center py-8 border border-gray-700 rounded-lg">
              <div className="text-gray-400 text-lg mb-2">Connect Wallet for Recommendations</div>
              <p className="text-gray-500 text-sm">
                Connect your wallet to see personalized music recommendations.
              </p>
            </div>
          )}
        </div>

        {/* Music NFT Learn Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold text-white">Music NFT 101</h2>
          </div>
          <p className="text-gray-400 mb-6">Learn about Music NFTs, Web3, and more.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 relative overflow-hidden h-48 shadow-lg group cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎵</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2">What is a Music NFT?</h3>
                <p className="text-white/80 text-sm">Learn the basics of music NFTs and how they work</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 relative overflow-hidden h-48 shadow-lg group cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2">How to buy a Music NFT</h3>
                <p className="text-white/80 text-sm">Step-by-step guide to purchasing music NFTs</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-6 relative overflow-hidden h-48 shadow-lg group cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎤</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2">What is minting?</h3>
                <p className="text-white/80 text-sm">Learn how to create and mint your own music NFTs</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 relative overflow-hidden h-48 shadow-lg group cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2">How to stay protected in web3</h3>
                <p className="text-white/80 text-sm">Security tips for music NFT collectors</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 relative overflow-hidden h-48 shadow-lg group cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2">How to create a Music NFT</h3>
                <p className="text-white/80 text-sm">Complete guide to creating music NFTs on HiBeats</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer ref={footerRef} className="relative mt-20">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${footerBg})`,
          }}
        ></div>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Back to Top Button */}
        <div className="relative z-10 flex justify-end pr-8 pt-16 pb-8">
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-gradient-to-r from-lime-400 to-yellow-400 hover:from-lime-500 hover:to-yellow-500 text-black px-4 py-2 rounded-full text-sm font-medium"
          >
            back to top ↑
          </Button>
        </div>

        {/* HiBeats Logo */}
        <div className="relative z-10 text-center pb-20">
          <h1 className="text-[14rem] md:text-[18rem] lg:text-[22rem] xl:text-[26rem] font-bold leading-none">
            {'hibeats'.split('').map((letter, index) => (
              <span
                key={index}
                ref={(el) => (letterRefs.current[index] = el)}
                className="text-lime-400/80 transition-colors duration-300"
                style={{
                  display: 'inline-block',
                  cursor: 'default',
                }}
              >
                {letter}
              </span>
            ))}
          </h1>
        </div>
      </footer>

      {/* Song Detail Panel */}
      {isDetailsPanelVisible && selectedSong && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-16 p-4 overflow-auto custom-scrollbar">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden">
            <GlassCard className="h-full flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-semibold text-white">{selectedSong.title}</h2>
                  {selectedSong.metadata?.genre && (
                    <Badge className="text-xs border border-green-400 text-green-400 bg-green-400/10">
                      {selectedSong.metadata.genre}
                    </Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCloseDetails}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex min-h-0">
                {/* Left Panel - Song Display */}
                <div className="w-1/2 p-3 flex flex-col">
                  {/* Song Image */}
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-2 group max-w-xs mx-auto">
                    <div className={`w-full h-full bg-gradient-to-br ${selectedSong.color || 'from-purple-600 to-pink-600'} flex items-center justify-center relative`}>
                      {selectedSong.imageUrl ? (
                        <img 
                          src={selectedSong.imageUrl} 
                          alt={selectedSong.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-black/20 flex items-center justify-center">
                          <Volume2 className="w-16 h-16 text-white/60" />
                        </div>
                      )}
                      
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={() => {
                            if (selectedSong.audioUrl || selectedSong.id) {
                              playSong(selectedSong, contractSongs);
                              setCurrentPlaying(selectedSong.id);
                            }
                          }}
                          className="w-16 h-16 p-0 rounded-full bg-green-600/80 hover:bg-green-600 text-white"
                        >
                          {currentSong?.id === selectedSong.id ? (
                            <Pause className="w-8 h-8" />
                          ) : (
                            <Play className="w-8 h-8 ml-1" />
                          )}
                        </Button>
                      </div>

                      {/* Collection Badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white border border-white/20">
                        HiBeats Music
                      </div>

                      {/* ID */}
                      <div className="absolute bottom-2 left-2 text-white/80 text-xs font-mono">
                        #{selectedSong.id}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 mt-4">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium text-xs py-1.5">
                      Buy for 1 STT
                    </Button>
                    <Button variant="ghost" className="text-white/70 hover:text-white border border-white/20 p-1.5">
                      <Heart className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" className="text-white/70 hover:text-white border border-white/20 p-1.5">
                      <Share2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" className="text-white/70 hover:text-white border border-white/20 p-1.5">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Comment Area */}
                  <div className="mt-4 bg-white/5 rounded-lg p-3">
                    <h4 className="text-white font-medium text-xs mb-2">Comments</h4>
                    
                    {/* Comment Input */}
                    <div className="flex items-start space-x-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">U</span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          placeholder="Add a comment..."
                          className="w-full bg-white/5 border border-white/10 rounded text-white text-xs p-2 placeholder-white/50 resize-none h-16 focus:outline-none focus:border-green-400/50"
                        />
                        <div className="flex justify-end mt-1">
                          <Button size="sm" className="bg-green-600/80 hover:bg-green-600 text-white text-xs px-3 py-1">
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Sample Comments */}
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">M</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-white text-xs font-medium">MusicLover.som</span>
                            <span className="text-white/50 text-xs">2h ago</span>
                          </div>
                          <p className="text-white/80 text-xs">Amazing track! The AI composition is incredible. 🎵</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">C</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-white text-xs font-medium">Collector.som</span>
                            <span className="text-white/50 text-xs">5h ago</span>
                          </div>
                          <p className="text-white/80 text-xs">Just bought this NFT. Great addition to my collection!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Song Info */}
                <div className="w-1/2 border-l border-white/10 overflow-y-auto custom-scrollbar">
                  {/* Artist Info */}
                  <div className="p-3 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                          <Music className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-xs">{selectedSong.artist || 'AI Artist'}</p>
                          <p className="text-white/60 text-xs">Creator</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-green-400 border border-green-400/20 hover:bg-green-400/10 text-xs px-2 py-1">
                        Follow
                      </Button>
                    </div>
                  </div>

                  {/* Song Details */}
                  <div className="p-3 space-y-3">
                    {/* Description */}
                    <div>
                      <h3 className="text-white font-medium mb-1 text-xs">Description</h3>
                      <p className="text-white/70 text-xs leading-relaxed">
                        {selectedSong.metadata?.description || selectedSong.description || 'No description available for this music NFT.'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="flex items-center space-x-1 text-white/60 mb-1">
                          <Eye className="w-3 h-3" />
                          <span className="text-xs">Views</span>
                        </div>
                        <p className="text-white font-medium text-xs">
                          {selectedSong.views || `${Math.floor(Math.random() * 1000) + 100}`}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="flex items-center space-x-1 text-white/60 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">Created</span>
                        </div>
                        <p className="text-white font-medium text-xs">
                          {selectedSong.createdAt 
                            ? new Date(selectedSong.createdAt).toLocaleDateString() 
                            : selectedSong.timeAgo || 'Recently'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedSong.metadata?.tags && selectedSong.metadata.tags.length > 0 && (
                      <div>
                        <h3 className="text-white font-medium mb-1 text-xs">Tags</h3>
                        <div className="flex flex-wrap gap-1">
                          {selectedSong.metadata.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="border-gray-600 text-gray-300 bg-white/5 text-xs px-1.5 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price History */}
                    <div>
                      <h3 className="text-white font-medium mb-1 text-xs">Price History</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center py-1.5 px-2 bg-white/5 rounded-lg">
                          <span className="text-white/70 text-xs">Current Price</span>
                          <span className="text-green-400 font-medium text-xs">1 STT (~$2.50)</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 px-2 bg-white/5 rounded-lg">
                          <span className="text-white/70 text-xs">Last Sale</span>
                          <span className="text-white/70 text-xs">0.8 STT</span>
                        </div>
                      </div>
                    </div>

                    {/* NFT Details */}
                    <div>
                      <h3 className="text-white font-medium mb-2 text-xs">Details</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Contract Address</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-white text-xs font-mono">0x1a2...b5c8</span>
                            <Button variant="ghost" size="sm" className="w-3 h-3 p-0 text-white/70 hover:text-white">
                              <Copy className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Token Standard</span>
                          <span className="text-white text-xs">ERC721</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Owner</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-white text-xs font-mono">0x9f3...a4d2</span>
                            <Button variant="ghost" size="sm" className="w-3 h-3 p-0 text-white/70 hover:text-white">
                              <Copy className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Chain</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-white text-xs">Somnia</span>
                            <Badge className="text-xs border border-green-400 text-green-400 bg-green-400/10">
                              Testnet
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Royalty</span>
                          <span className="text-white text-xs">10%</span>
                        </div>
                      </div>
                    </div>

                    {/* Activity */}
                    <div>
                      <h3 className="text-white font-medium mb-2 text-xs">Activity</h3>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between py-1.5 px-2 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                              <Zap className="w-2.5 h-2.5 text-green-400" />
                            </div>
                            <div>
                              <div className="text-white text-xs font-medium">Minted</div>
                              <div className="text-white/60 text-xs">2 hours ago</div>
                            </div>
                          </div>
                          <div className="text-white text-xs">1 STT</div>
                        </div>
                        
                        <div className="flex items-center justify-between py-1.5 px-2 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <Eye className="w-2.5 h-2.5 text-blue-400" />
                            </div>
                            <div>
                              <div className="text-white text-xs font-medium">Listed</div>
                              <div className="text-white/60 text-xs">1 hour ago</div>
                            </div>
                          </div>
                          <div className="text-white text-xs">1 STT</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Buy NFT Modal */}
      {showBuyModal && selectedSong && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Purchase NFT</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBuyModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* NFT Info */}
              <div className="flex items-center space-x-3">
                <img
                  src={selectedSong.imageUrl || '/placeholder-music.png'}
                  alt={selectedSong.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-white">{selectedSong.title}</h3>
                  <p className="text-gray-400">{selectedSong.artist || `Creator ${selectedSong.seller?.slice(0, 6)}...`}</p>
                </div>
              </div>

              {/* Price Info */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white font-semibold text-lg">
                    {selectedSong.priceInETH || '1'} STT
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Token ID:</span>
                  <span className="text-gray-300">#{selectedSong.tokenId}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-500">Seller:</span>
                  <span className="text-gray-300 font-mono">
                    {selectedSong.seller ? `${selectedSong.seller.slice(0, 6)}...${selectedSong.seller.slice(-4)}` : 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Buy Options */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleBuyNFT(selectedSong)}
                  disabled={isBuying || isMarketplaceLoading}
                >
                  {isBuying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing Purchase...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      {`Buy for ${selectedSong.priceInETH || '1'} STT`}
                    </>
                  )}
                </Button>
              </div>

              {/* Warning Text */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                <p className="text-xs text-blue-200 text-center">
                  💡 Make sure you have enough STT balance before purchasing. Transaction fees will apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ExplorePage };
