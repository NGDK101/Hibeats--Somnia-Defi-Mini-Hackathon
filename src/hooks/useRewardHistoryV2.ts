import { useCallback, useEffect, useState } from 'react';
import { useAccount, useReadContract, usePublicClient, useBlockNumber } from 'wagmi';
import { formatEther, parseAbiItem, getAddress } from 'viem';
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

// Helper functions (moved to top to avoid hoisting issues)
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
    dailyLogin: '🎯',
    songGeneration: '🎵',
    nftMinting: '🎨',
    socialInteraction: '👥',
    playlistCreation: '📜',
    stakingParticipation: '🥩',
    referral: '🤝',
    other: '🎁'
  };
  return iconMap[type] || '🎁';
};

const getRewardTypeGradient = (type: RewardEvent['type']): string => {
  const gradientMap = {
    dailyLogin: 'from-blue-500 to-blue-600',
    songGeneration: 'from-purple-500 to-purple-600',
    nftMinting: 'from-pink-500 to-pink-600',
    socialInteraction: 'from-green-500 to-green-600',
    playlistCreation: 'from-yellow-500 to-yellow-600',
    stakingParticipation: 'from-red-500 to-red-600',
    referral: 'from-indigo-500 to-indigo-600',
    other: 'from-gray-500 to-gray-600'
  };
  return gradientMap[type] || 'from-gray-500 to-gray-600';
};

