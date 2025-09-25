import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_DISCOVERY_ABI, HIBEATS_NFT_ABI } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { config } from '../config/web3';

export function useDiscovery() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Get trending tracks
  const { data: trendingTracks, refetch: refetchTrending, isLoading: isLoadingTrending } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
    abi: HIBEATS_DISCOVERY_ABI,
    functionName: 'getTrendingTracks',
    args: [BigInt(20)], // Get top 20 trending tracks
    query: {
      staleTime: 600000, // Cache for 10 minutes
      refetchOnWindowFocus: false,
      refetchInterval: false,
      enabled: false, // Start disabled, enable only when needed
      gcTime: 900000, // Keep in cache for 15 minutes
    },
  });

  // Get new releases
  const { data: newReleases, refetch: refetchNewReleases, isLoading: isLoadingNewReleases } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
    abi: HIBEATS_DISCOVERY_ABI,
    functionName: 'getNewReleases',
    args: [BigInt(15)], // Get 15 new releases
    query: {
      staleTime: 600000, // Cache for 10 minutes
      refetchOnWindowFocus: false,
      refetchInterval: false,
      enabled: false, // Start disabled, enable only when needed
      gcTime: 900000, // Keep in cache for 15 minutes
    },
  });

  // Get featured tracks
  const { data: featuredTracks, refetch: refetchFeatured, isLoading: isLoadingFeatured } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
    abi: HIBEATS_DISCOVERY_ABI,
    functionName: 'getFeaturedTracks',
    args: [BigInt(10)], // Get 10 featured tracks
    query: {
      staleTime: 600000, // Cache for 10 minutes
      refetchOnWindowFocus: false,
      refetchInterval: false,
      enabled: false, // Start disabled, enable only when needed
      gcTime: 900000, // Keep in cache for 15 minutes
    },
  });

  // Get user discovery feed (if user is connected)
  const { data: discoveryFeed, refetch: refetchDiscoveryFeed, isLoading: isLoadingDiscoveryFeed } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
    abi: HIBEATS_DISCOVERY_ABI,
    functionName: 'getUserDiscoveryFeed',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 600000, // Cache for 10 minutes
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  // Get user's recommended tracks (from discovery feed)
  const { data: recommendations, refetch: refetchRecommendations, isLoading: isLoadingRecommendations } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
    abi: HIBEATS_DISCOVERY_ABI,
    functionName: 'getUserDiscoveryFeed',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 600000, // Cache for 10 minutes
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  // Get tracks by genre
  const getTracksByGenre = (genre: string, limit: bigint = BigInt(10)) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
      abi: HIBEATS_DISCOVERY_ABI,
      functionName: 'getGenreTracks',
      args: [genre, limit],
    });
  };

  // Get track metrics
  const getTrackMetrics = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
      abi: HIBEATS_DISCOVERY_ABI,
      functionName: 'getTrackMetrics',
      args: [tokenId],
    });
  };

  // Get platform metrics
  const { data: platformMetrics, refetch: refetchPlatformMetrics } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
    abi: HIBEATS_DISCOVERY_ABI,
    functionName: 'getPlatformMetrics',
  });

  // Update track metrics (for authorized contracts/curators)
  const updateTrackMetrics = async (
    tokenId: bigint,
    plays: bigint = BigInt(0),
    likes: bigint = BigInt(0),
    shares: bigint = BigInt(0),
    comments: bigint = BigInt(0),
    playlistAdds: bigint = BigInt(0)
  ) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
        abi: HIBEATS_DISCOVERY_ABI,
        functionName: 'updateTrackMetrics',
        args: [tokenId, plays, likes, shares, comments, playlistAdds],
        chainId: config.chains[0].id,
        account: address,
        chain: config.chains[0],
      });
    } catch (error) {
      console.error('Error updating track metrics:', error);
      toast.error('Failed to update track metrics');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate recommendations for user
  const generateRecommendations = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
        abi: HIBEATS_DISCOVERY_ABI,
        functionName: 'generateRecommendations',
        args: [address],
        chainId: config.chains[0].id,
        account: address,
        chain: config.chains[0],
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate discovery feed for user
  const generateDiscoveryFeed = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
        abi: HIBEATS_DISCOVERY_ABI,
        functionName: 'generateDiscoveryFeed',
        args: [address],
        chainId: config.chains[0].id,
        account: address,
        chain: config.chains[0],
      });
    } catch (error) {
      console.error('Error generating discovery feed:', error);
      toast.error('Failed to generate discovery feed');
    } finally {
      setIsLoading(false);
    }
  };

  // Controlled refetch to prevent spam
  useEffect(() => {
    if (isSuccess) {
      toast.success('Operation completed successfully');
      
      // Only refetch specific data based on operation type
      // Add delay to prevent spam
      const refetchDelay = setTimeout(() => {
        refetchTrending();
        refetchNewReleases();
        refetchFeatured();
        refetchDiscoveryFeed();
        refetchRecommendations();
      }, 2000); // 2 second delay
      
      return () => clearTimeout(refetchDelay);
    }
  }, [isSuccess]); // Removed refetch functions from deps to prevent infinite loop

  useEffect(() => {
    if (error) {
      toast.error('Transaction failed');
      console.error('Discovery operation error:', error);
    }
  }, [error]);

  return {
    // Data
    trendingTracks,
    newReleases,
    featuredTracks,
    discoveryFeed,
    recommendations,
    platformMetrics,
    
    // Loading states
    isLoadingTrending,
    isLoadingNewReleases,
    isLoadingFeatured,
    isLoadingDiscoveryFeed,
    isLoadingRecommendations,
    isLoading,
    isConfirming,
    isPending,
    
    // Functions
    getTracksByGenre,
    getTrackMetrics,
    updateTrackMetrics,
    generateRecommendations,
    generateDiscoveryFeed,
    
    // Refetch functions
    refetchTrending,
    refetchNewReleases,
    refetchFeatured,
    refetchDiscoveryFeed,
    refetchRecommendations,
    refetchPlatformMetrics,
    
    // Transaction data
    hash,
    isSuccess,
    error,
  };
}
