import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import {
  shannonExplorer,
  type ExplorerTransaction,
  type ExplorerTokenTransfer,
  type ExplorerAddress,
  type ExplorerContractInfo,
  formatSomniaValue
} from '../services/shannonExplorerService';
import { CONTRACT_ADDRESSES } from '../contracts';

export interface ShannonExplorerData {
  userTransactions: ExplorerTransaction[];
  nftTransfers: ExplorerTokenTransfer[];
  addressInfo: ExplorerAddress | null;
  contractInfo: ExplorerContractInfo | null;
  networkStats: any;
  isLoading: boolean;
  error: string | null;
}

export interface NFTActivity {
  hash: string;
  type: 'mint' | 'transfer' | 'sale' | 'list' | 'unlist';
  from: string;
  to: string;
  tokenId: string;
  price?: string;
  timestamp: number;
  blockNumber: number;
}

export function useShannonExplorer() {
  const { address } = useAccount();
  const [data, setData] = useState<ShannonExplorerData>({
    userTransactions: [],
    nftTransfers: [],
    addressInfo: null,
    contractInfo: null,
    networkStats: null,
    isLoading: false,
    error: null
  });

  // Fetch user address data
  const fetchAddressData = useCallback(async (userAddress: string) => {
    if (!userAddress) return;

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch address info
      const addressInfo = await shannonExplorer.getAddress(userAddress);

      // Fetch recent transactions
      const transactions = await shannonExplorer.getAddressTransactions(userAddress, 1, 50);

      // Fetch NFT transfers (specifically for HiBeats NFT contract)
      const nftTransfers = await shannonExplorer.getAddressTokenTransfers(
        userAddress,
        CONTRACT_ADDRESSES.HIBEATS_NFT,
        1,
        100
      );

      setData(prev => ({
        ...prev,
        userTransactions: transactions,
        nftTransfers: nftTransfers,
        addressInfo: addressInfo,
        isLoading: false
      }));

    } catch (error) {
      console.error('Failed to fetch address data:', error);
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
        isLoading: false
      }));
    }
  }, []);

  // Fetch contract information
  const fetchContractInfo = useCallback(async (contractAddress: string) => {
    try {
      const contractInfo = await shannonExplorer.getContract(contractAddress);
      setData(prev => ({ ...prev, contractInfo }));
      return contractInfo;
    } catch (error) {
      console.error('Failed to fetch contract info:', error);
      return null;
    }
  }, []);

  // Fetch network statistics
  const fetchNetworkStats = useCallback(async () => {
    try {
      const stats = await shannonExplorer.getNetworkStats();
      setData(prev => ({ ...prev, networkStats: stats }));
      return stats;
    } catch (error) {
      console.error('Failed to fetch network stats:', error);
      return null;
    }
  }, []);

  // Get NFT activities for portfolio
  const getNFTActivities = useCallback(async (userAddress?: string): Promise<NFTActivity[]> => {
    if (!userAddress && !address) return [];

    const targetAddress = userAddress || address!;

    try {
      // Get NFT contract transactions
      const contractTxs = await shannonExplorer.getContractTransactions(
        CONTRACT_ADDRESSES.HIBEATS_NFT,
        1,
        100
      );

      // Get token transfers
      const transfers = await shannonExplorer.getAddressTokenTransfers(
        targetAddress,
        CONTRACT_ADDRESSES.HIBEATS_NFT,
        1,
        100
      );

      // Process and combine activities
      const activities: NFTActivity[] = [];

      // Process transfers
      transfers.forEach(transfer => {
        let activityType: NFTActivity['type'] = 'transfer';

        // Determine activity type based on addresses
        if (transfer.from === '0x0000000000000000000000000000000000000000') {
          activityType = 'mint';
        } else if (transfer.to === targetAddress) {
          activityType = 'transfer'; // Received
        } else if (transfer.from === targetAddress) {
          activityType = 'transfer'; // Sent
        }

        activities.push({
          hash: transfer.hash,
          type: activityType,
          from: transfer.from,
          to: transfer.to,
          tokenId: transfer.tokenId || '0',
          timestamp: transfer.timestamp,
          blockNumber: transfer.blockNumber
        });
      });

      // Sort by timestamp (newest first)
      return activities.sort((a, b) => b.timestamp - a.timestamp);

    } catch (error) {
      console.error('Failed to get NFT activities:', error);
      return [];
    }
  }, [address]);

  // Get real portfolio stats from blockchain
  const getRealPortfolioStats = useCallback(async (userAddress?: string) => {
    if (!userAddress && !address) return null;

    const targetAddress = userAddress || address!;

    try {
      // Get NFT transfers to calculate owned NFTs
      const transfers = await shannonExplorer.getAddressTokenTransfers(
        targetAddress,
        CONTRACT_ADDRESSES.HIBEATS_NFT,
        1,
        1000 // Get more to ensure we have complete history
      );

      // Calculate owned tokens
      const tokenBalances: Record<string, { received: number; sent: number }> = {};

      transfers.forEach(transfer => {
        const tokenId = transfer.tokenId || '0';

        if (!tokenBalances[tokenId]) {
          tokenBalances[tokenId] = { received: 0, sent: 0 };
        }

        if (transfer.to.toLowerCase() === targetAddress.toLowerCase()) {
          tokenBalances[tokenId].received++;
        }
        if (transfer.from.toLowerCase() === targetAddress.toLowerCase()) {
          tokenBalances[tokenId].sent++;
        }
      });

      // Calculate owned tokens (received - sent > 0)
      const ownedTokens = Object.entries(tokenBalances)
        .filter(([_, balance]) => balance.received - balance.sent > 0)
        .map(([tokenId]) => tokenId);

      // Get marketplace transactions to calculate earnings
      const marketplaceTxs = await shannonExplorer.getContractTransactions(
        CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        1,
        200
      );

      // Filter transactions involving user
      const userMarketplaceTxs = marketplaceTxs.filter(tx =>
        tx.from.toLowerCase() === targetAddress.toLowerCase() ||
        tx.to.toLowerCase() === targetAddress.toLowerCase()
      );

      return {
        totalNFTs: ownedTokens.length,
        ownedTokenIds: ownedTokens,
        totalTransactions: transfers.length,
        marketplaceTransactions: userMarketplaceTxs.length,
        firstActivity: transfers.length > 0
          ? Math.min(...transfers.map(t => t.timestamp))
          : Date.now() / 1000,
        lastActivity: transfers.length > 0
          ? Math.max(...transfers.map(t => t.timestamp))
          : Date.now() / 1000
      };

    } catch (error) {
      console.error('Failed to get real portfolio stats:', error);
      return null;
    }
  }, [address]);

  // Get transaction details
  const getTransaction = useCallback(async (txHash: string) => {
    try {
      return await shannonExplorer.getTransaction(txHash);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }, []);

  // Search functionality
  const search = useCallback(async (query: string) => {
    try {
      return await shannonExplorer.search(query);
    } catch (error) {
      console.error('Failed to search:', error);
      return null;
    }
  }, []);

  // Auto-fetch data when address changes
  useEffect(() => {
    if (address) {
      fetchAddressData(address);
    }
  }, [address, fetchAddressData]);

  // Auto-fetch network stats on mount
  useEffect(() => {
    fetchNetworkStats();
  }, [fetchNetworkStats]);

  return {
    // Data
    ...data,

    // Methods
    fetchAddressData,
    fetchContractInfo,
    fetchNetworkStats,
    getNFTActivities,
    getRealPortfolioStats,
    getTransaction,
    search,

    // Utils
    formatValue: formatSomniaValue,

    // URLs for external links
    getTransactionUrl: (hash: string) => `https://shannon-explorer.somnia.network/tx/${hash}`,
    getAddressUrl: (addr: string) => `https://shannon-explorer.somnia.network/address/${addr}`,
    getBlockUrl: (block: number) => `https://shannon-explorer.somnia.network/block/${block}`,
  };
}

// Hook for getting real-time contract activity
export function useContractActivity(contractAddress: string, refreshInterval: number = 30000) {
  const [transactions, setTransactions] = useState<ExplorerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchContractActivity = useCallback(async () => {
    if (!contractAddress) return;

    setIsLoading(true);
    try {
      const txs = await shannonExplorer.getContractTransactions(contractAddress, 1, 50);
      setTransactions(txs);
    } catch (error) {
      console.error('Failed to fetch contract activity:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress]);

  useEffect(() => {
    fetchContractActivity();

    // Set up periodic refresh
    const interval = setInterval(fetchContractActivity, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchContractActivity, refreshInterval]);

  return {
    transactions,
    isLoading,
    refresh: fetchContractActivity
  };
}

// Hook for real-time network statistics
export function useNetworkStats(refreshInterval: number = 60000) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const networkStats = await shannonExplorer.getNetworkStats();
      setStats(networkStats);
    } catch (error) {
      console.error('Failed to fetch network stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Set up periodic refresh
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return {
    stats,
    isLoading,
    refresh: fetchStats
  };
}