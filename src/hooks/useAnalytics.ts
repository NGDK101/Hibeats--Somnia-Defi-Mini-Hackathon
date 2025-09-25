import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_ANALYTICS_ABI, HIBEATS_INTERACTION_MANAGER_ABI } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';

export interface TrackAnalytics {
  tokenId: number;
  totalPlays: number;
  uniqueListeners: number;
  averageListenTime: number;
  skipRate: number;
  likeRate: number;
  shareCount: number;
  revenue: bigint;
  marketValue: bigint;
}

export interface UserAnalytics {
  totalTracks: number;
  totalPlays: number;
  totalEarnings: bigint;
  totalSpent: bigint;
  averageSessionTime: number;
  lastActiveTime: number;
  socialScore: number;
  creatorScore: number;
  favoriteGenres: string[];
  topTracks: number[];
}

export interface AnalyticsEvent {
  user: string;
  eventType: string;
  tokenId: number;
  value: number;
  timestamp: number;
  metadata: string;
}

export function useAnalytics() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  // Write contract operations with error handling
  const writeContractResult = useWriteContract();
  const { writeContract, data: hash, error, isPending } = writeContractResult || {
    writeContract: () => {},
    data: undefined,
    error: null,
    isPending: false
  };

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Get user analytics
  const { data: userAnalyticsData, refetch: refetchUserAnalytics } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
    abi: HIBEATS_ANALYTICS_ABI,
    functionName: 'getUserAnalytics',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get user dashboard data
  const { data: userDashboardData, refetch: refetchUserDashboard } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
    abi: HIBEATS_ANALYTICS_ABI,
    functionName: 'getUserDashboard',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Transform user analytics data
  const userAnalytics: UserAnalytics | null = useMemo(() => {
    if (!userAnalyticsData) return null;

    try {
      const data = userAnalyticsData as any;
      return {
        totalTracks: Number(data.totalTracks || 0),
        totalPlays: Number(data.totalPlays || 0),
        totalEarnings: data.totalEarnings || 0n,
        totalSpent: data.totalSpent || 0n,
        averageSessionTime: Number(data.averageSessionTime || 0),
        lastActiveTime: Number(data.lastActiveTime || 0),
        socialScore: Number(data.socialScore || 0),
        creatorScore: Number(data.creatorScore || 0),
        favoriteGenres: data.favoriteGenres || [],
        topTracks: data.topTracks ? data.topTracks.map((id: any) => Number(id)) : [],
      };
    } catch (error) {
      console.warn('Error transforming user analytics data:', error);
      return null;
    }
  }, [userAnalyticsData]);

  // Record a play event
  const recordPlay = async (tokenId: number, duration: number, sessionTime: number) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      await writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
        abi: HIBEATS_ANALYTICS_ABI,
        functionName: 'recordPlay',
        args: [address, BigInt(tokenId), BigInt(duration), BigInt(sessionTime)],
      });

    } catch (err) {
      console.error('Error recording play:', err);
      toast.error('Failed to record play');
      setIsLoading(false);
    }
  };

  // Record social interaction (like, share, comment)
  const recordSocialInteraction = async (
    interactionType: 'like' | 'share' | 'comment' | 'follow',
    tokenId: number,
    targetUser?: string
  ) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      await writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
        abi: HIBEATS_ANALYTICS_ABI,
        functionName: 'recordSocialInteraction',
        args: [
          address,
          interactionType,
          BigInt(tokenId),
          (targetUser || address) as `0x${string}`
        ],
      });

    } catch (err) {
      console.error('Error recording social interaction:', err);
      toast.error('Failed to record interaction');
      setIsLoading(false);
    }
  };

  // Record interaction via interaction manager
  const recordInteraction = async (
    action: string,
    tokenId: number,
    value: number = 1
  ) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      await writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
        abi: HIBEATS_INTERACTION_MANAGER_ABI,
        functionName: 'recordInteraction',
        args: [address, action, BigInt(tokenId), BigInt(value)],
      });

    } catch (err) {
      console.error('Error recording interaction:', err);
      toast.error('Failed to record interaction');
      setIsLoading(false);
    }
  };

  // Get track analytics for a specific token
  const getTrackAnalytics = (tokenId: number) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
      abi: HIBEATS_ANALYTICS_ABI,
      functionName: 'getTrackAnalytics',
      args: [BigInt(tokenId)],
      query: {
        enabled: tokenId > 0,
      },
    });
  };

  // Get track events for a specific token
  const getTrackEvents = (tokenId: number, limit: number = 50) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
      abi: HIBEATS_ANALYTICS_ABI,
      functionName: 'getTrackEvents',
      args: [BigInt(tokenId), BigInt(limit)],
      query: {
        enabled: tokenId > 0,
      },
    });
  };

  // Get user interaction counts
  const getUserInteractionCount = (userAddress: string, interactionType: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
      abi: HIBEATS_INTERACTION_MANAGER_ABI,
      functionName: 'userInteractionCounts',
      args: [userAddress as `0x${string}`, interactionType],
      query: {
        enabled: !!userAddress && !!interactionType,
      },
    });
  };

  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      refetchUserAnalytics();
      refetchUserDashboard();
      toast.success('Interaction recorded successfully!');
    }
  }, [isSuccess, refetchUserAnalytics, refetchUserDashboard]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      toast.error('Failed to record interaction: ' + error.message);
    }
  }, [error]);

  // Mock function to get user interactions for portfolio activity
  const getUserInteractions = async () => {
    try {
      // In a real app, this would fetch from the blockchain or analytics service
      // For now, return mock data based on user analytics
      const mockInteractions = [
        {
          id: 1,
          user_id: 1,
          song_id: '1',
          interaction_type: 'play',
          timestamp: Date.now() - 3600000, // 1 hour ago
        },
        {
          id: 2,
          user_id: 1,
          song_id: '2',
          interaction_type: 'like',
          timestamp: Date.now() - 7200000, // 2 hours ago
        },
        {
          id: 3,
          user_id: 1,
          song_id: '1',
          interaction_type: 'share',
          timestamp: Date.now() - 14400000, // 4 hours ago
        },
        {
          id: 4,
          user_id: 1,
          song_id: '3',
          interaction_type: 'comment',
          timestamp: Date.now() - 21600000, // 6 hours ago
        },
        {
          id: 5,
          user_id: 1,
          interaction_type: 'follow',
          timestamp: Date.now() - 86400000, // 1 day ago
        }
      ];

      return mockInteractions;
    } catch (error) {
      console.error('Error fetching user interactions:', error);
      return [];
    }
  };

  return {
    // Data
    userAnalytics,
    userDashboardData,

    // Functions for specific analytics
    getTrackAnalytics,
    getTrackEvents,
    getUserInteractionCount,
    getUserInteractions,

    // Actions
    recordPlay,
    recordSocialInteraction,
    recordInteraction,

    // Refetch functions
    refetchUserAnalytics,
    refetchUserDashboard,

    // State
    isLoading: isLoading || isPending || isConfirming,
    hash,
    error,
  };
}

