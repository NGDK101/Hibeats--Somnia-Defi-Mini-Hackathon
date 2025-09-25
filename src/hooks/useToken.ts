import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES, HIBEATS_TOKEN_ABI } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useOptimizedContractWrite } from './useOptimizedContractWrite';

export function useToken() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<bigint | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);
  
  // Use optimized contract write
  const { writeContract: optimizedWrite, isLoading: isWriteLoading } = useOptimizedContractWrite();
  
  // Legacy wagmi hooks for backward compatibility (but not actively used for writes)
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user balance with optimized polling
  const { 
    data: balance, 
    refetch: refetchBalance,
    isLoading: isBalanceLoading,
    error: balanceError
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
    abi: HIBEATS_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // 30 seconds
      refetchIntervalInBackground: false,
      staleTime: 15000, // Cache for 15 seconds
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

  // Read allowance function
  const getAllowance = useCallback((spender: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
      abi: HIBEATS_TOKEN_ABI,
      functionName: 'allowance',
      args: address && spender ? [address, spender as `0x${string}`] : undefined,
      query: {
        enabled: !!(address && spender),
      },
    });
  }, [address]);

  // Transfer tokens with optimized transaction
  const transfer = async (to: string, amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      const txHash = await optimizedWrite({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, amount],
      });
      
      if (txHash) {
        console.log('Token transfer initiated:', txHash);
        // Trigger balance refresh after a short delay
        setTimeout(() => {
          refetchBalance();
        }, 2000);
      }
      
    } catch (err: any) {
      console.error('Transfer failed:', err);
      // Error is already handled by optimizedWrite
    } finally {
      setIsLoading(false);
    }
  };

  // Approve tokens with optimized transaction
  const approve = async (spender: string, amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      const txHash = await optimizedWrite({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, amount],
      });
      
      if (txHash) {
        console.log('Token approval initiated:', txHash);
      }
      
    } catch (err: any) {
      console.error('Approval failed:', err);
      // Error is already handled by optimizedWrite
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer from with optimized transaction
  const transferFrom = async (from: string, to: string, amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      const txHash = await optimizedWrite({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'transferFrom',
        args: [from as `0x${string}`, to as `0x${string}`, amount],
      });
      
      if (txHash) {
        console.log('Token transferFrom initiated:', txHash);
        // Trigger balance refresh after a short delay
        setTimeout(() => {
          refetchBalance();
        }, 2000);
      }
      
    } catch (err: any) {
      console.error('TransferFrom failed:', err);
      // Error is already handled by optimizedWrite
    } finally {
      setIsLoading(false);
    }
  };

  // Claim rewards with optimized transaction
  const claimRewards = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      const txHash = await optimizedWrite({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'claimRewards',
      });
      
      if (txHash) {
        console.log('Reward claim initiated:', txHash);
        // Trigger balance refresh after a short delay
        setTimeout(() => {
          refetchBalance();
        }, 2000);
      }
      
    } catch (err: any) {
      console.error('Claim rewards failed:', err);
      // Error is already handled by optimizedWrite
    } finally {
      setIsLoading(false);
    }
  };

  // Burn tokens with optimized transaction
  const burn = async (amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      const txHash = await optimizedWrite({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'burn',
        args: [amount],
      });
      
      if (txHash) {
        console.log('Token burn initiated:', txHash);
        // Trigger balance refresh after a short delay
        setTimeout(() => {
          refetchBalance();
        }, 2000);
      }
      
    } catch (err: any) {
      console.error('Token burn failed:', err);
      // Error is already handled by optimizedWrite
    } finally {
      setIsLoading(false);
    }
  };

  // Increase allowance with optimized transaction
  const increaseAllowance = async (spender: string, addedValue: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      const txHash = await optimizedWrite({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'increaseAllowance',
        args: [spender as `0x${string}`, addedValue],
      });
      
      if (txHash) {
        console.log('Allowance increase initiated:', txHash);
      }
      
    } catch (err: any) {
      console.error('Increase allowance failed:', err);
      // Error is already handled by optimizedWrite
    } finally {
      setIsLoading(false);
    }
  };

  // Decrease allowance with optimized transaction
  const decreaseAllowance = async (spender: string, subtractedValue: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      const txHash = await optimizedWrite({
        address: CONTRACT_ADDRESSES.HIBEATS_TOKEN,
        abi: HIBEATS_TOKEN_ABI,
        functionName: 'decreaseAllowance',
        args: [spender as `0x${string}`, subtractedValue],
      });
      
      if (txHash) {
        console.log('Allowance decrease initiated:', txHash);
      }
      
    } catch (err: any) {
      console.error('Decrease allowance failed:', err);
      // Error is already handled by optimizedWrite
    } finally {
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
        refetchBalance();
      }, 1000); // Wait 1 second for blockchain confirmation
      toast.success('Token transaction completed!');
    }
  }, [isSuccess, forceRefreshBalance, refetchBalance]);

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
    
    // Utilities
    formatBalance,
    parseAmount,
    refetchBalance, 
    forceRefreshBalance, // Add force refresh for external triggers
    smartRefreshBalance, // Add smart refresh for background use
    
    // State
    isLoading: isLoading || isWriteLoading || isPending || isConfirming,
    hash,
    error,
  };
}
