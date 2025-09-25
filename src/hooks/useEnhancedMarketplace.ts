import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_MARKETPLACE_ADVANCED_ABI } from '@/contracts';
import { toast } from 'sonner';
import { useState } from 'react';
import { parseEther } from 'viem';

export function useEnhancedMarketplace() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { data: activeListings } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE_ADVANCED,
    abi: HIBEATS_MARKETPLACE_ADVANCED_ABI,
    functionName: 'getActiveListings',
    args: [BigInt(100)],
  });

  const listNFT = async (tokenId: bigint, price: string, isBeatsToken: boolean = false) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const priceInWei = parseEther(price);

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE_ADVANCED,
        abi: HIBEATS_MARKETPLACE_ADVANCED_ABI,
        functionName: 'listNFT',
        args: [tokenId, priceInWei, isBeatsToken],
      });

      toast.success('NFT listing initiated!');
    } catch (err) {
      console.error('Error listing NFT:', err);
      toast.error('Failed to list NFT');
      setIsLoading(false);
    }
  };

  const buyNFT = async (tokenId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE_ADVANCED,
        abi: HIBEATS_MARKETPLACE_ADVANCED_ABI,
        functionName: 'buyNFT',
        args: [tokenId],
      });

      toast.success('NFT purchase initiated!');
    } catch (err) {
      console.error('Error buying NFT:', err);
      toast.error('Failed to buy NFT');
      setIsLoading(false);
    }
  };

  return {
    activeListings: activeListings || [],
    listNFT,
    buyNFT,
    isLoading: isLoading || isPending,
    hash,
    error,
  };
}
