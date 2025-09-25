import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_MARKETPLACE_ADVANCED_ABI } from '@/contracts';

export function useMarketplaceExplorer() {
  const [stats, setStats] = useState({
    totalListings: 0,
    totalVolume: '0',
    activeAuctions: 0,
    totalSales: 0,
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
    if (marketplaceStats) {
      setStats({
        totalListings: Number(marketplaceStats[0]) || 0,
        totalVolume: marketplaceStats[1]?.toString() || '0',
        activeAuctions: Number(marketplaceStats[2]) || 0,
        totalSales: Number(marketplaceStats[3]) || 0,
      });
    }
  }, [marketplaceStats]);

  return {
    stats,
    activeListings: activeListings || [],
    isLoading: !marketplaceStats,
  };
}