export const useRewardHistoryV2 = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: currentBlock } = useBlockNumber({ watch: true });
  
  const [rewardHistory, setRewardHistory] = useState<RewardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewRewards, setHasNewRewards] = useState(false);
  const [lastProcessedEvent, setLastProcessedEvent] = useState<RewardEvent | null>(null);

  const factoryAddress = import.meta.env.VITE_HIBEATS_FACTORY_ADDRESS as `0x${string}`;

  // Get user reward stats from smart contract
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

  // Event signatures for filtering
  const rewardDistributedEvent = parseAbiItem('event RewardDistributedDetailed(address indexed user, uint256 amount, string rewardType, uint256 timestamp)');
  const streakBonusEvent = parseAbiItem('event StreakBonusApplied(address indexed user, uint256 baseReward, uint256 bonusAmount, uint256 streakDays)');

  // Map reward type string to enum
  const mapRewardType = (rewardType: string): RewardEvent['type'] => {
    switch (rewardType.toLowerCase()) {
      case 'dailylogin': return 'dailyLogin';
      case 'daily_login': return 'dailyLogin';
      case 'songgeneration': return 'songGeneration';
      case 'song_generation': return 'songGeneration';
      case 'musicgeneration': return 'songGeneration';
      case 'music_generation': return 'songGeneration';
      case 'nftminting': return 'nftMinting';
      case 'nft_minting': return 'nftMinting';
      case 'socialinteraction': return 'socialInteraction';
      case 'social_interaction': return 'socialInteraction';
      case 'playlistcreation': return 'playlistCreation';
      case 'playlist_creation': return 'playlistCreation';
      case 'stakingparticipation': return 'stakingParticipation';
      case 'staking_participation': return 'stakingParticipation';
      case 'referral': return 'referral';
      default: return 'other';
    }
  };

  // Fetch reward events from smart contract
  const fetchRewardEvents = useCallback(async (fromBlock?: bigint, toBlock?: bigint) => {
    if (!address || !publicClient) return [];

    try {
      setIsLoading(true);

      const from = fromBlock || (currentBlock ? currentBlock - 1000n : BigInt(Math.floor(Date.now() / 1000) - 86400));
      const to = toBlock || 'latest';

      // Helper function to fetch logs with retry and chunking
      const fetchLogsWithRetry = async (event: any, maxRetries = 3) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await publicClient.getLogs({
              address: factoryAddress,
              event: event,
              args: {
                user: address
              },
              fromBlock: from,
              toBlock: to
            });
          } catch (error: any) {
            
            if (error.message?.includes('block range exceeds') && attempt < maxRetries - 1) {
              // If block range too large, try smaller range
              const smallerRange = currentBlock ? currentBlock - 500n : from;
              return await publicClient.getLogs({
                address: factoryAddress,
                event: event,
                args: { user: address },
                fromBlock: smallerRange,
                toBlock: to
              });
            }
            
            if (attempt === maxRetries - 1) throw error;
          }
        }
        return [];
      };

      // Get RewardDistributedDetailed events
      const rewardLogs = await fetchLogsWithRetry(rewardDistributedEvent);

      // Get StreakBonusApplied events
      const streakLogs = await fetchLogsWithRetry(streakBonusEvent);

      // Create streak bonus lookup map
      const streakBonusMap = new Map<string, any>();
      streakLogs.forEach(log => {
        if (log.args && log.transactionHash) {
          const streakArgs = log.args as {
            user: `0x${string}`;
            baseReward: bigint;
            bonusAmount: bigint;
            streakDays: bigint;
          };
          
          streakBonusMap.set(log.transactionHash, {
            baseAmount: formatEther(streakArgs.baseReward),
            bonusAmount: formatEther(streakArgs.bonusAmount),
            streakDays: Number(streakArgs.streakDays)
          });
        }
      });

      // Process reward events
      const events: RewardEvent[] = rewardLogs.map(log => {
        if (!log.args || !log.transactionHash) return null;

        const streakBonus = streakBonusMap.get(log.transactionHash);
        
        // Type assertion for log.args
        const args = log.args as {
          user: `0x${string}`;
          amount: bigint;
          rewardType: string;
          timestamp: bigint;
        };
        
        const rewardType = args.rewardType.toLowerCase();

        return {
          id: `${log.transactionHash}-${log.logIndex}`,
          type: mapRewardType(rewardType),
          amount: formatEther(args.amount),
          amountBN: args.amount,
          user: getAddress(args.user),
          timestamp: Number(args.timestamp),
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          streakBonus
        };
      }).filter(Boolean) as RewardEvent[];

      return events.sort((a, b) => b.timestamp - a.timestamp);

    } catch (error) {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, factoryAddress, currentBlock]);

  // Auto-refresh events
  useEffect(() => {
    if (address) {
      fetchRewardEvents().then(setRewardHistory);
    }
  }, [address, fetchRewardEvents]);

  // Polling for new events
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      fetchRewardEvents().then(newEvents => {
        if (newEvents.length !== rewardHistory.length) {
          setRewardHistory(newEvents);
          setHasNewRewards(true);
          setTimeout(() => setHasNewRewards(false), 5000);
        }
      });
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [address, rewardHistory.length, fetchRewardEvents]);

  // Calculate reward summary
  const rewardSummary: RewardSummary = {
    totalRewards: rewardStats ? formatEther(rewardStats[0] as bigint) : '0',
    todayRewards: '0', // Calculate from events
    weeklyRewards: '0', // Calculate from events  
    monthlyRewards: '0', // Calculate from events
    streakBonusEarned: '0', // Calculate from streak events
    rewardsByType: {},
    activityRewards: {
      dailyLogin: activityRewards ? formatEther(activityRewards[0] as bigint) : '0',
      songGeneration: activityRewards ? formatEther(activityRewards[1] as bigint) : '0',
      nftMinting: activityRewards ? formatEther(activityRewards[2] as bigint) : '0',
      socialInteraction: activityRewards ? formatEther(activityRewards[3] as bigint) : '0',
      playlistCreation: activityRewards ? formatEther(activityRewards[4] as bigint) : '0',
      stakingParticipation: activityRewards ? formatEther(activityRewards[5] as bigint) : '0',
      referral: activityRewards ? formatEther(activityRewards[6] as bigint) : '0'
    }
  };

  // Calculate time-based totals from events
  if (rewardHistory.length > 0) {
    const now = Date.now() / 1000;
    const oneDayAgo = now - 86400;
    const oneWeekAgo = now - 604800;
    const oneMonthAgo = now - 2592000;

    let todayTotal = 0;
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    let streakBonusTotal = 0;
    const typeMap: Record<string, number> = {};

    rewardHistory.forEach(event => {
      const amount = parseFloat(event.amount);
      const bonusAmount = event.streakBonus ? parseFloat(event.streakBonus.bonusAmount) : 0;
      
      // Time-based totals
      if (event.timestamp >= oneDayAgo) todayTotal += amount;
      if (event.timestamp >= oneWeekAgo) weeklyTotal += amount;
      if (event.timestamp >= oneMonthAgo) monthlyTotal += amount;
      
      // Streak bonus total
      streakBonusTotal += bonusAmount;
      
      // Type-based totals
      const displayType = getRewardTypeDisplay(event.type);
      typeMap[displayType] = (typeMap[displayType] || 0) + amount;
    });

    rewardSummary.todayRewards = todayTotal.toFixed(2);
    rewardSummary.weeklyRewards = weeklyTotal.toFixed(2);
    rewardSummary.monthlyRewards = monthlyTotal.toFixed(2);
    rewardSummary.streakBonusEarned = streakBonusTotal.toFixed(2);
    rewardSummary.rewardsByType = Object.fromEntries(
      Object.entries(typeMap).map(([k, v]) => [k, v.toFixed(2)])
    );
  }

  // Refresh all data
  const refreshHistory = useCallback(() => {
    refetchStats();
    refetchActivityRewards();
    if (address) {
      fetchRewardEvents().then(setRewardHistory);
    }
  }, [address, fetchRewardEvents, refetchStats, refetchActivityRewards]);

  return {
    rewardHistory,
    rewardSummary,
    isLoading,
    hasNewRewards,
    lastProcessedEvent,
    refreshHistory,
    getRewardTypeDisplay,
    getRewardTypeIcon,
    getRewardTypeGradient,
    setLastProcessedEvent,
    // Smart contract data
    contractStats: rewardStats,
    contractActivityRewards: activityRewards
  };
};