import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_PROFILE_ABI } from '../contracts';

export interface CreatorProfile {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage: string;
  website: string;
  socialLinks: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: bigint;
  followerCount: bigint;
  followingCount: bigint;
  trackCount: bigint;
  totalPlays: bigint;
  totalEarnings: bigint;
}

export interface CreatorsResult {
  creatorList: CreatorProfile[];
  addresses: string[];
  total: bigint;
}

export function useCreators() {
  // Read active creators (most relevant for explore page)
  const {
    data: activeCreators,
    isLoading: isLoadingActive,
    error: activeError,
    refetch: refetchActive
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'readActiveCreators',
    args: [BigInt(0), BigInt(12)], // Get first 12 active creators
  });

  // Read recent creators
  const {
    data: recentCreators,
    isLoading: isLoadingRecent,
    error: recentError,
    refetch: refetchRecent
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'readRecentCreators',
    args: [BigInt(0), BigInt(12)], // Get first 12 recent creators
  });

  // Read top creators by tracks
  const {
    data: topCreatorsByTracks,
    isLoading: isLoadingTopTracks,
    error: topTracksError,
    refetch: refetchTopTracks
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'readTopCreatorsByTracks',
    args: [BigInt(0), BigInt(12)], // Get first 12 top creators by tracks
  });

  // Read top creators by earnings
  const {
    data: topCreatorsByEarnings,
    isLoading: isLoadingTopEarnings,
    error: topEarningsError,
    refetch: refetchTopEarnings
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'readTopCreatorsByEarnings',
    args: [BigInt(0), BigInt(12)], // Get first 12 top creators by earnings
  });

  // Read all profiles (fallback)
  const {
    data: allProfiles,
    isLoading: isLoadingAll,
    error: allError,
    refetch: refetchAll
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'readAllProfiles',
    args: [BigInt(0), BigInt(20)], // Get first 20 profiles
  });

  // Get total stats
  const {
    data: totalStats,
    isLoading: isLoadingStats,
    error: statsError
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'readTotalStats',
  });

  // Helper function to normalize creator data
  const normalizeCreatorData = (result: any) => {
    if (!result || !result[0]) return [];

    const [creatorList, addresses] = result;

    return creatorList.map((creator: CreatorProfile, index: number) => ({
      ...creator,
      address: addresses?.[index] || '',
      // Convert BigInt to numbers for easier use in UI
      followerCount: Number(creator.followerCount || 0),
      followingCount: Number(creator.followingCount || 0),
      trackCount: Number(creator.trackCount || 0),
      totalPlays: Number(creator.totalPlays || 0),
      totalEarnings: Number(creator.totalEarnings || 0),
      createdAt: Number(creator.createdAt || 0),
    }));
  };

  // Get featured creators (combination of active and top performers)
  const getFeaturedCreators = () => {
    // Priority: Active creators first, then top by tracks, then recent
    const active = activeCreators ? normalizeCreatorData(activeCreators) : [];
    const topTracks = topCreatorsByTracks ? normalizeCreatorData(topCreatorsByTracks) : [];
    const recent = recentCreators ? normalizeCreatorData(recentCreators) : [];

    // Combine and deduplicate by address
    const seen = new Set();
    const combined = [];

    // Add active creators first
    for (const creator of active) {
      if (!seen.has(creator.address) && creator.isActive) {
        seen.add(creator.address);
        combined.push({ ...creator, source: 'active' });
      }
    }

    // Add top creators by tracks
    for (const creator of topTracks) {
      if (!seen.has(creator.address) && creator.isActive && creator.trackCount > 0) {
        seen.add(creator.address);
        combined.push({ ...creator, source: 'top_tracks' });
      }
    }

    // Add recent creators to fill remaining slots
    for (const creator of recent) {
      if (!seen.has(creator.address) && creator.isActive && combined.length < 12) {
        seen.add(creator.address);
        combined.push({ ...creator, source: 'recent' });
      }
    }

    return combined.slice(0, 12);
  };

  const isLoading = isLoadingActive || isLoadingRecent || isLoadingTopTracks || isLoadingTopEarnings || isLoadingAll;
  const hasError = activeError || recentError || topTracksError || topEarningsError || allError;

  return {
    // Raw data
    activeCreators: activeCreators ? normalizeCreatorData(activeCreators) : [],
    recentCreators: recentCreators ? normalizeCreatorData(recentCreators) : [],
    topCreatorsByTracks: topCreatorsByTracks ? normalizeCreatorData(topCreatorsByTracks) : [],
    topCreatorsByEarnings: topCreatorsByEarnings ? normalizeCreatorData(topCreatorsByEarnings) : [],
    allProfiles: allProfiles ? normalizeCreatorData(allProfiles) : [],

    // Combined featured creators
    featuredCreators: getFeaturedCreators(),

    // Stats
    totalStats: totalStats ? {
      totalUsersCount: Number(totalStats[0] || 0),
      totalActiveUsers: Number(totalStats[1] || 0),
      totalVerifiedUsers: Number(totalStats[2] || 0),
      totalTracks: Number(totalStats[3] || 0),
      totalPlays: Number(totalStats[4] || 0),
      totalEarnings: Number(totalStats[5] || 0),
    } : null,

    // Loading states
    isLoading,
    isLoadingActive,
    isLoadingRecent,
    isLoadingTopTracks,
    isLoadingTopEarnings,
    isLoadingAll,
    isLoadingStats,

    // Errors
    error: hasError,
    activeError,
    recentError,
    topTracksError,
    topEarningsError,
    allError,
    statsError,

    // Refetch functions
    refetchActive,
    refetchRecent,
    refetchTopTracks,
    refetchTopEarnings,
    refetchAll,
    refetchAllCreators: () => {
      refetchActive();
      refetchRecent();
      refetchTopTracks();
      refetchTopEarnings();
      refetchAll();
    }
  };
}