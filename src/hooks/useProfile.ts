import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, HIBEATS_PROFILE_ABI, type ProfileData } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function useProfile() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  
  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user profile
  const { data: userProfile, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'getProfile',
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
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
  });

  // Read user's collected NFTs
  const { data: collectedNFTs, refetch: refetchCollection } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'getUserNFTs',
    args: address ? [address] : undefined,
  });

  // Read user's followers
  const { data: followers, refetch: refetchFollowers } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'getFollowers',
    args: address ? [address] : undefined,
  });

  // Read users following
  const { data: following, refetch: refetchFollowing } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'getFollowing',
    args: address ? [address] : undefined,
  });

  // Create profile
  const createProfile = async (profileData: ProfileData) => {
    if (!address) {
      toast.error('Please connect your wallet first');
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
          profileData.bio,
          profileData.avatarURI,
          profileData.bannerURI,
          profileData.website,
          profileData.socialLinks,
          profileData.musicGenres,
          profileData.isVerified || false
        ],
      });

      toast.success('Profile creation initiated!');
    } catch (err) {
      console.error('Error creating profile:', err);
      toast.error('Failed to create profile');
      setIsLoading(false);
    }
  };

  // Update profile
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
          profileData.username || '',
          profileData.bio || '',
          profileData.avatarURI || '',
          profileData.bannerURI || '',
          profileData.website || '',
          profileData.socialLinks || [],
          profileData.musicGenres || []
        ],
      });

      toast.success('Profile update initiated!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
      setIsLoading(false);
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
        functionName: 'followUser',
        args: [userAddress as `0x${string}`],
      });

      toast.success('Follow action initiated!');
    } catch (err) {
      console.error('Error following user:', err);
      toast.error('Failed to follow user');
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
        functionName: 'unfollowUser',
        args: [userAddress as `0x${string}`],
      });

      toast.success('Unfollow action initiated!');
    } catch (err) {
      console.error('Error unfollowing user:', err);
      toast.error('Failed to unfollow user');
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
      functionName: 'getProfile',
      args: userAddress ? [userAddress as `0x${string}`] : undefined,
    });
  };

  // Effects
  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      refetchProfile();
      refetchStats();
      refetchCollection();
      refetchFollowers();
      refetchFollowing();
      toast.success('Profile transaction completed!');
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
