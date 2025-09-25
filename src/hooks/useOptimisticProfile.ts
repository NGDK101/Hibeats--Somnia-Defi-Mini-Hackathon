import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useProfile } from './useProfile';

export interface OptimisticProfileData {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage: string;
  website: string;
  twitter: string;
  instagram: string;
  spotify: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  trackCount: number;
}

export function useOptimisticProfile() {
  const { address } = useAccount();
  const { userProfile, updateProfile, isLoading } = useProfile();
  const [optimisticProfile, setOptimisticProfile] = useState<OptimisticProfileData | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setOptimisticProfile({
        username: userProfile[0] as string || '',
        displayName: userProfile[1] as string || '',
        bio: userProfile[2] as string || '',
        avatar: userProfile[3] as string || '',
        coverImage: userProfile[4] as string || '',
        website: userProfile[5] as string || '',
        twitter: '',
        instagram: '',
        spotify: '',
        isVerified: userProfile[7] as boolean || false,
        followerCount: Number(userProfile[10]) || 0,
        followingCount: Number(userProfile[11]) || 0,
        trackCount: Number(userProfile[12]) || 0,
      });
    }
  }, [userProfile]);

  const updateOptimisticProfile = useCallback(async (data: Partial<OptimisticProfileData>) => {
    if (!optimisticProfile) return false;

    // Update optimistically
    setIsPending(true);
    setOptimisticProfile({ ...optimisticProfile, ...data });

    try {
      const success = await updateProfile(data);
      if (!success) {
        // Revert on failure
        setOptimisticProfile(optimisticProfile);
      }
      return success;
    } catch (error) {
      // Revert on error
      setOptimisticProfile(optimisticProfile);
      return false;
    } finally {
      setIsPending(false);
    }
  }, [optimisticProfile, updateProfile]);

  return {
    profile: optimisticProfile,
    updateProfile: updateOptimisticProfile,
    isLoading: isLoading || isPending,
  };
}
