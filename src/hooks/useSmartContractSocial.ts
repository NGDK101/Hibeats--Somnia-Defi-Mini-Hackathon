import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_PROFILE_ABI } from '@/contracts';
import { toast } from 'sonner';
import { useState, useCallback, useEffect } from 'react';

export function useSmartContractSocial() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: userProfile, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'profiles',
    args: address ? [address] : undefined,
  });

  const createProfile = useCallback(async (username: string, displayName: string, bio: string, avatarURI: string) => {
    // Prevent duplicate transactions
    if (isLoading || isPending || isConfirming) {
      console.warn('Profile creation already in progress, skipping...');
      return;
    }

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
        args: [username, displayName, bio, avatarURI],
      });

      toast.success('Profile creation initiated!');
    } catch (err) {
      console.error('Error creating profile:', err);
      toast.error('Failed to create profile');
      setIsLoading(false);
    }
  }, [address, writeContract, isLoading, isPending, isConfirming]);

  const updateProfile = useCallback(async (profileData: any) => {
    // Prevent duplicate transactions
    if (isLoading || isPending || isConfirming) {
      console.warn('Profile update already in progress, skipping...');
      return;
    }

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
          profileData.avatar || '',
          profileData.coverImage || '',
          profileData.website || '',
          profileData.twitter || '',
          profileData.instagram || '',
          profileData.spotify || '',
        ],
      });

      toast.success('Profile update initiated!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
      setIsLoading(false);
    }
  }, [address, writeContract, isLoading, isPending, isConfirming]);

  const followUser = useCallback(async (targetAddress: string) => {
    // Prevent duplicate transactions
    if (isLoading || isPending || isConfirming) {
      console.warn('Follow action already in progress, skipping...');
      return;
    }

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
        args: [targetAddress as `0x${string}`],
      });

      toast.success('Follow action initiated!');
    } catch (err) {
      console.error('Error following user:', err);
      toast.error('Failed to follow user');
      setIsLoading(false);
    }
  }, [address, writeContract, isLoading, isPending, isConfirming]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      refetchProfile();
      toast.success('Transaction completed successfully!');
    }
  }, [isSuccess, refetchProfile]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      setIsLoading(false);
      console.error('Transaction error:', error);
      toast.error('Transaction failed: ' + error.message);
    }
  }, [error]);

  return {
    userProfile,
    createProfile,
    updateProfile,
    followUser,
    refetchProfile,
    isLoading: isLoading || isPending || isConfirming,
    hash,
    error,
  };
}
