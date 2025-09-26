import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { profileStorage } from '@/utils/profileStorage';

// Mock contract address - replace with actual deployed address
const HIBEATS_PROFILE_CONTRACT = '0x1234567890123456789012345678901234567890';

export interface SocialProfile {
  address: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage: string;
  website: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  trackCount: number;
  totalPlays: number;
  totalEarnings: number;
  createdAt: number;
  creatorLevel: 'NEWCOMER' | 'RISING' | 'ESTABLISHED' | 'LEGEND';
}

export interface SocialStats {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  mutualFollowers: string[];
}

export const useSocial = () => {
  const { address } = useAccount();
  const [socialProfiles, setSocialProfiles] = useState<Map<string, SocialProfile>>(new Map());
  const [socialStats, setSocialStats] = useState<Map<string, SocialStats>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Load profile from storage on component mount
  useEffect(() => {
    if (address) {
      const profile = profileStorage.getProfile(address);
      if (profile) {
        setSocialProfiles(prev => new Map(prev).set(address, profile));
      } else {
        // Don't create default profile automatically - let user create their own
        console.log('No profile found for address:', address);
      }
    }
  }, [address]);

  // Follow a user
  const followUser = useCallback(async (targetAddress: string) => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Use real storage instead of mock
      const success = profileStorage.followUser(address, targetAddress);
      if (!success) {
        setError('Already following this user or cannot follow yourself');
        return false;
      }

      // Update local state with real stats
      const followerStats = profileStorage.getStats(targetAddress);
      const userStats = profileStorage.getStats(address);

      setSocialStats(prev => {
        const newStats = new Map(prev);
        
        // Update target user's stats
        newStats.set(targetAddress, {
          followerCount: followerStats.followerCount,
          followingCount: followerStats.followingCount,
          isFollowing: false,
          isFollowedBy: profileStorage.isFollowing(targetAddress, address),
          mutualFollowers: []
        });

        // Update current user's stats
        newStats.set(address, {
          followerCount: userStats.followerCount,
          followingCount: userStats.followingCount,
          isFollowing: true,
          isFollowedBy: profileStorage.isFollowing(targetAddress, address),
          mutualFollowers: []
        });

        return newStats;
      });

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to follow user');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Unfollow a user
  const unfollowUser = useCallback(async (targetAddress: string) => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Use real storage
      const success = profileStorage.unfollowUser(address, targetAddress);
      if (!success) {
        setError('Not currently following this user');
        return false;
      }

      // Update local state with real stats
      const followerStats = profileStorage.getStats(targetAddress);
      const userStats = profileStorage.getStats(address);

      setSocialStats(prev => {
        const newStats = new Map(prev);
        
        // Update target user's stats
        newStats.set(targetAddress, {
          followerCount: followerStats.followerCount,
          followingCount: followerStats.followingCount,
          isFollowing: false,
          isFollowedBy: profileStorage.isFollowing(targetAddress, address),
          mutualFollowers: []
        });

        // Update current user's stats
        newStats.set(address, {
          followerCount: userStats.followerCount,
          followingCount: userStats.followingCount,
          isFollowing: false,
          isFollowedBy: profileStorage.isFollowing(targetAddress, address),
          mutualFollowers: []
        });

        return newStats;
      });

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to unfollow user');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Get social stats for a user
  const getSocialStats = useCallback(async (userAddress: string): Promise<SocialStats | null> => {
    try {
      setIsLoading(true);
      
      // Get real stats from storage
      const stats = profileStorage.getStats(userAddress);
      const isFollowingUser = address ? profileStorage.isFollowing(address, userAddress) : false;
      const isFollowedByUser = address ? profileStorage.isFollowing(userAddress, address) : false;

      const realStats: SocialStats = {
        followerCount: stats.followerCount,
        followingCount: stats.followingCount,
        isFollowing: isFollowingUser,
        isFollowedBy: isFollowedByUser,
        mutualFollowers: [] // TODO: Calculate mutual followers
      };

      setSocialStats(prev => new Map(prev).set(userAddress, realStats));
      return realStats;
    } catch (err: any) {
      setError(err.message || 'Failed to get social stats');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Get profile from current state (synchronous)
  const getProfileFromState = useCallback((userAddress: string): SocialProfile | null => {
    return socialProfiles.get(userAddress) || null;
  }, [socialProfiles]);

  // Get user profile (loads from storage if not in state)
  const getUserProfile = useCallback(async (userAddress: string, forceRefresh: boolean = false): Promise<SocialProfile | null> => {
    try {
      setIsLoading(true);
      
      // Try to get from storage first
      let profile = profileStorage.getProfile(userAddress);
      
      if (!profile || forceRefresh) {
        // Don't create default profile if doesn't exist - return null instead
        if (!profile) {
          console.log('No profile found for user:', userAddress);
          return null;
        }
      }

      // Update local cache
      setSocialProfiles(prev => new Map(prev).set(userAddress, profile!));
      
      return profile;
    } catch (err: any) {
      setError(err.message || 'Failed to get user profile');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create or update profile
  const updateProfile = useCallback(async (profileData: Partial<SocialProfile>) => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Get current profile - don't create default if doesn't exist
      let currentProfile = profileStorage.getProfile(address);
      if (!currentProfile) {
        throw new Error('Profile does not exist. Please create a profile first.');
      }

      // Update profile in storage
      const updatedProfile = profileStorage.updateProfile(address, profileData);
      if (!updatedProfile) {
        throw new Error('Failed to update profile in storage');
      }

      // Update local state
      setSocialProfiles(prev => new Map(prev).set(address, updatedProfile));

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      console.error('❌ Profile update failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Get followers list
  const getFollowers = useCallback(async (userAddress: string, limit: number = 50): Promise<string[]> => {
    try {
      // Mock implementation - in production, read from smart contract
      const mockFollowers = Array.from({ length: Math.min(limit, 20) }, (_, i) => 
        `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`
      );
      
      return mockFollowers;
    } catch (err: any) {
      setError(err.message || 'Failed to get followers');
      return [];
    }
  }, []);

  // Get following list
  const getFollowing = useCallback(async (userAddress: string, limit: number = 50): Promise<string[]> => {
    try {
      // Mock implementation - in production, read from smart contract
      const mockFollowing = Array.from({ length: Math.min(limit, 20) }, (_, i) => 
        `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`
      );
      
      return mockFollowing;
    } catch (err: any) {
      setError(err.message || 'Failed to get following');
      return [];
    }
  }, []);

  // Check if user has profile
  const hasProfile = useCallback(async (userAddress: string): Promise<boolean> => {
    try {
      // Mock implementation - in production, read from smart contract
      return Math.random() > 0.3; // 70% chance of having profile
    } catch (err: any) {
      return false;
    }
  }, []);

  // Create new profile
  const createProfile = useCallback(async (
    username: string,
    displayName: string,
    bio: string,
    avatar?: string
  ) => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setError(null);
      setIsLoading(true);

      // In production, call smart contract
      /*
      writeContract({
        address: HIBEATS_PROFILE_CONTRACT,
        abi: HiBeatsProfileABI,
        functionName: 'createProfile',
        args: [username, displayName, bio, avatar || ''],
      });
      */

      // Mock implementation
      const newProfile: SocialProfile = {
        address,
        username,
        displayName,
        bio,
        avatar: avatar || '/api/placeholder/150/150',
        coverImage: '/api/placeholder/1200/300',
        website: '',
        isVerified: false,
        followerCount: 0,
        followingCount: 0,
        trackCount: 0,
        totalPlays: 0,
        totalEarnings: 0,
        createdAt: Date.now(),
        creatorLevel: 'NEWCOMER'
      };

      setSocialProfiles(prev => new Map(prev).set(address, newProfile));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, writeContract]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    socialProfiles: Array.from(socialProfiles.values()),
    socialStats: Array.from(socialStats.entries()).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, SocialStats>),
    isLoading: isLoading || isPending || isConfirming,
    error,
    isTransactionPending: isPending,
    isTransactionConfirming: isConfirming,
    isTransactionSuccess: isSuccess,

    // Actions
    followUser,
    unfollowUser,
    getUserProfile,
    getProfileFromState,
    getSocialStats,
    updateProfile,
    createProfile,
    getFollowers,
    getFollowing,
    hasProfile,
    clearError
  };
};