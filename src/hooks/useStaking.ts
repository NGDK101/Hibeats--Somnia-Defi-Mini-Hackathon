import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, HIBEATS_STAKING_ABI } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function useStaking() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  
  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read staking data
  const { data: userStake, refetch: refetchStake } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
    abi: HIBEATS_STAKING_ABI,
    functionName: 'getUserStake',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Read total staked
  const { data: totalStaked } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
    abi: HIBEATS_STAKING_ABI,
    functionName: 'totalStaked',
  });

  // Read reward rate
  const { data: rewardRate } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
    abi: HIBEATS_STAKING_ABI,
    functionName: 'rewardRate',
  });

  // Read minimum stake amount
  const { data: minimumStake } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
    abi: HIBEATS_STAKING_ABI,
    functionName: 'minimumStake',
  });

  // Read lock periods
  const { data: lockPeriods } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
    abi: HIBEATS_STAKING_ABI,
    functionName: 'getLockPeriods',
  });

  // Read pending rewards
  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
    abi: HIBEATS_STAKING_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Read staking pool info
  const { data: poolInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
    abi: HIBEATS_STAKING_ABI,
    functionName: 'getPoolInfo',
  });

  // Read user staking history
  const { data: stakingHistory, refetch: refetchHistory } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
    abi: HIBEATS_STAKING_ABI,
    functionName: 'getUserStakingHistory',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Stake tokens
  const stakeTokens = async (amount: bigint, lockPeriod: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
        abi: HIBEATS_STAKING_ABI,
        functionName: 'stake',
        args: [amount, lockPeriod],
      });

      toast.success('Staking initiated!');
    } catch (err) {
      console.error('Error staking tokens:', err);
      toast.error('Failed to stake tokens');
      setIsLoading(false);
    }
  };

  // Unstake tokens
  const unstakeTokens = async (amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
        abi: HIBEATS_STAKING_ABI,
        functionName: 'unstake',
        args: [amount],
      });

      toast.success('Unstaking initiated!');
    } catch (err) {
      console.error('Error unstaking tokens:', err);
      toast.error('Failed to unstake tokens');
      setIsLoading(false);
    }
  };

  // Claim rewards
  const claimRewards = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
        abi: HIBEATS_STAKING_ABI,
        functionName: 'claimRewards',
      });

      toast.success('Reward claim initiated!');
    } catch (err) {
      console.error('Error claiming rewards:', err);
      toast.error('Failed to claim rewards');
      setIsLoading(false);
    }
  };

  // Emergency unstake
  const emergencyUnstake = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
        abi: HIBEATS_STAKING_ABI,
        functionName: 'emergencyUnstake',
      });

      toast.success('Emergency unstake initiated!');
    } catch (err) {
      console.error('Error emergency unstaking:', err);
      toast.error('Failed to emergency unstake');
      setIsLoading(false);
    }
  };

  // Restake rewards
  const restakeRewards = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
        abi: HIBEATS_STAKING_ABI,
        functionName: 'restakeRewards',
      });

      toast.success('Restaking initiated!');
    } catch (err) {
      console.error('Error restaking rewards:', err);
      toast.error('Failed to restake rewards');
      setIsLoading(false);
    }
  };

  // Update lock period
  const updateLockPeriod = async (newLockPeriod: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
        abi: HIBEATS_STAKING_ABI,
        functionName: 'updateLockPeriod',
        args: [newLockPeriod],
      });

      toast.success('Lock period update initiated!');
    } catch (err) {
      console.error('Error updating lock period:', err);
      toast.error('Failed to update lock period');
      setIsLoading(false);
    }
  };

  // Get APY for lock period
  const getAPY = (lockPeriod: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
      abi: HIBEATS_STAKING_ABI,
      functionName: 'getAPY',
      args: [lockPeriod],
    });
  };

  // Get staking multiplier
  const getStakingMultiplier = (lockPeriod: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
      abi: HIBEATS_STAKING_ABI,
      functionName: 'getStakingMultiplier',
      args: [lockPeriod],
    });
  };

  // Calculate estimated rewards
  const calculateEstimatedRewards = (amount: bigint, lockPeriod: bigint, duration: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_STAKING,
      abi: HIBEATS_STAKING_ABI,
      functionName: 'calculateRewards',
      args: [amount, lockPeriod, duration],
    });
  };

  // Effects
  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      refetchStake();
      refetchRewards();
      refetchHistory();
      toast.success('Staking transaction completed!');
    }
  }, [isSuccess, refetchStake, refetchRewards, refetchHistory]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      toast.error('Staking transaction failed: ' + error.message);
    }
  }, [error]);

  return {
    // Actions
    stakeTokens,
    unstakeTokens,
    claimRewards,
    emergencyUnstake,
    restakeRewards,
    updateLockPeriod,
    
    // Queries
    getAPY,
    getStakingMultiplier,
    calculateEstimatedRewards,
    
    // Data
    userStake,
    totalStaked: totalStaked || 0n,
    rewardRate: rewardRate || 0n,
    minimumStake: minimumStake || 0n,
    lockPeriods: lockPeriods || [],
    pendingRewards: pendingRewards || 0n,
    poolInfo,
    stakingHistory: stakingHistory || [],
    
    // State
    isLoading: isLoading || isPending || isConfirming,
    hash,
    error,
  };
}
