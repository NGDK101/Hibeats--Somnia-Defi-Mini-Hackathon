import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_INTERACTION_MANAGER_ABI } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { config } from '../config/web3';

export function useInteraction() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Record interaction
  const recordInteraction = async (tokenId: bigint, interactionType: number) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION,
        abi: HIBEATS_INTERACTION_MANAGER_ABI,
        functionName: 'recordInteraction',
        args: [tokenId, interactionType],
        chainId: config.chains[0].id,
        account: address,
        chain: config.chains[0],
      });
    } catch (error) {
      console.error('Error recording interaction:', error);
      toast.error('Failed to record interaction');
    } finally {
      setIsLoading(false);
    }
  };

  // Get user interaction for a track
  const getUserInteraction = (user: `0x${string}`, tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION,
      abi: HIBEATS_INTERACTION_MANAGER_ABI,
      functionName: 'getUserInteraction',
      args: [user, tokenId],
    });
  };

  // Get track interactions
  const getTrackInteractions = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION,
      abi: HIBEATS_INTERACTION_MANAGER_ABI,
      functionName: 'getTrackInteractions',
      args: [tokenId],
    });
  };

  // Get user interaction history
  const getUserInteractionHistory = (user: `0x${string}`) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION,
      abi: HIBEATS_INTERACTION_MANAGER_ABI,
      functionName: 'getUserInteractionHistory',
      args: [user],
    });
  };

  // Get most interacted tracks
  const { data: mostInteractedTracks, refetch: refetchMostInteracted } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'getMostInteractedTracks',
    args: [BigInt(20)], // Get top 20 most interacted tracks
  });

  // Helper functions for common interactions
  const likeTrack = async (tokenId: bigint) => {
    await recordInteraction(tokenId, 0); // Assuming 0 = like
  };

  const shareTrack = async (tokenId: bigint) => {
    await recordInteraction(tokenId, 1); // Assuming 1 = share
  };

  const playTrack = async (tokenId: bigint) => {
    await recordInteraction(tokenId, 2); // Assuming 2 = play
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success('Interaction recorded successfully');
      refetchMostInteracted();
    }
  }, [isSuccess, refetchMostInteracted]);

  useEffect(() => {
    if (error) {
      console.error('Interaction error:', error);
      toast.error('Failed to record interaction');
    }
  }, [error]);

  return {
    recordInteraction,
    getUserInteraction,
    getTrackInteractions,
    getUserInteractionHistory,
    mostInteractedTracks,
    likeTrack,
    shareTrack,
    playTrack,
    isLoading: isLoading || isPending,
    isConfirming,
    isSuccess,
  };
}
