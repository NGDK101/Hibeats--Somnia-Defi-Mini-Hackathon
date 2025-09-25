import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, HIBEATS_ROYALTIES_ABI, type RoyaltyInfo } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function useRoyalties() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  
  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user earnings
  const { data: userEarnings, refetch: refetchEarnings } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
    abi: HIBEATS_ROYALTIES_ABI,
    functionName: 'getUserEarnings',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Read total earnings
  const { data: totalEarnings } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
    abi: HIBEATS_ROYALTIES_ABI,
    functionName: 'getTotalEarnings',
  });

  // Read claimable balance
  const { data: claimableBalance, refetch: refetchClaimable } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
    abi: HIBEATS_ROYALTIES_ABI,
    functionName: 'getClaimableBalance',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Read earnings history
  const { data: earningsHistory, refetch: refetchHistory } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
    abi: HIBEATS_ROYALTIES_ABI,
    functionName: 'getEarningsHistory',
    args: address ? [address, 0n, 50n] : undefined, // Get latest 50 records
    enabled: !!address,
  });

  // Read user royalty settings
  const { data: royaltySettings, refetch: refetchSettings } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
    abi: HIBEATS_ROYALTIES_ABI,
    functionName: 'getUserRoyaltySettings',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Set royalty for NFT
  const setRoyalty = async (tokenId: bigint, royaltyInfo: RoyaltyInfo) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
        abi: HIBEATS_ROYALTIES_ABI,
        functionName: 'setRoyalty',
        args: [
          tokenId,
          royaltyInfo.recipient,
          royaltyInfo.percentage,
          royaltyInfo.splits || []
        ],
      });

      toast.success('Royalty setting initiated!');
    } catch (err) {
      console.error('Error setting royalty:', err);
      toast.error('Failed to set royalty');
      setIsLoading(false);
    }
  };

  // Update royalty percentage
  const updateRoyaltyPercentage = async (tokenId: bigint, newPercentage: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
        abi: HIBEATS_ROYALTIES_ABI,
        functionName: 'updateRoyaltyPercentage',
        args: [tokenId, newPercentage],
      });

      toast.success('Royalty percentage update initiated!');
    } catch (err) {
      console.error('Error updating royalty percentage:', err);
      toast.error('Failed to update royalty percentage');
      setIsLoading(false);
    }
  };

  // Add royalty split
  const addRoyaltySplit = async (tokenId: bigint, recipient: string, percentage: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
        abi: HIBEATS_ROYALTIES_ABI,
        functionName: 'addRoyaltySplit',
        args: [tokenId, recipient as `0x${string}`, percentage],
      });

      toast.success('Royalty split addition initiated!');
    } catch (err) {
      console.error('Error adding royalty split:', err);
      toast.error('Failed to add royalty split');
      setIsLoading(false);
    }
  };

  // Remove royalty split
  const removeRoyaltySplit = async (tokenId: bigint, recipient: string) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
        abi: HIBEATS_ROYALTIES_ABI,
        functionName: 'removeRoyaltySplit',
        args: [tokenId, recipient as `0x${string}`],
      });

      toast.success('Royalty split removal initiated!');
    } catch (err) {
      console.error('Error removing royalty split:', err);
      toast.error('Failed to remove royalty split');
      setIsLoading(false);
    }
  };

  // Claim earnings
  const claimEarnings = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
        abi: HIBEATS_ROYALTIES_ABI,
        functionName: 'claimEarnings',
      });

      toast.success('Earnings claim initiated!');
    } catch (err) {
      console.error('Error claiming earnings:', err);
      toast.error('Failed to claim earnings');
      setIsLoading(false);
    }
  };

  // Claim earnings for specific tokens
  const claimEarningsForTokens = async (tokenIds: bigint[]) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
        abi: HIBEATS_ROYALTIES_ABI,
        functionName: 'claimEarningsForTokens',
        args: [tokenIds],
      });

      toast.success('Token earnings claim initiated!');
    } catch (err) {
      console.error('Error claiming token earnings:', err);
      toast.error('Failed to claim token earnings');
      setIsLoading(false);
    }
  };

  // Set auto-claim
  const setAutoClaim = async (enabled: boolean, threshold: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
        abi: HIBEATS_ROYALTIES_ABI,
        functionName: 'setAutoClaim',
        args: [enabled, threshold],
      });

      toast.success('Auto-claim setting initiated!');
    } catch (err) {
      console.error('Error setting auto-claim:', err);
      toast.error('Failed to set auto-claim');
      setIsLoading(false);
    }
  };

  // Distribute royalties (for sales)
  const distributeRoyalties = async (tokenId: bigint, salePrice: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
        abi: HIBEATS_ROYALTIES_ABI,
        functionName: 'distributeRoyalties',
        args: [tokenId, salePrice],
        value: salePrice, // Send the sale amount
      });

      toast.success('Royalty distribution initiated!');
    } catch (err) {
      console.error('Error distributing royalties:', err);
      toast.error('Failed to distribute royalties');
      setIsLoading(false);
    }
  };

  // Get royalty info for token
  const getRoyaltyInfo = (tokenId: bigint, salePrice: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
      abi: HIBEATS_ROYALTIES_ABI,
      functionName: 'royaltyInfo',
      args: [tokenId, salePrice],
    });
  };

  // Get token royalty details
  const getTokenRoyalty = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
      abi: HIBEATS_ROYALTIES_ABI,
      functionName: 'getTokenRoyalty',
      args: [tokenId],
    });
  };

  // Get user's royalty tokens
  const { data: royaltyTokens, refetch: refetchTokens } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
    abi: HIBEATS_ROYALTIES_ABI,
    functionName: 'getUserRoyaltyTokens',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Get earnings for specific token
  const getTokenEarnings = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
      abi: HIBEATS_ROYALTIES_ABI,
      functionName: 'getTokenEarnings',
      args: [tokenId],
    });
  };

  // Effects
  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      refetchEarnings();
      refetchClaimable();
      refetchHistory();
      refetchSettings();
      refetchTokens();
      toast.success('Royalty transaction completed!');
    }
  }, [isSuccess, refetchEarnings, refetchClaimable, refetchHistory, refetchSettings, refetchTokens]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      toast.error('Royalty transaction failed: ' + error.message);
    }
  }, [error]);

  return {
    // Actions
    setRoyalty,
    updateRoyaltyPercentage,
    addRoyaltySplit,
    removeRoyaltySplit,
    claimEarnings,
    claimEarningsForTokens,
    setAutoClaim,
    distributeRoyalties,
    
    // Queries
    getRoyaltyInfo,
    getTokenRoyalty,
    getTokenEarnings,
    
    // Data
    userEarnings: userEarnings || 0n,
    totalEarnings: totalEarnings || 0n,
    claimableBalance: claimableBalance || 0n,
    earningsHistory: earningsHistory || [],
    royaltySettings,
    royaltyTokens: royaltyTokens || [],
    
    // State
    isLoading: isLoading || isPending || isConfirming,
    hash,
    error,
  };
}
