import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_ANALYTICS_ABI } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { config } from '../config/web3';

export function useAnalytics() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Record analytics event
  const recordEvent = async (eventType: string, tokenId: bigint, value: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
        abi: HIBEATS_ANALYTICS_ABI,
        functionName: 'recordEvent',
        args: [address, eventType, tokenId, value],
        chainId: config.chains[0].id,
        account: address,
        chain: config.chains[0],
      });
    } catch (error) {
      console.error('Error recording analytics event:', error);
      toast.error('Failed to record analytics event');
    } finally {
      setIsLoading(false);
    }
  };

  // Get user stats
  const { data: userStats, refetch: refetchUserStats } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
    abi: HIBEATS_ANALYTICS_ABI,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
  });

  // Get track stats
  const getTrackStats = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
      abi: HIBEATS_ANALYTICS_ABI,
      functionName: 'getTrackStats',
      args: [tokenId],
    });
  };

  // Get total stats
  const { data: totalStats } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
    abi: HIBEATS_ANALYTICS_ABI,
    functionName: 'getTotalStats',
  });

  // Get recent events
  const { data: recentEvents } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
    abi: HIBEATS_ANALYTICS_ABI,
    functionName: 'getRecentEvents',
    args: [BigInt(10)], // Get last 10 events
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('Analytics event recorded successfully');
      refetchUserStats();
    }
  }, [isSuccess, refetchUserStats]);

  useEffect(() => {
    if (error) {
      console.error('Analytics error:', error);
      toast.error('Failed to record analytics event');
    }
  }, [error]);

  return {
    recordEvent,
    userStats,
    getTrackStats,
    totalStats,
    recentEvents,
    isLoading: isLoading || isPending,
    isConfirming,
    isSuccess,
  };
}
