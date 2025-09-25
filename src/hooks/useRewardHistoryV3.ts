import React, { useCallback, useEffect, useState } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { HIBEATS_FACTORY_ABI } from '@/contracts/HiBeatsFactoryABI_new';

interface ActivityRewards {
  dailyLogin: string;
  songGeneration: string;
  nftMinting: string;
  socialInteraction: string;
  playlistCreation: string;
  stakingParticipation: string;
  referral: string;
}

interface ContractRewardHistory {
  user: string;
  amount: bigint;
  rewardType: string;
  timestamp: bigint;
  blockNumber: bigint;
  txHash: string;
  streakDays: bigint;
  bonusAmount: bigint;
}

interface RewardEvent {
  id: string;
  type: 'dailyLogin' | 'songGeneration' | 'nftMinting' | 'socialInteraction' | 'playlistCreation' | 'stakingParticipation' | 'referral' | 'other';
  amount: string;
  amountBN: bigint;
  user: string;
  timestamp: number;
  blockNumber: bigint;
  transactionHash: string;
  streakBonus?: {
    baseAmount: string;
    bonusAmount: string;
    streakDays: number;
  };
}

interface RewardSummary {
  totalRewards: string;
  todayRewards: string;
  weeklyRewards: string;
  monthlyRewards: string;
  streakBonusEarned: string;
  rewardsByType: Record<string, string>;
  activityRewards: ActivityRewards;
}

// Helper functions
const getRewardTypeDisplay = (type: RewardEvent['type']): string => {
  const typeMap = {
    dailyLogin: 'Daily Login',
    songGeneration: 'Music Generation',
    nftMinting: 'NFT Minting',
    socialInteraction: 'Social Activity',
    playlistCreation: 'Playlist Creation',
    stakingParticipation: 'Staking',
    referral: 'Referral',
    other: 'Other'
  };
  return typeMap[type] || 'Unknown';
};

const getRewardTypeIcon = (type: RewardEvent['type']): string => {
  const iconMap = {
    dailyLogin: '🌅',
    songGeneration: '🎵',
    nftMinting: '🎨',
    socialInteraction: '💬',
    playlistCreation: '📝',
    stakingParticipation: '💎',
    referral: '🤝',
    other: '🎁'
  };
  return iconMap[type] || '🎁';
};

const mapRewardType = (rewardType: string): RewardEvent['type'] => {
  switch (rewardType.toLowerCase()) {
    case 'dailylogin':
    case 'daily_login':
      return 'dailyLogin';
    case 'songgeneration':
    case 'song_generation':
    case 'musicgeneration':
    case 'music_generation':
      return 'songGeneration';
    case 'nftminting':
    case 'nft_minting':
      return 'nftMinting';
    case 'socialinteraction':
    case 'social_interaction':
      return 'socialInteraction';
    case 'playlistcreation':
    case 'playlist_creation':
      return 'playlistCreation';
    case 'stakingparticipation':
    case 'staking_participation':
      return 'stakingParticipation';
    case 'referral':
      return 'referral';
    default:
      return 'other';
  }
};

