import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, HIBEATS_PROFILE_ABI, type ProfileData } from '../contracts';
import { CreatorLevel } from '../types/music';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { checkMetaMask } from '../utils/metamask-check';

export function useProfile() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const hasShownSuccessToast = useRef(false);
  
  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract({
    mutation: {
      onError: (error: any) => {

        if (error?.message?.includes('User rejected') || error?.message?.includes('User denied') || error?.message?.includes('rejected')) {
          toast.error('Transaction cancelled by user');
        } else if (error?.message?.includes('no profile')) {
          toast.error('Target user has no profile');
        } else if (error?.message?.includes('Already following')) {
          toast.error('You are already following this user');
        } else if (error?.message?.includes('Not following')) {
          toast.error('You are not following this user');
        } else if (error?.message?.includes('need a profile')) {
          toast.error('You need to create a profile first');
        } else if (error?.message?.includes('Cannot follow yourself')) {
          toast.error('You cannot follow yourself');
        } else {
          toast.error('Transaction failed');
        }
      },
    },
  });
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user profile
  const { data: userProfile, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'profiles',
    args: address ? [address] : undefined,
  });

  // Read profile exists
  const { data: profileExists } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'hasProfile',
    args: address ? [address] : undefined,
  });

  // Read user stats
  const { data: userStats, refetch: refetchStats } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'getFollowStats',
    args: address ? [address] : undefined,
  });

  // For now, we'll create placeholder arrays for followers and following
  // These would need to be implemented via events or separate functions
  const followers: string[] = [];
  const following: string[] = [];
  const collectedNFTs: any[] = [];

  const refetchCollection = () => Promise.resolve();
  const refetchFollowers = () => Promise.resolve();
  const refetchFollowing = () => Promise.resolve();

  // Create profile
  const createProfile = async (profileData: ProfileData) => {
    // Check MetaMask
    const metamaskStatus = checkMetaMask();

    if (!metamaskStatus.installed) {
      toast.error(metamaskStatus.error || 'MetaMask not found');
      return;
    }

    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!CONTRACT_ADDRESSES.HIBEATS_PROFILE) {
      toast.error('Contract not configured');
      return;
    }

    try {
      setIsLoading(true);

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
        abi: HIBEATS_PROFILE_ABI,
        functionName: 'createProfile',
        args: [
          profileData.username,
          profileData.displayName || profileData.username,
          profileData.bio || '',
          profileData.avatarURI || '',
        ],
      });

      toast.success('Opening MetaMask...');
    } catch (err: any) {
      toast.error(`Failed: ${err?.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Update profile (8 params - unified HiBeatsProfile)
  const updateProfile = async (profileData: Partial<ProfileData>) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
        abi: HIBEATS_PROFILE_ABI,
        functionName: 'updateProfile',
        args: [
          profileData.displayName || '',
          profileData.bio || '',
          profileData.avatar || profileData.avatarURI || '',      // profileImageUrl
          profileData.coverImage || profileData.bannerURI || '',  // bannerImageUrl
          profileData.website || '',
          profileData.twitter || '',                               // ✅ Added
          profileData.instagram || '',                             // ✅ Added
          profileData.spotify || '',                               // ✅ Added
        ],
      });

      toast.success('Profile update initiated!');
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
      setIsLoading(false);
      return false;
    }
  };

  // Follow user
  const followUser = async (userAddress: string) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
        abi: HIBEATS_PROFILE_ABI,
        functionName: 'followCreator',
        args: [userAddress as `0x${string}`],
      });

      toast.success('Follow action initiated!');
    } catch (err: any) {
      console.error('Error following user:', err);

      if (err?.message?.includes('User rejected') || err?.message?.includes('User denied')) {
        toast.error('Transaction cancelled');
      } else if (err?.message?.includes('no profile')) {
        toast.error('Target user has no profile');
      } else if (err?.message?.includes('Already following')) {
        toast.error('You are already following this user');
      } else {
        toast.error('Failed to follow user');
      }

      setIsLoading(false);
    }
  };

  // Unfollow user
  const unfollowUser = async (userAddress: string) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
        abi: HIBEATS_PROFILE_ABI,
        functionName: 'unfollowCreator',
        args: [userAddress as `0x${string}`],
      });

      toast.success('Unfollow action initiated!');
    } catch (err: any) {
      console.error('Error unfollowing user:', err);

      if (err?.message?.includes('User rejected') || err?.message?.includes('User denied')) {
        toast.error('Transaction cancelled');
      } else if (err?.message?.includes('Not following')) {
        toast.error('You are not following this user');
      } else {
        toast.error('Failed to unfollow user');
      }

      setIsLoading(false);
    }
  };

  // Check if following user
  const isFollowing = (targetAddress: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
      abi: HIBEATS_PROFILE_ABI,
      functionName: 'isFollowing',
      args: address && targetAddress ? [address, targetAddress as `0x${string}`] : undefined,
    });
  };

  // Get profile by address
  const getProfileByAddress = (userAddress: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
      abi: HIBEATS_PROFILE_ABI,
      functionName: 'profiles',
      args: userAddress ? [userAddress as `0x${string}`] : undefined,
    });
  };

  // Get creator level from contract
  const getCreatorLevel = (userAddress?: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
      abi: HIBEATS_PROFILE_ABI,
      functionName: 'getCreatorLevel',
      args: userAddress ? [userAddress as `0x${string}`] : address ? [address] : undefined,
    });
  };

  // Reset toast flag when new transaction starts
  useEffect(() => {
    if (hash) {
      hasShownSuccessToast.current = false;
    }
  }, [hash]);

  // Effects
  useEffect(() => {
    if (isSuccess && !hasShownSuccessToast.current) {
      setIsLoading(false);
      refetchProfile();
      refetchStats();
      refetchCollection();
      refetchFollowers();
      refetchFollowing();
      toast.success('Profile transaction completed!');
      hasShownSuccessToast.current = true;
    }
  }, [isSuccess, refetchProfile, refetchStats, refetchCollection, refetchFollowers, refetchFollowing]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      toast.error('Profile transaction failed: ' + error.message);
    }
  }, [error]);

  return {
    // Actions
    createProfile,
    updateProfile,
    followUser,
    unfollowUser,
    
    // Queries
    isFollowing,
    getProfileByAddress,
    getCreatorLevel,
    
    // Data
    userProfile,
    profileExists: profileExists || false,
    userStats,
    collectedNFTs: collectedNFTs || [],
    followers: followers || [],
    following: following || [],
    
    // State
    isLoading: isLoading || isPending || isConfirming,
    hash,
    error,
  };
}
