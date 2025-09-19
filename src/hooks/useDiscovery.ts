import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_DISCOVERY_ABI } from '../contracts';
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

  // Update discovery score
  const updateDiscoveryScore = async (tokenId: bigint, score: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
        abi: HIBEATS_DISCOVERY_ABI,
        functionName: 'updateDiscoveryScore',
        args: [tokenId, score],
        chainId: config.chains[0].id,
        account: address,
        chain: config.chains[0],
      });
    } catch (error) {
      console.error('Error updating discovery score:', error);
      toast.error('Failed to update discovery score');
    } finally {
      setIsLoading(false);
    }
  };

  // Get trending tracks
  const { data: trendingTracks, refetch: refetchTrending } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
    abi: HIBEATS_DISCOVERY_ABI,
    functionName: 'getTrendingTracks',
    args: [BigInt(20)], // Get top 20 trending tracks
  });

  // Get tracks by genre
  const getTracksByGenre = (genre: string, limit: bigint = BigInt(10)) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
      abi: HIBEATS_DISCOVERY_ABI,
      functionName: 'getTracksByGenre',
      args: [genre, limit],
    });
  };

  // Get tracks by creator
  const getTracksByCreator = (creator: `0x${string}`, limit: bigint = BigInt(10)) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
      abi: HIBEATS_DISCOVERY_ABI,
      functionName: 'getTracksByCreator',
      args: [creator, limit],
    });
  };

  // Get discovery score for a track
  const getDiscoveryScore = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
      abi: HIBEATS_DISCOVERY_ABI,
      functionName: 'getDiscoveryScore',
      args: [tokenId],
    });
  };

  // Get recommended tracks
  const { data: recommendedTracks, refetch: refetchRecommended } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
    abi: HIBEATS_DISCOVERY_ABI,
    functionName: 'getRecommendedTracks',
    args: [BigInt(10)], // Get 10 recommended tracks
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('Discovery score updated successfully');
      refetchTrending();
      refetchRecommended();
    }
  }, [isSuccess, refetchTrending, refetchRecommended]);

  useEffect(() => {
    if (error) {
      console.error('Discovery error:', error);
      toast.error('Failed to update discovery score');
    }
  }, [error]);

  return {
    updateDiscoveryScore,
    trendingTracks,
    getTracksByGenre,
    getTracksByCreator,
    getDiscoveryScore,
    recommendedTracks,
    isLoading: isLoading || isPending,
    isConfirming,
    isSuccess,
  };
}
