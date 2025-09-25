import { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { toast } from 'sonner';
import { hibeatsfactoryAbi } from '@/contracts/abis/HiBeatsFactory';
import { useToken } from './useToken';
import { showQuickRewardFeedback } from '@/components/notifications/RewardNotificationProvider';

interface UserRewardStats {
  totalRewardsEarned: string;
  lastRewardTime: string;
  consecutiveLoginDays: number;
  lastLoginDay: number;
}

interface DailyLoginState {
  isLoading: boolean;
  canClaim: boolean;
  stats: UserRewardStats | null;
  streakBonus: number;
}

export const useDailyLogin = () => {
  const { address } = useAccount();
  const { forceRefreshBalance } = useToken(); // Import force refresh function
  const [state, setState] = useState<DailyLoginState>({
    isLoading: false,
    canClaim: false,
    stats: null,
    streakBonus: 0
  });

  const factoryAddress = import.meta.env.VITE_HIBEATS_FACTORY_ADDRESS as `0x${string}`;

  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user reward stats
  const { data: userStatsData, refetch: refetchStats } = useReadContract({
    address: factoryAddress,
    abi: hibeatsfactoryAbi,
    functionName: 'getUserRewardStats',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Read reward config
  const { data: rewardConfigData } = useReadContract({
    address: factoryAddress,
    abi: hibeatsfactoryAbi,
    functionName: 'rewardConfig',
    enabled: !!address,
  });

  // Process user stats when data changes
  useEffect(() => {
    if (!userStatsData || !address) return;

    const [totalRewardsEarned, lastRewardTime, consecutiveLoginDays, lastLoginDay] = userStatsData as [bigint, bigint, bigint, bigint];

    const stats: UserRewardStats = {
      totalRewardsEarned: formatEther(totalRewardsEarned),
      lastRewardTime: lastRewardTime.toString(),
      consecutiveLoginDays: Number(consecutiveLoginDays),
      lastLoginDay: Number(lastLoginDay)
    };

    // Calculate if user can claim today
    const currentDay = Math.floor(Date.now() / 1000 / 86400);
    const canClaim = stats.lastLoginDay !== currentDay;

    // Calculate streak bonus percentage
    const streakBonus = Math.min(stats.consecutiveLoginDays * 10, 100); // 10% per day, max 100%

    setState(prev => ({
      ...prev,
      stats,
      canClaim,
      streakBonus,
      isLoading: isPending || isConfirming
    }));
  }, [userStatsData, address, isPending, isConfirming]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      toast.success('GM! 🌅 Daily reward claimed successfully!');
      
      // Show reward notification
      const baseReward = "5.0"; // Base daily reward amount
      showQuickRewardFeedback('DAILY_LOGIN', baseReward);
      
      refetchStats(); // Refresh stats after successful claim
      
      // Force refresh balance after successful claim with slight delay
      setTimeout(() => {
        forceRefreshBalance();
      }, 1500); // Wait 1.5 seconds for blockchain confirmation
    }
  }, [isSuccess, refetchStats, forceRefreshBalance]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      console.error('Daily login error:', error);
      if (error.message?.includes('Already claimed today')) {
        toast.warning('Already claimed today! Come back tomorrow 🌙');
      } else {
        toast.error('Failed to claim daily reward. Try again!');
      }
    }
  }, [error]);

  // Claim daily login reward
  const claimDailyReward = useCallback(async () => {
    if (!address || !state.canClaim) {
      toast.warning('Cannot claim right now!');
      return false;
    }

    try {
      writeContract({
        address: factoryAddress,
        abi: hibeatsfactoryAbi,
        functionName: 'claimDailyLoginReward', // Use the user-callable function
        args: [] // No parameters needed - user claims for themselves
      });

      return true;
    } catch (error: any) {
      console.error('Error claiming daily reward:', error);
      toast.error('Failed to initiate claim transaction');
      return false;
    }
  }, [address, writeContract, factoryAddress, state.canClaim]);

  // Get user stats (for manual refresh)
  const getUserStats = useCallback(async () => {
    await refetchStats();
    return state.stats;
  }, [refetchStats, state.stats]);

  // Format streak display text
  const getStreakText = useCallback(() => {
    if (!address) return 'Connect wallet 🔗';
    if (!state.stats) return 'Loading... ⏳';
    
    const { consecutiveLoginDays } = state.stats;
    
    if (consecutiveLoginDays === 0) {
      return 'Start your streak! 🚀';
    } else if (consecutiveLoginDays === 1) {
      return '🔥 1 day streak';
    } else {
      return `🔥 ${consecutiveLoginDays} day streak`;
    }
  }, [state.stats, address]);

  // Get next reward amount preview
  const getNextRewardPreview = useCallback(() => {
    if (!rewardConfigData || !address) return '0';

    try {
      const dailyLoginReward = (rewardConfigData as any)[6] as bigint;
      const baseReward = parseFloat(formatEther(dailyLoginReward));
      
      // Calculate with potential streak bonus
      const nextStreakDay = (state.stats?.consecutiveLoginDays || 0) + 1;
      const bonusPercentage = Math.min(nextStreakDay * 10, 100);
      const totalReward = baseReward * (100 + bonusPercentage) / 100;
      
      return totalReward.toFixed(2);
    } catch (error) {
      console.error('Error getting reward preview:', error);
      return '0';
    }
  }, [rewardConfigData, address, state.stats]);

  return {
    ...state,
    claimDailyReward,
    getUserStats,
    getStreakText,
    getNextRewardPreview
  };
};