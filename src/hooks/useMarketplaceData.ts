import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_MARKETPLACE_ADVANCED_ABI } from '@/contracts';
import { formatEther } from 'viem';

export interface MarketplaceData {
  totalListings: number;
  totalVolume: string;
  floorPrice: string;
  topSale: string;
  activeListings: any[];
  recentSales: any[];
}

export function useMarketplaceData() {
  const [data, setData] = useState<MarketplaceData>({
    totalListings: 0,
    totalVolume: '0',
    floorPrice: '0',
    topSale: '0',
    activeListings: [],
    recentSales: [],
  });

  const { data: marketplaceStats } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE_ADVANCED,
    abi: HIBEATS_MARKETPLACE_ADVANCED_ABI,
    functionName: 'getMarketplaceStats',
  });

  const { data: activeListings } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE_ADVANCED,
    abi: HIBEATS_MARKETPLACE_ADVANCED_ABI,
    functionName: 'getActiveListings',
    args: [BigInt(100)],
  });

  useEffect(() => {
    if (marketplaceStats && activeListings) {
      setData({
        totalListings: Number(marketplaceStats[0]) || 0,
        totalVolume: formatEther(BigInt(marketplaceStats[1] || 0)),
        floorPrice: formatEther(BigInt(marketplaceStats[2] || 0)),
        topSale: formatEther(BigInt(marketplaceStats[3] || 0)),
        activeListings: activeListings as any[] || [],
        recentSales: [],
      });
    }
  }, [marketplaceStats, activeListings]);

  return {
    data,
    isLoading: !marketplaceStats || !activeListings,
  };
}