export const useRewardHistoryV3 = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [rewardHistory, setRewardHistory] = useState<RewardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const factoryAddress = import.meta.env.VITE_HIBEATS_FACTORY_ADDRESS as `0x${string}`;

  // Get reward stats from smart contract
  const { data: rewardStats, refetch: refetchStats } = useReadContract({
    address: factoryAddress,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'getUserRewardStats',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Get all activity rewards from smart contract
  const { data: activityRewards, refetch: refetchActivityRewards } = useReadContract({
    address: factoryAddress,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'getUserAllActivityRewards',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Get reward history from smart contract with pagination
  const fetchRewardHistoryFromContract = useCallback(async (offset = 0, limit = 50, isRefresh = false) => {
    if (!address || !publicClient) return [];

    try {
      // Set loading state based on whether it's initial load or refresh
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Call getUserRewardHistory from smart contract
      const result = await publicClient.readContract({
        address: factoryAddress,
        abi: HIBEATS_FACTORY_ABI,
        functionName: 'getUserRewardHistory',
        args: [address, BigInt(offset), BigInt(limit)],
      }) as [ContractRewardHistory[], bigint];

      const [historyArray, totalCount] = result;
      
      // Transform contract data to our format
      const transformedHistory: RewardEvent[] = historyArray.map((item, index) => ({
        id: `${item.blockNumber.toString()}-${index}`,
        type: mapRewardType(item.rewardType),
        amount: formatEther(item.amount),
        amountBN: item.amount,
        user: item.user,
        timestamp: Number(item.timestamp),
        blockNumber: item.blockNumber,
        transactionHash: item.txHash,
        streakBonus: item.streakDays > 0n ? {
          baseAmount: formatEther(item.amount - item.bonusAmount),
          bonusAmount: formatEther(item.bonusAmount),
          streakDays: Number(item.streakDays)
        } : undefined
      }));

      // Sort by timestamp descending (newest first)
      transformedHistory.sort((a, b) => b.timestamp - a.timestamp);

      setRewardHistory(transformedHistory);
      return transformedHistory;
    } catch (error) {
      return [];
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [address, publicClient, factoryAddress]);

  // Calculate reward summary
  const rewardSummary: RewardSummary = React.useMemo(() => {
    const now = Date.now() / 1000;
    const todayStart = now - (24 * 60 * 60);
    const weekStart = now - (7 * 24 * 60 * 60);
    const monthStart = now - (30 * 24 * 60 * 60);

    let totalRewards = 0;
    let todayRewards = 0;
    let weeklyRewards = 0;
    let monthlyRewards = 0;
    let streakBonusEarned = 0;
    const rewardsByType: Record<string, number> = {};

    rewardHistory.forEach(event => {
      const amount = parseFloat(event.amount);
      totalRewards += amount;

      if (event.timestamp >= todayStart) {
        todayRewards += amount;
      }
      if (event.timestamp >= weekStart) {
        weeklyRewards += amount;
      }
      if (event.timestamp >= monthStart) {
        monthlyRewards += amount;
      }

      // Count streak bonuses
      if (event.streakBonus) {
        streakBonusEarned += parseFloat(event.streakBonus.bonusAmount);
      }

      // Group by type
      const typeDisplay = getRewardTypeDisplay(event.type);
      rewardsByType[typeDisplay] = (rewardsByType[typeDisplay] || 0) + amount;
    });

    // Get activity rewards from contract
    const activityRewardsObj: ActivityRewards = {
      dailyLogin: '0',
      songGeneration: '0',
      nftMinting: '0',
      socialInteraction: '0',
      playlistCreation: '0',
      stakingParticipation: '0',
      referral: '0'
    };

    if (activityRewards && Array.isArray(activityRewards)) {
      const [dailyLogin, songGeneration, nftMinting, socialInteraction, playlistCreation, stakingParticipation, referral] = activityRewards;
      
      activityRewardsObj.dailyLogin = formatEther(dailyLogin);
      activityRewardsObj.songGeneration = formatEther(songGeneration);
      activityRewardsObj.nftMinting = formatEther(nftMinting);
      activityRewardsObj.socialInteraction = formatEther(socialInteraction);
      activityRewardsObj.playlistCreation = formatEther(playlistCreation);
      activityRewardsObj.stakingParticipation = formatEther(stakingParticipation);
      activityRewardsObj.referral = formatEther(referral);
    }

    return {
      totalRewards: totalRewards.toFixed(2),
      todayRewards: todayRewards.toFixed(2),
      weeklyRewards: weeklyRewards.toFixed(2),
      monthlyRewards: monthlyRewards.toFixed(2),
      streakBonusEarned: streakBonusEarned.toFixed(2),
      rewardsByType: Object.fromEntries(
        Object.entries(rewardsByType).map(([k, v]) => [k, v.toFixed(2)])
      ),
      activityRewards: activityRewardsObj
    };
  }, [rewardHistory, activityRewards]);

  // Auto-refresh on mount and when address changes
  useEffect(() => {
    if (address) {
      fetchRewardHistoryFromContract();
    }
  }, [address, fetchRewardHistoryFromContract]);

  const refreshHistory = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchRewardHistoryFromContract(0, 50, true), // Pass true for refresh
      refetchStats(),
      refetchActivityRewards()
    ]);
    setIsRefreshing(false);
  }, [fetchRewardHistoryFromContract, refetchStats, refetchActivityRewards]);

  return {
    rewardHistory,
    rewardSummary,
    isLoading,
    isRefreshing,
    rewardStats: rewardStats as [bigint, bigint, bigint, bigint] | undefined,
    contractActivityRewards: activityRewards as bigint[] | undefined,
    refreshHistory,
    fetchRewardHistoryFromContract,
    getRewardTypeDisplay,
    getRewardTypeIcon,
  };
};