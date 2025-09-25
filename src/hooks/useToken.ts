import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES, HIBEATS_TOKEN_ABI } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useToken() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<bigint | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);
  
  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user balance with auto-refresh
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
    abi: HIBEATS_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
    // Poll every 15 seconds in background
    query: {
      refetchInterval: 15000, // Back to 15 seconds
      refetchIntervalInBackground: true,
    }
  });

  // Read total supply
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
    abi: HIBEATS_TOKEN_ABI,
    functionName: 'totalSupply',
  });

  // Read token name
  const { data: tokenName } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
    abi: HIBEATS_TOKEN_ABI,
    functionName: 'name',
  });

  // Read token symbol
  const { data: tokenSymbol } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
    abi: HIBEATS_TOKEN_ABI,
    functionName: 'symbol',
  });

  // Read token decimals
  const { data: decimals } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
    abi: HIBEATS_TOKEN_ABI,
    functionName: 'decimals',
  });

  // Read user rewards
  const { data: rewards, refetch: refetchRewards } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
    abi: HIBEATS_TOKEN_ABI,
    functionName: 'getRewards',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Read allowance
  const getAllowance = (spender: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
      abi: HIBEATS_TOKEN_ABI,
      functionName: 'allowance',
      args: address && spender ? [address, spender as `0x${string}`] : undefined,
      enabled: !!(address && spender),
    });
  };

  // Transfer tokens
  const transfer = async (to: string, amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, amount],
      });

      toast.success('Transfer initiated!');
    } catch (err) {
      console.error('Error transferring tokens:', err);
      toast.error('Failed to transfer tokens');
      setIsLoading(false);
    }
  };

  // Approve tokens
  const approve = async (spender: string, amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, amount],
      });

      toast.success('Approval initiated!');
    } catch (err) {
      console.error('Error approving tokens:', err);
      toast.error('Failed to approve tokens');
      setIsLoading(false);
    }
  };

  // Transfer from (requires approval)
  const transferFrom = async (from: string, to: string, amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'transferFrom',
        args: [from as `0x${string}`, to as `0x${string}`, amount],
      });

      toast.success('Transfer from initiated!');
    } catch (err) {
      console.error('Error transferring from:', err);
      toast.error('Failed to transfer from');
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
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'claimRewards',
      });

      toast.success('Reward claim initiated!');
    } catch (err) {
      console.error('Error claiming rewards:', err);
      toast.error('Failed to claim rewards');
      setIsLoading(false);
    }
  };

  // Burn tokens
  const burn = async (amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'burn',
        args: [amount],
      });

      toast.success('Token burn initiated!');
    } catch (err) {
      console.error('Error burning tokens:', err);
      toast.error('Failed to burn tokens');
      setIsLoading(false);
    }
  };

  // Increase allowance
  const increaseAllowance = async (spender: string, addedValue: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'increaseAllowance',
        args: [spender as `0x${string}`, addedValue],
      });

      toast.success('Allowance increase initiated!');
    } catch (err) {
      console.error('Error increasing allowance:', err);
      toast.error('Failed to increase allowance');
      setIsLoading(false);
    }
  };

  // Decrease allowance
  const decreaseAllowance = async (spender: string, subtractedValue: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'decreaseAllowance',
        args: [spender as `0x${string}`, subtractedValue],
      });

      toast.success('Allowance decrease initiated!');
    } catch (err) {
      console.error('Error decreasing allowance:', err);
      toast.error('Failed to decrease allowance');
      setIsLoading(false);
    }
  };

  // Smart balance refresh function
  const smartRefreshBalance = useCallback(async () => {
    const now = Date.now();
    // Prevent too frequent refreshes (minimum 2 seconds apart)
    if (now - lastRefreshRef.current < 2000) return;
    
    lastRefreshRef.current = now;
    try {
      await refetchBalance();
    } catch (err) {
      console.error('Background balance refresh failed:', err);
    }
  }, [refetchBalance]);

  // Force immediate refresh (for external triggers like reward claims)
  const forceRefreshBalance = useCallback(async () => {
    lastRefreshRef.current = Date.now();
    try {
      await refetchBalance();
    } catch (err) {
      console.error('Force balance refresh failed:', err);
    }
  }, [refetchBalance]);

  // Utility functions
  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0';
    return formatEther(balance);
  };

  const parseAmount = (amount: string) => {
    try {
      return parseEther(amount);
    } catch {
      return 0n;
    }
  };

  // Balance change detection and notification
  useEffect(() => {
    if (balance && previousBalance !== null && balance > previousBalance) {
      const increase = balance - previousBalance;
      const increaseFormatted = Number(formatEther(increase)).toFixed(2);
      
      // Show toast notification for balance increase
      toast.success(`🎉 Balance increased by ${increaseFormatted} BEATS!`, {
        description: 'Your BEATS balance has been updated',
        duration: 3000,
      });
    }
    
    if (balance !== undefined) {
      setPreviousBalance(balance);
    }
  }, [balance, previousBalance]);

  // Setup intelligent background refresh
  useEffect(() => {
    if (!address) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start background refresh interval (every 15 seconds)
    intervalRef.current = setInterval(() => {
      smartRefreshBalance();
    }, 15000); // Back to 15 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [address, smartRefreshBalance]);

  // Effects
  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      // Force refresh after successful transaction
      setTimeout(() => {
        forceRefreshBalance();
        refetchRewards();
      }, 1000); // Wait 1 second for blockchain confirmation
      toast.success('Token transaction completed!');
    }
  }, [isSuccess, forceRefreshBalance, refetchRewards]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      toast.error('Token transaction failed: ' + error.message);
    }
  }, [error]);

  return {
    // Actions
    transfer,
    approve,
    transferFrom,
    claimRewards,
    burn,
    increaseAllowance,
    decreaseAllowance,
    
    // Queries
    getAllowance,
    
    // Data
    balance: balance || 0n,
    totalSupply: totalSupply || 0n,
    tokenName: tokenName || 'HiBeats Token',
    tokenSymbol: tokenSymbol || 'BEATS',
    decimals: decimals || 18,
    rewards: rewards || 0n,
    
    // Utilities
    formatBalance,
    parseAmount,
    refetchBalance, 
    forceRefreshBalance, // Add force refresh for external triggers
    smartRefreshBalance, // Add smart refresh for background use
    
    // State
    isLoading: isLoading || isPending || isConfirming,
    hash,
    error,
  };
}