// Hook for real-time track analytics
export function useTrackAnalytics(tokenId: number) {
  const analytics = useAnalytics();

  const { data: trackAnalyticsData, refetch } = analytics.getTrackAnalytics(tokenId);
  const { data: trackEventsData } = analytics.getTrackEvents(tokenId, 100);

  const trackAnalytics: TrackAnalytics | null = useMemo(() => {
    if (!trackAnalyticsData) return null;

    const data = trackAnalyticsData as any;
    return {
      tokenId,
      totalPlays: Number(data.totalPlays || 0),
      uniqueListeners: Number(data.uniqueListeners || 0),
      averageListenTime: Number(data.averageListenTime || 0),
      skipRate: Number(data.skipRate || 0),
      likeRate: Number(data.likeRate || 0),
      shareCount: Number(data.shareCount || 0),
      revenue: data.revenue || 0n,
      marketValue: data.marketValue || 0n,
    };
  }, [trackAnalyticsData, tokenId]);

  // Extract likes, shares, and comments from events
  const interactions = useMemo(() => {
    if (!trackEventsData || !Array.isArray(trackEventsData)) {
      return { likes: 0, shares: 0, comments: 0, views: 0 };
    }

    const events = (trackEventsData as unknown) as AnalyticsEvent[];
    const likes = events.filter(e => e.eventType === 'like').length;
    const shares = events.filter(e => e.eventType === 'share').length;
    const comments = events.filter(e => e.eventType === 'comment').length;
    const views = events.filter(e => e.eventType === 'view' || e.eventType === 'play').length;

    return { likes, shares, comments, views: views || trackAnalytics?.totalPlays || 0 };
  }, [trackEventsData, trackAnalytics]);

  return {
    trackAnalytics,
    interactions,
    events: (trackEventsData as unknown) as AnalyticsEvent[] || [],
    refetch,
    recordPlay: analytics.recordPlay,
    recordSocialInteraction: analytics.recordSocialInteraction,
    isLoading: analytics.isLoading,
  };
}
